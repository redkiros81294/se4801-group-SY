-- V11__seed_test_users.sql
-- Seeds test users for each role: MANUFACTURER, SHIPPER, RETAILER
-- Password is BCrypt(12) hash of "Test@123!" for all test users

-- Test MANUFACTURER user (belongs to PharmaCorp Manufacturing)
INSERT INTO users (id, email, password_hash, role, org_id, is_active, created_at, updated_at, last_login)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'manufacturer@test.com', '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 'MANUFACTURER', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', true, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Test SHIPPER user (belongs to FastTrack Logistics)
INSERT INTO users (id, email, password_hash, role, org_id, is_active, created_at, updated_at, last_login)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'shipper@test.com', '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 'SHIPPER', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', true, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Test RETAILER user (belongs to RetailPlus Inc.)
INSERT INTO users (id, email, password_hash, role, org_id, is_active, created_at, updated_at, last_login)
VALUES
    ('33333333-3333-3333-3333-333333333333', 'retailer@test.com', '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 'RETAILER', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', true, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;