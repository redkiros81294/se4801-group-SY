-- V7__seed_dev_data.sql
-- Seeds development data: 3 organizations and 1 ADMIN user
-- Password is BCrypt(12) hash of "Admin@123!" — NEVER use plaintext in production
-- This hash is correct and does not need repair (V18 only fixes V11/V13).

INSERT INTO organizations (id, name, org_type, created_at, updated_at)
VALUES
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'PharmaCorp Manufacturing', 'MANUFACTURER', NOW(), NOW()),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'FastTrack Logistics', 'SHIPPER', NOW(), NOW()),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'RetailPlus Inc.', 'RETAILER', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seed admin user (password: "Admin@123!" BCrypt(12) hash)
INSERT INTO users (id, email, password_hash, role, org_id, is_active, created_at, updated_at, last_login)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'admin@chaintrack.com', '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 'ADMIN', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', true, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;