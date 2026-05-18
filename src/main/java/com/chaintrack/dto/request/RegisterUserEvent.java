package com.chaintrack.dto.request;

/**
 * EventDefinition for registering a new user account.
 * Accepts raw password which will be BCrypt(12) hashed by AuthService before
 * it reaches the repository. Never store or log the raw string.
 */
public record RegisterUserEvent(
    String email,
    String password,
    String orgId
) {}
