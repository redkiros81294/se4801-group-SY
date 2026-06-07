package com.chaintrack.dto.request;

import com.chaintrack.model.MovementTransaction.EventType;

/**
 * Request payload for recording a supply chain movement event.
 */
public record LogMovementRequest(
    EventType eventType,
    String batchId,
    String fromOrgId,
    String toOrgId,
    String signatureHash,
    String previousHash,
    String tokenValue,
    String fromLocation,
    String toLocation
) {}
