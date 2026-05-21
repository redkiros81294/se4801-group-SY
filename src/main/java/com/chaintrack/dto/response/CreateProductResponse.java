package com.chaintrack.dto.response;

import java.time.Instant;

/**
 * Response returned when a new Product is created successfully.
 * Mirrors CREATE flow: id generated + createdAt registered.
 */
public record CreateProductResponse(
    String productId,
    String productName,
    String category,
    String status,
    String sku,
    String description,
    String manufacturerName,
    String createdBy,
    Instant createdAt
) {}
