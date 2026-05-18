package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request model for the QR scan route (POST /v1/action/captureMovement).
 * The browser posts the raw QR payload here during jsQR decode.
 */
public record CaptureMovementRequest(
    @NotBlank
    String tokenValue,

    @NotBlank
    String eventType,

    String fromOrgId,
    String toOrgId,
    String fromFacility,
    String toFacility,

    String location,
    String notes
) {}
