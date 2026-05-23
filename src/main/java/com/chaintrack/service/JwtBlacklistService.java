package com.chaintrack.service;

public interface JwtBlacklistService {
    void addToBlacklist(String token, long expiryTimeMillis);
    boolean isBlacklisted(String token);
    void cleanupExpired();
}