-- V6__add_performance_indexes.sql
-- Performance indexes for frequently queried columns
-- NOTE: idx_users_email is already created in V2

-- Verify all key indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches(batch_number);

CREATE INDEX IF NOT EXISTS idx_movement_transactions_batch_ts ON movement_transactions(batch_id, timestamp ASC);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_token_value ON qr_tokens(token_value);
