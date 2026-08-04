package com.chaintrack.service;

import com.chaintrack.model.AuditLog;
import com.chaintrack.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Append-only audit trail with per-row SHA-256 chaining.
 *
 * <p>Each entry's {@code integrityHash} covers the entry's own fields plus the
 * previous entry's hash. {@link #verifyIntegrity()} recomputes the chain and
 * reports the first index that does not match, if any — detecting both edits
 * (a row's hash no longer matches its content) and deletions (the chain link
 * to the next row breaks).
 */
@Service
public class AuditLogService {

    public static final String GENESIS = "GENESIS";

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog record(String actor, String action, String entityType,
                           String entityId, String summary, String ipAddress, String requestId) {
        String previousHash = auditLogRepository.findTopByOrderByCreatedAtDesc()
            .map(AuditLog::getIntegrityHash)
            .orElse(GENESIS);

        Instant now = Instant.now();
        String integrityHash = computeHash(actor, action, entityType, entityId,
            summary, ipAddress, requestId, now, previousHash);

        AuditLog entry = AuditLog.builder()
            .actor(actor)
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .summary(summary)
            .ipAddress(ipAddress)
            .requestId(requestId)
            .createdAt(now)
            .previousHash(previousHash)
            .integrityHash(integrityHash)
            .build();

        return auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> list(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> list(String actor, String action, String entityType, Pageable pageable) {
        boolean hasActor = actor != null && !actor.isBlank();
        boolean hasAction = action != null && !action.isBlank();
        boolean hasEntity = entityType != null && !entityType.isBlank();

        if (hasActor && hasAction) {
            // Combined filter falls back to actor-only (kept simple; extend if needed)
            return auditLogRepository.findByActorContainingIgnoreCase(actor, pageable);
        }
        if (hasActor) return auditLogRepository.findByActorContainingIgnoreCase(actor, pageable);
        if (hasAction) return auditLogRepository.findByAction(action, pageable);
        if (hasEntity) return auditLogRepository.findByEntityType(entityType, pageable);
        return auditLogRepository.findAll(pageable);
    }

    /**
     * Recomputes the hash chain over every entry in chronological order.
     *
     * @return a map with {@code intact} (boolean), {@code entries} (count), and
     *         {@code firstBrokenIndex} (0-based index of the first mismatch, or -1)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> verifyIntegrity() {
        List<AuditLog> entries = auditLogRepository.findAll(
            org.springframework.data.domain.Sort.by("createdAt").ascending()
        );

        String previousHash = GENESIS;
        int firstBroken = -1;

        for (int i = 0; i < entries.size(); i++) {
            AuditLog e = entries.get(i);
            String expected = computeHash(e.getActor(), e.getAction(), e.getEntityType(),
                e.getEntityId(), e.getSummary(), e.getIpAddress(), e.getRequestId(),
                e.getCreatedAt(), previousHash);
            if (!expected.equals(e.getIntegrityHash())) {
                firstBroken = i;
                break;
            }
            previousHash = e.getIntegrityHash();
        }

        return Map.of(
            "intact", firstBroken == -1,
            "entries", entries.size(),
            "firstBrokenIndex", firstBroken
        );
    }

    private String computeHash(String actor, String action, String entityType, String entityId,
                               String summary, String ipAddress, String requestId,
                               Instant createdAt, String previousHash) {
        String raw = String.join("|",
            nullSafe(actor), nullSafe(action), nullSafe(entityType), nullSafe(entityId),
            nullSafe(summary), nullSafe(ipAddress), nullSafe(requestId),
            nullSafe(createdAt == null ? null : createdAt.toString()),
            nullSafe(previousHash));
        return sha256(raw);
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
