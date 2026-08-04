# ChainTrack — Security & Compliance Posture

This document is the security story buyers and investors ask for. It maps implemented controls to common frameworks (OWASP ASVS / SOC 2) and lists what remains for certification.

## 1. Implemented Controls

### Authentication & Session Management
- **JWT (stateless)**: HS256 via JJWT 0.12.6; token carries `userId`, `orgId`, `role`, `status`.
- **Logout/revocation**: tokens are blacklisted in `jwt_blacklist` with expiry; `JwtAuthFilter` rejects blacklisted tokens (revoked tokens cannot be re-used).
- **Password policy**: BCrypt(12); `change-password` verifies the current password and revokes the current session.
- **Fail-fast secret**: the `prod` profile refuses to start when `JWT_SECRET` is missing or < 32 characters (no hardcoded fallback secret).
- **Login rate limiting**: Bucket4j per-client limit, honoring `X-Forwarded-For` behind proxies; bounded bucket map (no unbounded memory growth).

### Authorization (RBAC + object-level)
- **Role gates** on every mutation: `@PreAuthorize("hasRole(...)")` (ADMIN / MANUFACTURER / SHIPPER / RETAILER).
- **Object-level (BOLA) protections**:
  - `GET /api/batches` returns only the caller's org unless ADMIN.
  - `POST /api/batches/{id}/qr` and status changes verify the caller's org owns the batch.
  - Product updates are owner-scoped.
- **Admin-only**: user management, invitations, analytics, audit log.

### Data Integrity (the product's core)
- **Movement ledger**: SHA-256 hash chain, re-verified on every public scan; tampering persists `COMPROMISED` status.
- **Audit log**: append-only, hash-chained, admin-verifiable (`/api/admin/audit/verify`); records actor, action, entity, IP, correlation id.
- Timestamps hashed at microsecond precision to guarantee write/read hash equality.

### Transport & Hardening
- HSTS (includeSubDomains, 1 year), CSP (`frame-ancestors 'none'`), XSS protection headers.
- CORS allow-list (explicit origins, credentials).
- Structured logging includes correlation ids; raw JWT tokens are **never** logged.

## 2. Threat Model (selected)

| Threat | Mitigation |
|---|---|
| Token forgery | Strong secret enforcement (fail-fast), HS256 |
| Replay of revoked token | Blacklist checked on every request |
| Brute-force login | Bucket4j rate limiting + IP trust via X-Forwarded-For |
| Broken object access (BOLA) | Org-scoped queries + ownership checks |
| Data tampering (movements/audit) | Hash chains + verification endpoints |
| Mass-assignment / invalid input | DTOs with Bean Validation, 400s on bad input |
| Log injection | Correlation ids length-bounded; structured logging |
| Unbounded rate-limit map | Bounded bucket map |

## 3. Compliance Roadmap (SOC 2 / ISO 27001 readiness)

**Documented/present now:**
- Access control (RBAC), audit logging (immutable), integrity verification, transport encryption, rate limiting, backup-able PostgreSQL (Docker/CI).

**Needed for SOC 2 Type I (typically 1–3 months):**
1. **SSO / SAML / OIDC** + SCIM provisioning (Okta, Entra ID) — *top buyer ask*.
2. **Data residency / region pinning** + customer-managed keys (CMEK).
3. **Incident response & vulnerability management docs** (SBOM generation, dependency scanning in CI).
4. **Formal policies**: password/access policies, data retention schedule, backup & restore testing evidence.
5. **Penetration test** by an external firm.
6. **99.9% SLA telemetry** (uptime dashboards, alerting).

**Recommended service choices when ready:**
- Identity: Keycloak (self-host) or Auth0/Okta (managed) with OIDC into Spring Security.
- Monitoring: Prometheus/Grafana (metrics) + Sentry (frontend errors).
- Secrets: cloud vault / managed secrets manager; never in the repo.

## 4. Operations Notes
- Database backups: configure PITR with the hosting provider (Render/Railway support it); restore drills quarterly.
- Flyway: `ddl-auto=none`; all schema changes are versioned migrations (V1–V9+).
- Secrets: all via environment variables; the app has **no** default production credentials.
