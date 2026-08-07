package com.chaintrack.service;

import com.chaintrack.model.RefreshToken;
import com.chaintrack.model.User;
import com.chaintrack.repository.RefreshTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Revoke existing valid refresh tokens for this user to prevent token reuse
        revokeAllForUser(user.getId());
        
        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .tokenValue(UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString())
            .expiryTime(Instant.now().plusSeconds(60L * 60L * 24L * 30L)) // 30 days
            .build();
        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByTokenValue(String tokenValue) {
        return refreshTokenRepository.findByTokenValue(tokenValue);
    }

    @Override
    @Transactional
    public RefreshToken rotate(String tokenValue) {
        RefreshToken token = findByTokenValue(tokenValue)
            .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        
        if (token.isRevoked() || token.getExpiryTime().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Refresh token has expired or been revoked");
        }
        
        // Mark old token as revoked
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        
        // Create new refresh token
        return createRefreshToken(token.getUser());
    }

    @Override
    @Transactional
    public void revoke(String tokenValue) {
        findByTokenValue(tokenValue).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Override
    @Transactional
    public void revokeAllForUser(UUID userId) {
        List<RefreshToken> tokens = refreshTokenRepository.findByUserIdAndRevokedFalseAndExpiryTimeAfter(userId, Instant.now());
        tokens.forEach(token -> token.setRevoked(true));
        refreshTokenRepository.saveAll(tokens);
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 * * * ?")
    public void cleanupExpired() {
        refreshTokenRepository.deleteByExpiryTimeBefore(Instant.now());
    }
}
