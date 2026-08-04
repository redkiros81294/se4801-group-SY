-- V7__create_jwt_blacklist.sql
-- Revoked JWT tokens for logout / forced re-login. Entries are cleaned up
-- hourly by JwtBlacklistServiceImpl after their expiry_time passes.

CREATE TABLE jwt_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_value VARCHAR(500) NOT NULL UNIQUE,
    expiry_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jwt_blacklist_expiry ON jwt_blacklist (expiry_time);
CREATE INDEX idx_jwt_blacklist_token ON jwt_blacklist (token_value);
