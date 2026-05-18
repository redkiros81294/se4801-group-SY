package com.chaintrack.dto.response;

import com.chaintrack.model.MovementTransaction;
import com.chaintrack.model.MovementTransaction.EventType;

import java.time.Instant;

/**
 * A single movement event returned by the batch history endpoint
 * and the chain re-verification flow.
 */
public record MovementResponse(
    String id,
    EventType eventType,
    Instant timestamp,
    String fromOrgId,
    String toOrgId,
    String batchId,
    String signatureHash,
    String previousHash
) {
    public static MovementResponse fromEntity(MovementTransaction tx) {
        return new MovementResponse(
            tx.getId(),
            tx.getEventType(),
            tx.getEventTimestamp(),
            tx.getFromOrgId(),
            tx.getToOrgId(),
            tx.getBatchId(),
            tx.getSignatureHash(),
            tx.getPreviousHash()
        );
    }
}
