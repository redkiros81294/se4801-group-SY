package com.chaintrack.dto.response;

import com.chaintrack.model.Batch;
import com.chaintrack.model.BatchStatus;

import java.time.Instant;

/**
 * Lightweight DTO for Batch data returned at service and controller boundaries.
 */
public record BatchDTO(
    String id,
    String batchNumber,
    BatchStatus status,
    String productId,
    String manufacturerId,
    Instant createdAt,
    Instant updatedAt
) {
    public static BatchDTO fromEntity(Batch batch) {
        return new BatchDTO(
            batch.getId().toString(),
            batch.getBatchNumber(),
            batch.getStatus(),
            batch.getProduct() != null ? batch.getProduct().getId() : null,
            batch.getManufacturer() != null ? batch.getManufacturer().getId() : null,
            batch.getCreatedAt(),
            batch.getUpdatedAt()
        );
    }
}
