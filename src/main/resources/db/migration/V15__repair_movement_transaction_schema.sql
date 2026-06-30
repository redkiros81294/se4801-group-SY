-- V15__repair_movement_transaction_schema.sql
-- Repair migration for pre-existing databases where V4 used wrong column names/types
-- Fixes: timestamp -> event_timestamp, from_org_id/to_org_id UUID -> VARCHAR

-- Rename timestamp to event_timestamp in movement_transactions (matches entity)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE movement_transactions RENAME COLUMN timestamp TO event_timestamp;
    END IF;
END $$;

-- Convert from_org_id and to_org_id to VARCHAR(36) to match entity String type
-- This is needed for pre-existing DBs where V4 created them as UUID
DO $$ 
BEGIN
    -- Drop FK constraints first if they exist
    ALTER TABLE movement_transactions DROP CONSTRAINT IF EXISTS movement_transactions_from_org_id_fkey;
    ALTER TABLE movement_transactions DROP CONSTRAINT IF EXISTS movement_transactions_to_org_id_fkey;
EXCEPTION WHEN others THEN
    -- Constraints might have different names or not exist
END $$;

DO $$ 
BEGIN
    -- Convert UUID columns to VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' AND column_name = 'from_org_id' 
        AND udt_name = 'uuid'
    ) THEN
        ALTER TABLE movement_transactions ALTER COLUMN from_org_id TYPE VARCHAR(36);
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' AND column_name = 'to_org_id' 
        AND udt_name = 'uuid'
    ) THEN
        ALTER TABLE movement_transactions ALTER COLUMN to_org_id TYPE VARCHAR(36);
    END IF;
EXCEPTION WHEN others THEN
    -- If conversion fails, continue
END $$;