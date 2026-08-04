-- V8__seed_data.sql
-- Consolidated demo + test data (replaces the old V7/V11/V13/V14/V18 chain).
-- All bcrypt(12) hashes were generated with Spring Security's
-- BCryptPasswordEncoder(12) and verified. Movement signature hashes are REAL
-- SHA-256 values computed as H(eventType|timestamp|fromOrgId|toOrgId|previousHash)
-- over the fixed timestamps below, so the demo chains verify as VALID — except
-- batch 99999999-... whose SHIPPED hash is deliberately tampered to demo the
-- COMPROMISED detection.

-- ============================================================
-- Organizations
-- ============================================================
INSERT INTO organizations (id, name, org_type, created_at, updated_at) VALUES
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'PharmaCorp Manufacturing', 'MANUFACTURER', NOW(), NOW()),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'FastTrack Logistics', 'SHIPPER', NOW(), NOW()),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'RetailPlus Inc.', 'RETAILER', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- Users
-- ============================================================
-- Passwords: admin@chaintrack.com "Admin@123!", instructor@chaintrack.com "Instructor@123",
-- manufacturer@test.com / shipper@test.com / retailer@test.com "Test@123!",
-- manufacturer@pharmacorp.com "Manufacturer@123", shipper@globallogistics.com "Shipper@123",
-- retailer@mediretail.com "Retailer@123". PENDING/DEACTIVATED users cannot log in.
INSERT INTO users (id, email, password_hash, role, org_id, status, invitation_token, invited_at, created_at, updated_at, last_login) VALUES
    ('00000000-0000-0000-0000-000000000000', 'admin@chaintrack.com',
     '$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2',
     'ADMIN', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ACTIVE', NULL, NULL, NOW(), NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'instructor@chaintrack.com',
     '$2a$12$P9.2KZcI.oR7dbskOp5Cl.iOhF0T46PjACStCENOw/K1TeE86cHYK',
     'ADMIN', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ACTIVE', NULL, NULL, NOW(), NOW(), NOW()),
    ('11111111-1111-1111-1111-111111111111', 'manufacturer@test.com',
     '$2a$12$xsa/UFYwwpOcxUl21HNNae5DPNXWiUOCAISSbDA6kWtgeYzDs06Ba',
     'MANUFACTURER', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ACTIVE', NULL, NULL, NOW(), NOW(), NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'manufacturer@pharmacorp.com',
     '$2a$12$ZsAo7C/xIywdS0oa1mcU7edcMXBNFV3uABEdTPfZLOjVNha4L33My',
     'MANUFACTURER', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ACTIVE', NULL, NULL, NOW(), NOW(), NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'pending.manufacturer@pharmacorp.com',
     '$2a$12$xsa/UFYwwpOcxUl21HNNae5DPNXWiUOCAISSbDA6kWtgeYzDs06Ba',
     'MANUFACTURER', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'PENDING',
     'pending-invite-token-manufacturer', NOW() - INTERVAL '2 days', NOW(), NOW(), NULL),
    ('22222222-2222-2222-2222-222222222222', 'shipper@test.com',
     '$2a$12$xsa/UFYwwpOcxUl21HNNae5DPNXWiUOCAISSbDA6kWtgeYzDs06Ba',
     'SHIPPER', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'ACTIVE', NULL, NULL, NOW(), NOW(), NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'shipper@globallogistics.com',
     '$2a$12$M5FaKTI3d0SNZ0Uo.c7Fm.YKC222PVhBAtQpRvO3AvjFYvusoJi7m',
     'SHIPPER', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'ACTIVE', NULL, NULL, NOW(), NOW(), NOW()),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'deactivated.shipper@globallogistics.com',
     '$2a$12$xsa/UFYwwpOcxUl21HNNae5DPNXWiUOCAISSbDA6kWtgeYzDs06Ba',
     'SHIPPER', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'DEACTIVATED', NULL, NULL, NOW(), NOW(), NULL),
    ('33333333-3333-3333-3333-333333333333', 'retailer@test.com',
     '$2a$12$xsa/UFYwwpOcxUl21HNNae5DPNXWiUOCAISSbDA6kWtgeYzDs06Ba',
     'RETAILER', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'ACTIVE', NULL, NULL, NOW(), NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'retailer@mediretail.com',
     '$2a$12$hIrfATCvP4Af3h.N66J3mubZ21P/XPpETpuZGrFIO.7ilUfXHkORS',
     'RETAILER', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'ACTIVE', NULL, NULL, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- Invitations (demo of the invite flow states)
-- ============================================================
INSERT INTO invitations (id, email, role, org_id, invited_by, token, status, expires_at, created_at, updated_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa51', 'new.manufacturer@pharma.com', 'MANUFACTURER', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', 'invite-token-new-manufacturer', 'PENDING', NOW() + INTERVAL '5 days', NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa52', 'expired.shipper@global.com', 'SHIPPER', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '00000000-0000-0000-0000-000000000000', 'invite-token-expired-shipper', 'EXPIRED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa53', 'accepted.retailer@mediretail.com', 'RETAILER', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '00000000-0000-0000-0000-000000000000', 'invite-token-accepted-retailer', 'ACCEPTED', NOW() + INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa54', 'revoked.retailer@example.com', 'RETAILER', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '00000000-0000-0000-0000-000000000000', 'invite-token-revoked-retailer', 'REVOKED', NOW() + INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Products
-- ============================================================
INSERT INTO products (id, sku, name, description, category, manufacturer_id, created_by, created_at, updated_at) VALUES
    ('22222222-2222-2222-2222-222222222222', 'MED-PAR-001', 'Paracetamol 500mg Tablets', 'Pain relief medication, 200 tablets per bottle', 'Medicine', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'MED-IBS-002', 'Ibuprofen 400mg Capsules', 'Anti-inflammatory medication, 100 capsules per bottle', 'Medicine', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'VIT-C-003', 'Vitamin C 1000mg Chewables', 'Immune support supplements, 60 chewables per bottle', 'Supplement', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'MED-BPM-004', 'Blood Pressure Monitor', 'Digital upper arm blood pressure monitor with Bluetooth', 'Medical Device', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- Batches (one per lifecycle state)
-- ============================================================
INSERT INTO batches (id, batch_number, product_id, status, manufacturer_id, created_at, updated_at) VALUES
    ('66666666-6666-6666-6666-666666666666', 'BATCH-PAR-2024-001', '22222222-2222-2222-2222-222222222222', 'CREATED', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    ('77777777-7777-7777-7777-777777777777', 'BATCH-IBS-2024-002', '33333333-3333-3333-3333-333333333333', 'IN_TRANSIT', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
    ('88888888-8888-8888-8888-888888888888', 'BATCH-VITC-2024-003', '44444444-4444-4444-4444-444444444444', 'DELIVERED', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
    ('99999999-9999-9999-9999-999999999999', 'BATCH-BPM-2024-004', '55555555-5555-5555-5555-555555555555', 'COMPROMISED', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- QR tokens (one per batch)
-- ============================================================
INSERT INTO qr_tokens (id, token_value, qr_image, batch_id, created_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaabb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '10 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaacc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '5 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaadd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', '88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '20 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', '99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Movement transactions — REAL SHA-256 chain hashes over fixed timestamps.
-- Batches 66666666 / 77777777 / 88888888 verify VALID; batch 99999999 has a
-- deliberately tampered SHIPPED signature so QR verification reports COMPROMISED.
-- ============================================================
INSERT INTO movement_transactions (id, event_type, event_timestamp, from_org_id, to_org_id, batch_id, signature_hash, previous_hash) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', 'MANUFACTURED', '2024-05-01T10:00:00Z', NULL, 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '66666666-6666-6666-6666-666666666666', '0e5d81c4542c6e267f0b0c5f8511fc9a07467fc689654aa2088ef6f749961dff', 'GENESIS'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22', 'MANUFACTURED', '2024-05-02T10:00:00Z', NULL, 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '77777777-7777-7777-7777-777777777777', 'fce5482817612f170d776240fb5693f34fec4209594fd261ad3b03a5a0267de9', 'GENESIS'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa23', 'SHIPPED', '2024-05-03T10:00:00Z', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '77777777-7777-7777-7777-777777777777', '2573631ccbe3dbfa84323267cd9b51317cf7b077ea2ae11cf47fe2b209388314', 'fce5482817612f170d776240fb5693f34fec4209594fd261ad3b03a5a0267de9'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa33', 'MANUFACTURED', '2024-04-01T10:00:00Z', NULL, 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '88888888-8888-8888-8888-888888888888', '68e4b22d8a33ad61f2e91836328395d788f1a2024a5353c5fd5687853b1ef9bd', 'GENESIS'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa34', 'SHIPPED', '2024-04-03T10:00:00Z', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '88888888-8888-8888-8888-888888888888', 'cb14ecd2f4e07a81124069fce5709678d44577bfb00271ca1db60b1d75f70c63', '68e4b22d8a33ad61f2e91836328395d788f1a2024a5353c5fd5687853b1ef9bd'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa35', 'RECEIVED', '2024-04-05T10:00:00Z', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '88888888-8888-8888-8888-888888888888', '12418958c319f54732c068dbae3c6f3429677d94d7870a5a2a6f16cda0a1d63c', 'cb14ecd2f4e07a81124069fce5709678d44577bfb00271ca1db60b1d75f70c63'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa44', 'MANUFACTURED', '2024-05-05T10:00:00Z', NULL, 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '99999999-9999-9999-9999-999999999999', '083ef6c382d1d5fdbe3f37196540a26372509f65ac25750cc6197cd5c5d8c85d', 'GENESIS'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa45', 'SHIPPED', '2024-05-06T10:00:00Z', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '99999999-9999-9999-9999-999999999999', 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', '083ef6c382d1d5fdbe3f37196540a26372509f65ac25750cc6197cd5c5d8c85d'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa46', 'RECEIVED', '2024-05-07T10:00:00Z', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '99999999-9999-9999-9999-999999999999', '655da046d9cfd8d6fb7e7860d54d342f329b6bcb18d364e6bb0c2d41d78e9722', 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Sample blacklisted tokens (demo)
-- ============================================================
INSERT INTO jwt_blacklist (token_value, expiry_time) VALUES
    ('expired-token-blacklisted', NOW() - INTERVAL '1 hour'),
    ('revoked-token-blacklisted', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;
