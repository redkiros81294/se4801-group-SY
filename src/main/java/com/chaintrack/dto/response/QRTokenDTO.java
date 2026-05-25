package com.chaintrack.dto.response;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO representing a QR token issued for a batch.
 * Used when returning token information (separate from the full QR image response).
 */
public record QRTokenDTO(
    UUID tokenValue,
    String batchId,
    String qrImage,   // base64-encoded PNG
    Instant createdAt
) {}
