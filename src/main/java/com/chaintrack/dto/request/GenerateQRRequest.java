package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for generating a QR code for a batch (MANUFACTURER only).
 */
public record GenerateQRRequest(@NotBlank String batchId) {}
