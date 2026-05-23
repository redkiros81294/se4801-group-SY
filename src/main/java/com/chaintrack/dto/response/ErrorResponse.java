package com.chaintrack.dto.response;

import java.time.Instant;

/**
 * Standard error response structure for API errors.
 */
public record ErrorResponse(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path
) {}