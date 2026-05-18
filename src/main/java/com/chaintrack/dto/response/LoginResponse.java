package com.chaintrack.dto.response;

import com.chaintrack.model.Role;

import java.time.Instant;
import java.util.List;

/**
 * Response returned after a successful login.
 * Contains the JWT token and basic user info (no passwordHash).
 */
public record LoginResponse(
    String token,
    String userId,
    String email,
    List<Role> roles,
    Instant expiresAt
) {}
