-- V5__create_qr_tokens.sql
-- One QR token per batch (batch_id is UNIQUE). qr_image is the base64 PNG
-- (the old V5 created qr_image_base64 and V9 had to rename it).

CREATE TABLE qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_value UUID NOT NULL UNIQUE,
    qr_image TEXT NOT NULL,
    batch_id UUID NOT NULL UNIQUE REFERENCES batches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_qr_tokens_batch ON qr_tokens (batch_id);
CREATE INDEX idx_qr_tokens_token_value ON qr_tokens (token_value);
