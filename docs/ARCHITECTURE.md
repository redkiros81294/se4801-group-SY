# ChainTrack — Architecture

## System Overview

```
                    ┌────────────────────────────────────────────┐
                    │              React 19 Frontend              │
                    │  Landing · Dashboards · Scan · Public /verify│
                    └────────────────────┬───────────────────────┘
                                         │ REST (axios, JWT bearer)
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │              Spring Boot 3.5 API             │
                    │  Controllers → Services → Repositories      │
                    │  Security: JWT filter · RBAC · Rate limit    │
                    │  Auditing: @Audited aspect → audit_log      │
                    │  Tracing: CorrelationIdFilter + Micrometer   │
                    └────────────────────┬───────────────────────┘
                                         │ JPA / Flyway
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │                PostgreSQL 15                 │
                    │  organizations · users · products · batches  │
                    │  movement_transactions · qr_tokens ·         │
                    │  invitations · jwt_blacklist · audit_log     │
                    └────────────────────────────────────────────┘
```

## The Hash-Chained Ledger (core differentiator)

Every supply-chain event is a `movement_transactions` row:

```
signatureHash = SHA-256( eventType | eventTimestamp | fromOrgId | toOrgId | previousHash )
previousHash  = signatureHash of the previous event for that batch ("GENESIS" for the first)
```

- **Immutability by construction** — a `MovementTransaction` is never updated or deleted.
- **Tamper detection** — `ChainVerificationService` re-walks the chain on every `GET /api/verify/{token}` and recomputes each hash. A mismatch → the batch is persisted as `COMPROMISED`.
- **Precision contract** — timestamps are truncated to microseconds (`Instant` truncated to `MICROS`) *before* hashing because PostgreSQL stores microseconds; this guarantees the hash computed at write time matches the hash recomputed at read time.

## The Audit Log (enterprise governance)

`audit_log` is append-only and also hash-chained:

```
integrityHash = SHA-256( actor | action | entityType | entityId | summary | ip | requestId | createdAt | previousHash )
```

- The `@Audited` annotation on controllers triggers an AOP aspect (`AuditAspect`) that records the authenticated actor, action, target entity, client IP, and correlation id after the method returns — including `_FAILED` entries when a call throws.
- `GET /api/admin/audit/verify` recomputes the chain and reports the first broken index, detecting both **edits** (hash mismatch on the row itself) and **deletions** (link to the next row breaks).
- Scope today: login/logout, user admin (create/approve/reject), invites, products, batches, QR minting, movements, verification, password changes. See `@Audited` usages in `controller/`.

## Security Model

- **Stateless JWT** (JJWT 0.12.6), blacklist table for logout/revocation, `JwtAuthFilter` rejects blacklisted tokens.
- **RBAC**: `@PreAuthorize("hasRole(...)")` on every mutation; ADMIN-only audit/analytics.
- **BOLA protection**: org-scoped `GET /api/batches`, ownership checks on `generateQR`, `advanceStatus`, and product updates.
- **Rate limiting**: Bucket4j filter honoring `X-Forwarded-For`, bounded bucket map.
- **Prod JWT secret**: startup fails fast if `JWT_SECRET` is missing or < 32 chars.
- **Headers**: HSTS + CSP (`frame-ancestors 'none'`), XSS protection.
- See [SECURITY.md](SECURITY.md) for the full threat model.

## Request Tracing & Logging

- `CorrelationIdFilter` (highest precedence) reads/generates `X-Request-Id`, stores it in MDC as `reqId`, echoes it on the response.
- Micrometer Tracing (Brave bridge) provides `traceId`/`spanId` in every log line:
  `logging.pattern.level=%5p [traceId=...,spanId=...,reqId=...]`
- The audit log stores the same `requestId`, so any audit entry can be correlated to its full log trail.

## Email Delivery

- `EmailService` → Resend REST API (branded HTML invitation) when `RESEND_API_KEY` is set; otherwise falls back to SMTP (`spring.mail.*`). `EMAIL_PROVIDER` = `auto` | `resend` | `smtp`.

## Data Model (Flyway V1–V9)

| Table | Purpose |
|---|---|
| `organizations` | Companies in the chain (MANUFACTURER / SHIPPER / RETAILER) |
| `users` | Accounts (role, org, status PENDING/ACTIVE/DEACTIVATED) |
| `products` | Tracked product types (unique SKU) |
| `batches` | Production runs (status CREATED/IN_TRANSIT/DELIVERED/COMPROMISED) |
| `movement_transactions` | Hash-chained events |
| `qr_tokens` | One QR per batch (unique token) |
| `invitations` | Email invite flow (secondary to admin-direct creation) |
| `jwt_blacklist` | Revoked tokens |
| `audit_log` | Hash-chained audit trail |

## Deployment

- **Docker**: multi-stage build, non-root runtime; `docker-compose.yml` for local.
- **CI**: GitHub Actions — `backend-ci.yml` (build + tests), `deploy-frontend.yml`.
- **Prod**: Spring profile `prod` — Flyway-managed schema (`ddl-auto=none`), probes enabled, health checks.

## Performance Notes

- Indexes on hot paths: `movement_transactions(batch_id, event_timestamp)`, `qr_tokens(token_value)`, `users(email)`, `audit_log(created_at desc)`.
- The frontend is route-level code-split (lazy imports) — the main bundle drops from ~909 KB to ~290 KB.
- Scale path (documented, not yet built): connection pooling tuning, read replicas, Redis caching of verify results, and partitioning `movement_transactions` by batch.
