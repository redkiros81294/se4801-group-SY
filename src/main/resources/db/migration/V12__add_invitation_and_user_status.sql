-- V12__add_invitation_and_user_status.sql
-- Add invitation system and user status enum

-- Create user_status enum type
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'DEACTIVATED');

-- Create invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'MANUFACTURER', 'SHIPPER', 'RETAILER')),
    org_id UUID NOT NULL REFERENCES organizations(id),
    invited_by UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);

-- Add status column to users (default ACTIVE for new, migrate existing)
ALTER TABLE users ADD COLUMN status user_status NOT NULL DEFAULT 'ACTIVE'::user_status;

-- Migrate existing users based on is_active
UPDATE users SET status = CASE WHEN is_active THEN 'ACTIVE'::user_status ELSE 'DEACTIVATED'::user_status END;

-- Add invitation-related columns to users
ALTER TABLE users ADD COLUMN invitation_token VARCHAR(255);
ALTER TABLE users ADD COLUMN invited_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN invited_at TIMESTAMP;
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN rejected_at TIMESTAMP;
ALTER TABLE users ADD COLUMN rejected_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN rejection_reason VARCHAR(500);

-- Drop is_active column (replaced by status)
ALTER TABLE users DROP COLUMN is_active;