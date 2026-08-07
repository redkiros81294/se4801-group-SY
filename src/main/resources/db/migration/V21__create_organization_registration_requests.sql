-- organization registration requests (public-facing)
CREATE TABLE IF NOT EXISTS organization_registration_requests (
    id UUID PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    message VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
