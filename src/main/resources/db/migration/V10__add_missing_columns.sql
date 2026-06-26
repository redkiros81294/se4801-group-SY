-- V10__add_missing_columns.sql
-- Add missing created_at/updated_at to movement_transactions

-- Add missing created_at/updated_at to movement_transactions
ALTER TABLE movement_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE movement_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
