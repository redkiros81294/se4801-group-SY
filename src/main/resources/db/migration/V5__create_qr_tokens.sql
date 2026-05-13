-- V5__create_qr_tokens.sql
-- Creates the QR token table with unique constraint on token_value and FK to batch

CREATE TABLE IF NOT EXISTS qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_value UUID NOT NULL UNIQUE,
    qr_image_base64 TEXT NOT NULL,
    batch_id UUID NOT NULL UNIQUE REFERENCES batches(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_batch ON qr_tokens (batch_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_token_value ON qr_tokens (token_value);