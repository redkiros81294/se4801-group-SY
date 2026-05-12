-- V3__create_products_and_batches.sql
-- Creates the products and batches tables with all constraints

-- Products table (created by MANUFACTURER)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    manufacturer_id UUID NOT NULL REFERENCES organizations(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products (manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- Batch status enum type
DO $$ BEGIN
    CREATE TYPE batch_status AS ENUM ('CREATED', 'IN_TRANSIT', 'DELIVERED', 'COMPROMISED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(255) NOT NULL UNIQUE,
    product_id UUID NOT NULL REFERENCES products(id),
    status batch_status NOT NULL DEFAULT 'CREATED',
    manufacturer_id UUID NOT NULL REFERENCES organizations(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_batches_product_status ON batches (product_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches (batch_number);
CREATE INDEX IF NOT EXISTS idx_batches_manufacturer ON batches (manufacturer_id);