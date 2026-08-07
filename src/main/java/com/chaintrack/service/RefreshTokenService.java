package com.chaintrack.service;

import com.chaintrack.model.RefreshToken;
import com.chaintrack.model.User;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(User user);
    Optional<RefreshToken> findByTokenValue(String tokenValue);
    RefreshToken rotate(String tokenValue);
    void revoke(String tokenValue);
    void revokeAllForUser(UUID userId);
    void cleanupExpired();
}
