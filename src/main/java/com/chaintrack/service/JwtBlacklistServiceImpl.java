package com.chaintrack.service;

import com.chaintrack.model.JwtBlacklist;
import com.chaintrack.repository.JwtBlacklistRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional(readOnly = true)
public class JwtBlacklistServiceImpl implements JwtBlacklistService {

    private final JwtBlacklistRepository blacklistRepository;

    public JwtBlacklistServiceImpl(JwtBlacklistRepository blacklistRepository) {
        this.blacklistRepository = blacklistRepository;
    }

    @Override
    @Transactional
    public void addToBlacklist(String token, long expiryTimeMillis) {
        if (token == null || token.isBlank()) {
            return;
        }
        if (blacklistRepository.existsByTokenValue(token)) {
            return;
        }
        JwtBlacklist entry = JwtBlacklist.builder()
            .tokenValue(token)
            .expiryTime(Instant.ofEpochMilli(expiryTimeMillis))
            .build();
        blacklistRepository.save(entry);
    }

    @Override
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return blacklistRepository.existsByTokenValue(token);
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 * * * ?")
    public void cleanupExpired() {
        blacklistRepository.deleteByExpiryTimeBefore(Instant.now());
    }
}