-- V17__fix_enum_type_mismatch.sql
-- Convert native PostgreSQL ENUMs to VARCHAR to resolve Hibernate EnumType.STRING compatibility issues
-- This ensures compatibility between PostgreSQL (prod) and H2 (test/dev) without requiring database-specific casts

-- Fix users table status column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status' AND udt_name = 'user_status'
    ) THEN
        -- Drop default before changing type
        ALTER TABLE users ALTER COLUMN status DROP DEFAULT;
        -- Convert column to VARCHAR
        ALTER TABLE users ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
        -- Set new default as String
        ALTER TABLE users ALTER COLUMN status SET DEFAULT 'PENDING';
        RAISE NOTICE 'Converted users.status from user_status ENUM to VARCHAR(20)';
    END IF;
END $$;

-- Fix batches table status column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'batches' AND column_name = 'status' AND udt_name = 'batch_status'
    ) THEN
        -- Drop default before changing type
        ALTER TABLE batches ALTER COLUMN status DROP DEFAULT;
        -- Convert column to VARCHAR
        ALTER TABLE batches ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
        -- Set new default as String
        ALTER TABLE batches ALTER COLUMN status SET DEFAULT 'CREATED';
        RAISE NOTICE 'Converted batches.status from batch_status ENUM to VARCHAR(20)';
    END IF;
END $$;

-- Optional: Drop the enum types if they are no longer used by any other columns
-- We'll keep them for now to avoid any risk if other tables (even outside this app) use them,
-- but typically we could DROP TYPE user_status; DROP TYPE batch_status;
