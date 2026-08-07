package com.chaintrack.dto.response;

import com.chaintrack.model.Role;

import java.time.Instant;
import java.util.List;

/**
 * Response returned after a successful login.
 * Contains the JWT token, basic user info (no passwordHash), and an opaque refresh token.
 */
public record LoginResponse(
    String token,
    String refreshToken,
    String userId,
    String email,
    List<Role> roles,
    Instant expiresAt
) {}
