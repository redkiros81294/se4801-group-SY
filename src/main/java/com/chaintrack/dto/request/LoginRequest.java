package com.chaintrack.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Login request payload — accepts username (email) and raw password.
 * Returns a stateless JWT token (never stored in localStorage per security
 * rules). The Frontend holds the token in React state only.
 */
public record LoginRequest(
    @Email @NotBlank
    String username,

    @NotBlank
    String password
) {}
