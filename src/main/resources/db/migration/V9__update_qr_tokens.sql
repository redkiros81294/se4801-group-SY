-- V9__update_qr_tokens.sql
-- Add missing updated_at and version to qr_tokens
-- Rename qr_image_base64 to qr_image in qr_tokens (entity uses qr_image)

-- Add missing updated_at to qr_tokens
ALTER TABLE qr_tokens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Add missing version column to qr_tokens (for optimistic locking)
ALTER TABLE qr_tokens ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

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
