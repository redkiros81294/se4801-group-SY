-- V4__create_movement_transactions.sql

CREATE TABLE movement_transactions (
    id UUID PRIMARY KEY,
    event_type VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    from_org_id UUID REFERENCES organizations(id),
    to_org_id UUID REFERENCES organizations(id),
    batch_id UUID REFERENCES batches(id),
    signature_hash CHAR(64),
    previous_hash CHAR(64)
);

-- Indexes
CREATE INDEX idx_movement_transactions_from_org_id ON movement_transactions(from_org_id);
CREATE INDEX idx_movement_transactions_to_org_id ON movement_transactions(to_org_id);
CREATE INDEX idx_movement_transactions_batch_id ON movement_transactions(batch_id);
CREATE INDEX idx_movement_transactions_timestamp ON movement_transactions(timestamp);