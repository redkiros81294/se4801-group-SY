-- V4__create_movement_transactions.sql
-- Records each supply chain event with SHA-256 hash chain

CREATE TABLE movement_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    from_org_id UUID REFERENCES organizations(id),
    to_org_id UUID REFERENCES organizations(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    signature_hash CHAR(64) NOT NULL,
    previous_hash CHAR(64) NULL,
    CONSTRAINT chk_event_type CHECK (event_type IN ('MANUFACTURED', 'SHIPPED', 'IN_TRANSIT', 'RECEIVED'))
);

-- Indexes for chain verification and shipment tracking
CREATE INDEX idx_movement_transactions_from_org ON movement_transactions(from_org_id);
CREATE INDEX idx_movement_transactions_to_org ON movement_transactions(to_org_id);
CREATE INDEX idx_movement_transactions_batch_ts ON movement_transactions(batch_id, timestamp ASC);
CREATE INDEX idx_movement_transactions_event_type ON movement_transactions(event_type);
