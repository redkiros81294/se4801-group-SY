-- V6__add_performance_indexes.sql
-- Performance indexes for frequently queried columns
-- NOTE: idx_users_email is already created in V2

CREATE INDEX idx_products_sku ON products(sku);

CREATE INDEX idx_batches_batch_number ON batches(batch_number);

CREATE INDEX idx_movement_transactions_batch_ts ON movement_transactions(batch_id, timestamp ASC);
