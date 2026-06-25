-- V10__fix_missing_created_at_and_qr_image.sql
-- Add missing created_at/updated_at to movement_transactions
-- Rename qr_image_base64 to qr_image in qr_tokens (entity uses qr_image)

-- Add missing created_at/updated_at to movement_transactions
ALTER TABLE movement_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE movement_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Rename qr_image_base64 to qr_image using DO block (PostgreSQL compatible)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_tokens' AND column_name = 'qr_image_base64'
    ) THEN
        ALTER TABLE qr_tokens RENAME COLUMN qr_image_base64 TO qr_image;
    END IF;
END $$;
