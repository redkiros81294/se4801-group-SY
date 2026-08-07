-- V19__fix_movement_transactions_char_to_varchar.sql
-- Fixes Hibernate schema validation errors after V14/V15/V16 column repairs.
-- V4 created signature_hash and previous_hash as CHAR(64), but the Hibernate
-- entity expects VARCHAR(64) (String type with length=64). This migration
-- converts them to match.

-- Convert previous_hash from bpchar to varchar(64)
ALTER TABLE movement_transactions ALTER COLUMN previous_hash TYPE VARCHAR(64);

-- Convert signature_hash from bpchar to varchar(64)
ALTER TABLE movement_transactions ALTER COLUMN signature_hash TYPE VARCHAR(64);
