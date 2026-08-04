package com.chaintrack.dto.request;

import com.chaintrack.model.MovementTransaction.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for recording a supply chain movement event.
 */
public record LogMovementRequest(
    @NotNull
    EventType eventType,

    @NotBlank
    String batchId,

    String fromOrgId,
    String toOrgId,
    String signatureHash,
    String previousHash,
    String tokenValue,
    String fromLocation,
    String toLocation
) {}
