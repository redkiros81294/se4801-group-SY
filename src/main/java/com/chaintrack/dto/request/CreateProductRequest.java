package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a new Product (MANUFACTURER only).
 */
public record CreateProductRequest(
    @NotBlank @Size(max = 100)
    String sku,

    @NotBlank @Size(max = 255)
    String name,

    @Size(max = 255)
    String category,

    @Size(max = 1000)
    String description,

    String manufacturerId
) {}
