package com.chaintrack.dto.request;

import com.chaintrack.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Registration request — creates a new user bound to one organization.
 * Password will be BCrypt(12) hashed before storage.
 */
public record RegisterRequest(
    @Email @NotBlank @Size(max = 255)
    String email,

    @NotBlank
    String password,

    @NotNull
    Role role,

    @NotNull
    String orgId
) {}
