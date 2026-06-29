-- V14__repair_v13_and_demo_data.sql
-- REPAIR MIGRATION - Run after manually fixing V13 in production database
-- 
-- MANUAL STEP REQUIRED ON PRODUCTION DATABASE:
-- Connect to PostgreSQL and run:
--   UPDATE flyway_schema_history SET success = true WHERE version = '13';
--   OR: DELETE FROM flyway_schema_history WHERE version = '13';
-- Then restart the application to run this migration.
--
-- This migration adds products, batches, QR tokens, and movement transactions
-- using the users/organizations already created by V7/V11/V13.

-- ============================================================
-- Products (diverse categories)
-- ============================================================
INSERT INTO products (id, name, description, category, manufacturer_id, created_by, sku, created_at, updated_at)
VALUES 
    ('22222222-2222-2222-2222-222222222222', 'Paracetamol 500mg Tablets', 
     'Pain relief medication, 200 tablets per bottle', 'Medicine',
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', 'MED-PAR-001', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Ibuprofen 400mg Capsules', 
     'Anti-inflammatory medication, 100 capsules per bottle', 'Medicine',
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', 'MED-IBS-002', NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'Vitamin C 1000mg Chewables', 
     'Immune support supplements, 60 chewables per bottle', 'Supplement',
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', 'VIT-C-003', NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'Blood Pressure Monitor', 
     'Digital upper arm blood pressure monitor with Bluetooth', 'Medical Device',
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00000000-0000-0000-0000-000000000000', 'MED-BPM-004', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================
-- Batches (all status variants)
-- ============================================================
INSERT INTO batches (id, batch_number, product_id, status, manufacturer_id, created_at, updated_at)
VALUES 
    ('66666666-6666-6666-6666-666666666666', 'BATCH-PAR-2024-001', '22222222-2222-2222-2222-222222222222', 'CREATED', 
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    ('77777777-7777-7777-7777-777777777777', 'BATCH-IBS-2024-002', '33333333-3333-3333-3333-333333333333', 'IN_TRANSIT', 
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
    ('88888888-8888-8888-8888-888888888888', 'BATCH-VITC-2024-003', '44444444-4444-4444-4444-444444444444', 'DELIVERED', 
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
    ('99999999-9999-9999-9999-999999999999', 'BATCH-BPM-2024-004', '55555555-5555-5555-5555-555555555555', 'COMPROMISED', 
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================
-- QR Tokens (for batches)
-- Note: Column was renamed from qr_image_base64 to qr_image in V9
-- ============================================================
INSERT INTO qr_tokens (id, token_value, qr_image, batch_id, created_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaabb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, 
     'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 
     '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '10 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaacc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID, 
     'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 
     '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '5 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID, 
     'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 
     '88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '20 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaee', 'dddddddd-dddd-dddd-dddd-dddddddddddd'::UUID, 
     'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 
     '99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Movement Transactions (supply chain journey)
-- ============================================================
INSERT INTO movement_transactions (id, event_type, timestamp, from_org_id, to_org_id, batch_id, signature_hash, previous_hash)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', 'MANUFACTURED', NOW() - INTERVAL '10 days', NULL, 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 
     '66666666-6666-6666-6666-666666666666', 'hash-manufactured-paracetamol-001', 'GENESIS'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22', 'MANUFACTURED', NOW() - INTERVAL '5 days', NULL, 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 
     '77777777-7777-7777-7777-777777777777', 'hash-manufactured-ibuprofen-001', 'GENESIS'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa23', 'SHIPPED', NOW() - INTERVAL '4 days', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 
     '77777777-7777-7777-7777-777777777777', 'hash-shipped-ibuprofen-002', 'hash-manufactured-ibuprofen-001'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa33', 'MANUFACTURED', NOW() - INTERVAL '20 days', NULL, 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 
     '88888888-8888-8888-8888-888888888888', 'hash-manufactured-vitc-001', 'GENESIS'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa34', 'SHIPPED', NOW() - INTERVAL '18 days', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 
     '88888888-8888-8888-8888-888888888888', 'hash-shipped-vitc-002', 'hash-manufactured-vitc-001'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa35', 'RECEIVED', NOW() - INTERVAL '15 days', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 
     '88888888-8888-8888-8888-888888888888', 'hash-received-vitc-003', 'hash-shipped-vitc-002'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa44', 'MANUFACTURED', NOW() - INTERVAL '8 days', NULL, 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 
     '99999999-9999-9999-9999-999999999999', 'hash-manufactured-bpm-001', 'GENESIS'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa45', 'SHIPPED', NOW() - INTERVAL '7 days', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 
     '99999999-9999-9999-9999-999999999999', 'tampered-hash-value-shipped', 'hash-manufactured-bpm-001'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa46', 'RECEIVED', NOW() - INTERVAL '6 days', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 
     '99999999-9999-9999-9999-999999999999', 'hash-received-bpm-003', 'tampered-hash-value-shipped')
ON CONFLICT (id) DO NOTHING;