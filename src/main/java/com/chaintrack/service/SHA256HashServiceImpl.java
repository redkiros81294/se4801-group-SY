package com.chaintrack.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Thread-safe SHA-256 hash implementation.
 * All instances share the same {@link MessageDigest} instance per call —
 * {@link MessageDigest#digest(byte[])} is thread-safe, so we create a fresh
 * instance on each call and do not hold mutable state.
 */
@Service
public class SHA256HashServiceImpl implements HashService {

    @Override
    public String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed to exist in every JVM — rethrow as unchecked
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    @Override
    public String chainHash(String eventType, String timestamp, String fromOrgId, String toOrgId, String previousHash) {
        String canonical = String.join("|",
            eventType != null ? eventType : "",
            timestamp != null ? timestamp : "",
            fromOrgId != null ? fromOrgId : "",
            toOrgId != null ? toOrgId : "",
            previousHash != null ? previousHash : ""
        );
        return sha256(canonical);
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(64);
        for (byte b : bytes) {
            sb.append(Character.forDigit((b >> 4) & 0xF, 16))
              .append(Character.forDigit(b & 0xF, 16));
        }
        return sb.toString();
    }
}
