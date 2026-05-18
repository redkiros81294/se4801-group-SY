package com.chaintrack.dto.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Response returned after a batch QR has been generated.
 * Contains the UUID token the client must embed in the QR code image.
 */
public record GenerateBatchTokenResponse(
    String batchId,
    UUID tokenValue,
    String qrImage,    // base64-encoded PNG from ZXing
    Instant createdAt
) {}
