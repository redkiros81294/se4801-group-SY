-- Add performance indexes

CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_products_sku ON products(sku);

CREATE INDEX idx_batches_batch_number ON batches(batch_number);

CREATE INDEX idx_movement_transactions_batch_id_timestamp ON movement_transactions(batch_id, timestamp);