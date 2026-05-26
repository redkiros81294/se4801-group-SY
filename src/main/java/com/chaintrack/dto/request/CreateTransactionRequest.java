package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for creating a MovementTransaction (used when logging events).
 */
public record CreateTransactionRequest(
    @NotBlank
    String eventType,

    @NotBlank
    String batchId,

    String fromOrgId,

    String toOrgId,

    String tokenValue,

    String signatureHash,

    String previousHash
) {}
