package com.chaintrack.dto.response;

import com.chaintrack.model.AuditLog;

import java.time.Instant;

/**
 * Audit-log entry as returned to ADMINs. The integrity hash chain is exposed
 * so a compliance reviewer can verify the log with the /verify endpoint.
 */
public record AuditLogResponse(
    String id,
    String actor,
    String action,
    String entityType,
    String entityId,
    String summary,
    String ipAddress,
    String requestId,
    Instant createdAt,
    String previousHash,
    String integrityHash
) {
    public static AuditLogResponse fromEntity(AuditLog log) {
        return new AuditLogResponse(
            log.getId().toString(),
            log.getActor(),
            log.getAction(),
            log.getEntityType(),
            log.getEntityId(),
            log.getSummary(),
            log.getIpAddress(),
            log.getRequestId(),
            log.getCreatedAt(),
            log.getPreviousHash(),
            log.getIntegrityHash()
        );
    }
}
