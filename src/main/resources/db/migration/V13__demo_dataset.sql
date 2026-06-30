-- V13__demo_dataset.sql
-- Comprehensive demo data for instructor presentation
-- Shows all roles, statuses, and supply chain states
-- Uses existing V7 org IDs (a1a1a1a1..., b2b2b2b2..., c3c3c3c3...) to avoid FK failures
-- If this migration fails, run V14 for repair
-- NOTE: Original seed hashes for V13 users were copy-pasted from V7 (matched Admin@123!).
-- V18 migration corrects these hashes. Assigned passwords are documented below.

-- ============================================================
-- ADMIN users
-- ============================================================
-- Note: admin@chaintrack.com already exists from V7 (ID: 00000000-0000-0000-0000-000000000000)
-- Skip - email already exists, use instructor@chaintrack.com instead
-- Password: Instructor@123 (fixed by V18)
INSERT INTO users (id, email, password_hash, role, org_id, status, created_at, updated_at, last_login)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'instructor@chaintrack.com', 
     '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 
     'ADMIN', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ACTIVE'::user_status, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- MANUFACTURER users (active and pending)
-- ============================================================
-- manufacturer@pharmacorp.com  -> Password: Manufacturer@123 (fixed by V18)
-- pending.manufacturer@pharmacorp.com -> Password: Pending@123 (fixed by V18)
INSERT INTO users (id, email, password_hash, role, org_id, status, invitation_token, invited_at, created_at, updated_at, last_login)
VALUES 
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'manufacturer@pharmacorp.com', 
     '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 
     'MANUFACTURER', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ACTIVE'::user_status, NULL, NULL, NOW(), NOW(), NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'pending.manufacturer@pharmacorp.com', 
     '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 
     'MANUFACTURER', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'PENDING'::user_status, 
     'pending-invite-token-manufacturer', NOW() - INTERVAL '2 days', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SHIPPER users
-- ============================================================
-- shipper@globallogistics.com -> Password: Shipper@123 (fixed by V18)
-- deactivated.shipper@globallogistics.com -> Password: Deactivated@123 (fixed by V18)
INSERT INTO users (id, email, password_hash, role, org_id, status, created_at, updated_at, last_login)
VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'shipper@globallogistics.com', 
     '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 
     'SHIPPER', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'ACTIVE'::user_status, NOW(), NOW(), NOW()),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'deactivated.shipper@globallogistics.com', 
     '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 
     'SHIPPER', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'DEACTIVATED'::user_status, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- RETAILER users
-- ============================================================
-- Note: 11111111-1111-1111-1111-111111111111 already used by V11 test user
-- retailer@mediretail.com -> Password: Retailer@123 (fixed by V18)
INSERT INTO users (id, email, password_hash, role, org_id, status, created_at, updated_at, last_login)
VALUES 
    ('eeeeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'retailer@mediretail.com', 
     '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2', 
     'RETAILER', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'ACTIVE'::user_status, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- Invitations (demonstrating invite flow)
-- ============================================================
-- Use V7 admin user (00000000-0000-0000-0000-000000000000) as inviter to ensure FK works
INSERT INTO invitations (id, email, role, org_id, invited_by, token, status, expires_at, created_at, updated_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa51', 'new.manufacturer@pharma.com', 'MANUFACTURER', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 
     '00000000-0000-0000-0000-000000000000', 'invite-token-new-manufacturer', 'PENDING', 
     NOW() + INTERVAL '5 days', NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa52', 'expired.shipper@global.com', 'SHIPPER', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
     '00000000-0000-0000-0000-000000000000', 'invite-token-expired-shipper', 'EXPIRED',
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa53', 'accepted.retailer@mediretail.com', 'RETAILER', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
     '00000000-0000-0000-0000-000000000000', 'invite-token-accepted-retailer', 'ACCEPTED',
     NOW() + INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa54', 'revoked.retailer@example.com', 'RETAILER', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
     '00000000-0000-0000-0000-000000000000', 'invite-token-revoked-retailer', 'REVOKED',
     NOW() + INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- JWT Blacklist tokens (expired/revoked tokens)
-- ============================================================
INSERT INTO jwt_blacklist (token_value, expiry_time)
VALUES 
    ('expired-token-blacklisted', NOW() - INTERVAL '1 hour'),
    ('revoked-token-blacklisted', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;