package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for an authenticated user changing their own password.
 * The current password is verified before the new one is applied, and the
 * current session token is revoked so the user must sign in again.
 */
public record ChangePasswordRequest(
    @NotBlank
    String currentPassword,

    @NotBlank @Size(min = 8, max = 100)
    String newPassword
) {}
