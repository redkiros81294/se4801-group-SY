#!/bin/bash
# rehash-passwords.sh
# Re-hashes seed user passwords with the correct bcrypt(12) values.
# Run against the running PostgreSQL container or any PSQL connection.
#
# Usage: ./rehash-passwords.sh [container_name]
#   container_name defaults to "chaintrack-db-1" (docker-compose service name)

CONTAINER="${1:-chaintrack-db-1}"

echo "=== Re-hashing seed user passwords ==="

docker exec "$CONTAINER" psql -U chaintrack_user -d chaintrack -v ON_ERROR_STOP=1 <<'EOSQL'
-- Fix V11 test users: should hash "Test@123!" (were incorrectly hashing "Admin@123!")
UPDATE users
SET password_hash = '$2a$12$xsa/UFYwwpOcxUl21HNNae5DPNXWiUOCAISSbDA6kWtgeYzDs06Ba'
WHERE email IN ('manufacturer@test.com', 'shipper@test.com', 'retailer@test.com');

-- Fix V13 demo users that reused the wrong hash
-- instructor@chaintrack.com -> Instructor@123
UPDATE users
SET password_hash = '$2a$12$P9.2KZcI.oR7dbskOp5Cl.iOhF0T46PjACStCENOw/K1TeE86cHYK'
WHERE email = 'instructor@chaintrack.com';

-- manufacturer@pharmacorp.com -> Manufacturer@123
UPDATE users
SET password_hash = '$2a$12$ZsAo7C/xIywdS0oa1mcU7edcMXBNFV3uABEdTPfZLOjVNha4L33My'
WHERE email = 'manufacturer@pharmacorp.com';

-- shipper@globallogistics.com -> Shipper@123
UPDATE users
SET password_hash = '$2a$12$M5FaKTI3d0SNZ0Uo.c7Fm.YKC222PVhBAtQpRvO3AvjFYvusoJi7m'
WHERE email = 'shipper@globallogistics.com';

-- retailer@mediretail.com -> Retailer@123
UPDATE users
SET password_hash = '$2a$12$hIrfATCvP4Af3h.N66J3mubZ21P/XPpETpuZGrFIO.7ilUfXHkORS'
WHERE email = 'retailer@mediretail.com';

-- Verify
SELECT email, role, status,
       left(password_hash, 20) AS hash_prefix
FROM users
WHERE email LIKE '%@%'
ORDER BY email;
EOSQL

echo "=== Done ==="
