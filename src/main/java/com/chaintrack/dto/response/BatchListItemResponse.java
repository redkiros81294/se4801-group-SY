package com.chaintrack.dto.response;

import com.chaintrack.model.Batch;
import com.chaintrack.model.BatchStatus;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Product;

import java.time.Instant;

/**
 * Lightweight batch list item returned by POST /batches/{batchId}/details.
 * Avoids lazy-loading entites that would trigger N+1 queries in the listing.
 */
public record BatchListItemResponse(
    String productSku,
    String productName,
    BatchStatus status,
    Organization manufacturerOrganization,
    Instant createdAt,
    Instant updatedAt
) {
    public static BatchListItemResponse fromEntity(Batch batch) {
        Product p = batch.getProduct();
        return new BatchListItemResponse(
            p != null ? p.getSku() : null,
            p != null ? p.getName() : null,
            batch.getStatus(),
            batch.getManufacturer(),
            batch.getCreatedAt(),
            batch.getUpdatedAt()
        );
    }
}
