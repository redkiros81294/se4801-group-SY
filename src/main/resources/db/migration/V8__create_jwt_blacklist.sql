-- V8__create_jwt_blacklist.sql
-- JWT token blacklist for logout functionality
-- Tokens are stored until their natural expiration time

CREATE TABLE jwt_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_value VARCHAR(500) NOT NULL UNIQUE,
    expiry_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jwt_blacklist_expiry ON jwt_blacklist(expiry_time);
CREATE INDEX idx_jwt_blacklist_token ON jwt_blacklist(token_value);