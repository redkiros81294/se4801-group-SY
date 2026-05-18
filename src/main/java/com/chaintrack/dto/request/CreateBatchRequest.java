package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for creating a new Batch (MANUFACTURER only).
 */
public record CreateBatchRequest(
    @NotBlank
    String productId,

    @NotBlank
    String batchNumber,

    @NotBlank
    String manufacturerId
) {}
