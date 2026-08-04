-- V4__create_movement_transactions.sql
-- The hash-chained ledger of supply-chain events.
-- Unlike the old V4 (which created `timestamp`, UUID from/to org FKs, and CHAR(64)
-- hashes that all had to be patched by V9/V15/V16), this schema matches the entity
-- exactly:
--   - event_timestamp TIMESTAMPTZ   (entity Instant, microsecond precision)
--   - from_org_id / to_org_id VARCHAR(36)  (entity String — no FK to organizations)
--   - signature_hash / previous_hash VARCHAR(64) (hex SHA-256)

CREATE TABLE movement_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('MANUFACTURED', 'SHIPPED', 'IN_TRANSIT', 'RECEIVED')),
    event_timestamp TIMESTAMPTZ NOT NULL,
    from_org_id VARCHAR(36),
    to_org_id VARCHAR(36),
    batch_id UUID NOT NULL REFERENCES batches(id),
    signature_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movement_transactions_batch_ts ON movement_transactions (batch_id, event_timestamp);
CREATE INDEX idx_movement_transactions_from_org ON movement_transactions (from_org_id);
CREATE INDEX idx_movement_transactions_to_org ON movement_transactions (to_org_id);
CREATE INDEX idx_movement_transactions_event_type ON movement_transactions (event_type);
