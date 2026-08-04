-- V2__create_users.sql
-- Users table. status is a VARCHAR with a CHECK constraint (replaces the legacy
-- is_active boolean + the user_status ENUM that was added and then converted in
-- the old V12/V17 patch chain).

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'MANUFACTURER', 'SHIPPER', 'RETAILER')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'DEACTIVATED')),
    org_id UUID REFERENCES organizations(id),
    invitation_token VARCHAR(255) UNIQUE,
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_org ON users (org_id);
CREATE INDEX idx_users_status ON users (status);
