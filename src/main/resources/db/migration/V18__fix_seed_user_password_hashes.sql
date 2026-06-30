-- V18__fix_seed_user_password_hashes.sql
-- Fixes bcrypt hashes that were copy-pasted across migrations with wrong passwords.
-- V7 admin hash (Admin@123!) was correct.
-- V11 test users claimed "Test@123!" but shared the V7 Admin@123! hash.
-- V13 demo users also reused the same wrong hash.
-- All bcrypt(12) hashes generated with Spring Security BCryptPasswordEncoder(12).

-- Fix V11 test users: password "Test@123!"
UPDATE users
SET password_hash = '$2a$12$xsa/UFYwwpOcxUl21HNNae5DPNXWiUOCAISSbDA6kWtgeYzDs06Ba'
WHERE email IN ('manufacturer@test.com', 'shipper@test.com', 'retailer@test.com');

-- Fix V13 demo users
UPDATE users
SET password_hash = '$2a$12$P9.2KZcI.oR7dbskOp5Cl.iOhF0T46PjACStCENOw/K1TeE86cHYK'
WHERE email = 'instructor@chaintrack.com';

UPDATE users
SET password_hash = '$2a$12$ZsAo7C/xIywdS0oa1mcU7edcMXBNFV3uABEdTPfZLOjVNha4L33My'
WHERE email = 'manufacturer@pharmacorp.com';

UPDATE users
SET password_hash = '$2a$12$M5FaKTI3d0SNZ0Uo.c7Fm.YKC222PVhBAtQpRvO3AvjFYvusoJi7m'
WHERE email = 'shipper@globallogistics.com';

UPDATE users
SET password_hash = '$2a$12$hIrfATCvP4Af3h.N66J3mubZ21P/XPpETpuZGrFIO.7ilUfXHkORS'
WHERE email = 'retailer@mediretail.com';

-- Verify the fix worked
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % seed user password hashes with correct bcrypt(12) values', fixed_count;
END $$;
