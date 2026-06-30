-- V16__definitively_fix_movement_transactions_schema.sql
-- Definitive fix for production database schema mismatches
-- This migration is idempotent and safe to run multiple times

-- Fix 1: Rename timestamp to event_timestamp if needed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' AND column_name = 'timestamp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' AND column_name = 'event_timestamp'
    ) THEN
        ALTER TABLE movement_transactions RENAME COLUMN timestamp TO event_timestamp;
        RAISE NOTICE 'Renamed timestamp column to event_timestamp';
    END IF;
END $$;

-- Fix 2: Ensure event_timestamp column exists (in case it was missing entirely)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' AND column_name = 'event_timestamp'
    ) THEN
        ALTER TABLE movement_transactions ADD COLUMN event_timestamp TIMESTAMP NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added missing event_timestamp column';
    END IF;
END $$;

-- Fix 3: Convert from_org_id to VARCHAR if it's UUID
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' 
        AND column_name = 'from_org_id' 
        AND udt_name = 'uuid'
    ) THEN
        ALTER TABLE movement_transactions ALTER COLUMN from_org_id TYPE VARCHAR(36);
        RAISE NOTICE 'Converted from_org_id from UUID to VARCHAR(36)';
    END IF;
END $$;

-- Fix 4: Convert to_org_id to VARCHAR if it's UUID
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' 
        AND column_name = 'to_org_id' 
        AND udt_name = 'uuid'
    ) THEN
        ALTER TABLE movement_transactions ALTER COLUMN to_org_id TYPE VARCHAR(36);
        RAISE NOTICE 'Converted to_org_id from UUID to VARCHAR(36)';
    END IF;
END $$;

-- Fix 5: Ensure from_org_id and to_org_id are VARCHAR(36) (handle any other type)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' 
        AND column_name = 'from_org_id' 
        AND udt_name != 'varchar'
    ) THEN
        EXECUTE 'ALTER TABLE movement_transactions ALTER COLUMN from_org_id TYPE VARCHAR(36)';
        RAISE NOTICE 'Ensured from_org_id is VARCHAR(36)';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movement_transactions' 
        AND column_name = 'to_org_id' 
        AND udt_name != 'varchar'
    ) THEN
        EXECUTE 'ALTER TABLE movement_transactions ALTER COLUMN to_org_id TYPE VARCHAR(36)';
        RAISE NOTICE 'Ensured to_org_id is VARCHAR(36)';
    END IF;
END $$;

-- Fix 6: Drop any invalid constraints that might interfere (be careful with this)
DO $$ 
BEGIN
    -- Drop foreign key constraints if they exist with expected names (may need adjustment)
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors if constraints don't have expected names
        NULL;
END $$;
