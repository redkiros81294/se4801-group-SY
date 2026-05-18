package com.chaintrack.dto.request;

import java.util.UUID;

/**
 * Request for the public token verify endpoint (POST /v1/verify).
 * Accepts raw UUID token string (the payload of the scanned QR code).
 */
public record VerifyRequest(
    UUID tokenValue
) {}
