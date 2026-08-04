-- V9__create_audit_log.sql
-- Immutable, hash-chained audit log.
-- Every row is append-only (no UPDATE/DELETE grants in app code) and carries an
-- integrity hash computed over the row's own fields + the previous row's hash:
--   H(actor | action | entityType | entityId | summary | ip | requestId | createdAt | previousHash)
-- An admin can recompute the chain (GET /api/admin/audit/verify) to prove that no
-- entry was tampered with or removed.

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor VARCHAR(255) NOT NULL DEFAULT 'system',
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    summary TEXT,
    ip_address VARCHAR(45),
    request_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_hash VARCHAR(64),
    integrity_hash VARCHAR(64) NOT NULL
);

CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log (actor);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
