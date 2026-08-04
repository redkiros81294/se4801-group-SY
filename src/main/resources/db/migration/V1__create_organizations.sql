-- V1__create_organizations.sql
-- Organizations table (the company in the supply chain).
-- org_type is stored as VARCHAR (Hibernate EnumType.STRING compatible) with a CHECK
-- constraint instead of a native ENUM (which previously caused cross-DB mismatches).

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50) NOT NULL CHECK (org_type IN ('MANUFACTURER', 'SHIPPER', 'RETAILER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_org_type ON organizations (org_type);
