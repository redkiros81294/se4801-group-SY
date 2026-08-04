# ChainTrack — Investor One-Pager

## The Problem
Counterfeit goods cost the global economy **over $500B per year** and endanger lives (fake medicines, food fraud, substandard parts). When recalls happen, companies take **3+ days** to trace a product back to its source — too slow for regulators and consumers. Existing traceability suites (SAP, IBM Food Trust) cost **$100K+ to deploy** and take 9–18 months to integrate.

## The Solution
**ChainTrack** is an API-first, tamper-evident provenance platform: every product movement is recorded on a **SHA-256 hash-chained ledger** that anyone can verify by scanning a QR code — no app, no login, no integration project. It delivers the compliance-grade traceability of a $100K enterprise suite at startup prices, deployable in days.

## Why It's Defensible
1. **Cryptographic tamper-evidence** — the hash chain makes fraud detectable on every scan (not just "we logged it").
2. **Network effects** — a brand owner who puts ChainTrack QR codes on packaging pulls its entire supplier network onto the platform (viral B2B distribution).
3. **Regulatory tailwind** — DSCSA (pharma), FSMA 204 (food), EU FMD: regulators are *mandating* exactly this capability.

## Product Status (working today)
- ✅ Working MVP: Spring Boot API, React UI, PostgreSQL, hash-chained ledger, QR generation + browser scanning
- ✅ Public verification portal (consumer-facing, no login)
- ✅ Immutable, verifiable audit log (enterprise governance)
- ✅ RBAC + multi-org data isolation (BOLA-protected), JWT auth with revocation
- ✅ 26+ backend test files, ~75% JaCoCo coverage, CI/CD on GitHub Actions
- ✅ Docker deployment, OpenAPI docs, structured logging with request tracing

## Market
- **TAM**: global product traceability software ≈ **$4B+** by 2028 (CAGR ~13%)
- **ICP**: mid-market pharma/medical-device manufacturers, food brands, and their suppliers
- **Entry wedge**: single product-line pilot (60–90 days), expand SKU-by-SKU

## Business Model
- **SaaS subscriptions** per organization (tiered by users + scanned SKUs)
- **Per-scan verification tiers** for consumer-facing high-volume brands
- **Implementation services** for enterprise integrations (ERP/ERP-lite)
- Target: $50K–$150K ACV enterprise contracts; 75–85% gross margin

## Ask
- **Seed**: $500K for 18 months — product (audit/compliance hardening), 3 pilot customers, SOC 2 Type I, and the first 2 industry partnerships
- **Milestones**: 3 paid pilots → $100K ARR → SOC 2 Type II → Series A at $1M+ ARR

## Roadmap
| Now | 3–6 months | 6–12 months |
|---|---|---|
| Audit log, public portal, tracing | SSO/SAML + SCIM, multi-tenant hardening | API v2, offline/mobile scanning SDK, integrations (SAP/Odoo), data residency |
| Pilot playbook + demo mode | Recalls/alerting workflows | Regulatory reporting packs (DSCSA/FSMA) |

## Team
Yared Kiros & Simon Mesfin — full-stack engineers with the working product in this repository.
