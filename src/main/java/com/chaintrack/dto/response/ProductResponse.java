package com.chaintrack.dto.response;

import com.chaintrack.model.Organization;

import java.time.Instant;

public record ProductResponse(
    String id,
    String sku,
    String name,
    String description,
    String category,
    String manufacturerId,
    Instant createdAt,
    Instant updatedAt
) {
    public static ProductResponse fromEntity(com.chaintrack.model.Product product) {
        Organization man = product.getManufacturer();
        return new ProductResponse(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getDescription(),
            product.getCategory(),
            man != null ? man.getId() : null,
            product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }
}
