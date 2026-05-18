package com.chaintrack.dto.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Response returned when a movement event is created.
 * Carries the new MovementTransaction record keyed by batchId so the
 * frontend can extend the history chain.
 */
public record MovementCreateResponse(
    String movementId,
    String batchId,
    String eventType,
    String signatureHash,
    String previousHash,
    Instant createdAt,
    UUID tokenValue
) {}
