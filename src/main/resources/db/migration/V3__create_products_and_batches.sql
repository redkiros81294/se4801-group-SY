-- V3__create_products_and_batches.sql
-- Products (created by a MANUFACTURER org) and Batches (one production run).
-- batches.status is VARCHAR with a CHECK constraint (was a native ENUM in the old
-- V3 that had to be converted in V17).

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    manufacturer_id UUID NOT NULL REFERENCES organizations(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_manufacturer ON products (manufacturer_id);
CREATE INDEX idx_products_category ON products (category);

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    product_id UUID NOT NULL REFERENCES products(id),
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'IN_TRANSIT', 'DELIVERED', 'COMPROMISED')),
    manufacturer_id UUID NOT NULL REFERENCES organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_batches_product_status ON batches (product_id, status);
CREATE INDEX idx_batches_batch_number ON batches (batch_number);
CREATE INDEX idx_batches_manufacturer ON batches (manufacturer_id);
