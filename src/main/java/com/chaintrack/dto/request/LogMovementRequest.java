package com.chaintrack.dto.request;

import com.chaintrack.model.MovementTransaction.EventType;
import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for recording a supply chain movement event.
 */
public record LogMovementRequest(
    @NotBlank
    EventType eventType,

    @NotBlank
    String batchId,

    String fromOrgId,

    String toOrgId,

    @NotBlank
    String signatureHash,

    String previousHash,

    // QR token for public endpoint variant
    String tokenValue,

    // Frontend movement form variant
    String fromLocation,
    String toLocation
) {}
