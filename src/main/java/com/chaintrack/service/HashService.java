package com.chaintrack.service;

/**
 * Computes deterministic SHA-256 hashes over arbitrary input strings.
 * Used for every movement-transaction signature_hash field.
 *
 * Not a Spring service — plain interface so callers can be unit-tested
 * without any Spring context. Implementations must be thread-safe.
 */
public interface HashService {

    /**
     * Computes SHA-256 (hex, lowercase) of {@code input}.
     *
     * @param input the raw input string (never null)
     * @return 64-char lowercase hex string
     */
    String sha256(String input);

    /**
     * Computes the chain hash for a movement event.
     * <p>
     *     H = SHA-256(eventType + "|" + timestampIso + "|" + fromOrgId + "|" + toOrgId + "|" + previousHash)
     * </p>
     */
    String chainHash(String eventType, String timestamp, String fromOrgId, String toOrgId, String previousHash);
}
