package com.chaintrack.dto.response;

import com.chaintrack.model.Batch;
import com.chaintrack.model.BatchStatus;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Product;

import java.time.Instant;
import java.util.UUID;

/**
 * Read-only DTO returned by the batch detail and history endpoints.
 */
public record BatchResponse(
    String id,
    String productId,
    String productName,
    BatchStatus status,
    String manufacturerId,
    Instant createdAt,
    Instant updatedAt
) {
    public static BatchResponse fromEntity(Batch batch) {
        Product product = batch.getProduct();
        Organization man = batch.getManufacturer();
        return new BatchResponse(
            batch.getId(),
            product != null ? product.getId() : null,
            product != null ? product.getName() : null,
            batch.getStatus(),
            man != null ? man.getId() : null,
            batch.getCreatedAt(),
            batch.getUpdatedAt()
        );
    }
}
