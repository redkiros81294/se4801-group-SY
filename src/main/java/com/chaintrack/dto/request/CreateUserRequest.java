package com.chaintrack.dto.request;

import com.chaintrack.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for an ADMIN directly creating a user account.
 * The account is ACTIVE immediately — no invitation or approval step needed.
 * The {@code password} is the temporary/initial password handed to the user.
 */
public record CreateUserRequest(
    @NotBlank @Email @Size(max = 255)
    String email,

    @NotNull
    Role role,

    @NotBlank
    String orgId,

    @NotBlank @Size(min = 8, max = 100)
    String password
) {}
