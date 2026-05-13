-- V1__create_organizations.sql
-- Creates the organizations table with OrgType enum check constraint

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_org_type CHECK (org_type IN ('MANUFACTURER', 'SHIPPER', 'RETAILER'))
);

-- Index for faster org_type lookups
CREATE INDEX IF NOT EXISTS idx_organizations_org_type ON organizations (org_type);