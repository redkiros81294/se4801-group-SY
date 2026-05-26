package com.chaintrack.dto.response;

import com.chaintrack.model.MovementTransaction;

import java.time.Instant;

/**
 * DTO for representing a movement/transaction record in API responses.
 */
public record TransactionDTO(
    String movementId,
    String batchId,
    String eventType,
    String fromOrgId,
    String toOrgId,
    String signatureHash,
    String previousHash,
    Instant eventTimestamp,
    Instant createdAt
) {
    public static TransactionDTO fromEntity(MovementTransaction tx) {
        return new TransactionDTO(
            tx.getId(),
            tx.getBatch() != null ? tx.getBatch().getId() : tx.getBatchId(),
            tx.getEventType() != null ? tx.getEventType().name() : null,
            tx.getFromOrgId(),
            tx.getToOrgId(),
            tx.getSignatureHash(),
            tx.getPreviousHash(),
            tx.getEventTimestamp(),
            tx.getCreatedAt()
        );
    }
}
