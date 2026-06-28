package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ApproveUserRequest(
    @NotBlank String adminId,
    String rejectionReason
) {}