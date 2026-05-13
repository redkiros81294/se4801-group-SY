package com.chaintrack.security;

import org.springframework.stereotype.Component;

/**
 * JWT utility class for token generation and validation.
 * <p>
 * This is a stub implementation to be completed once UserDetails and authentication flow are ready.
 * </p>
 */
@Component
public class JwtUtils {

    /**
     * Generates a JWT token for the given user details.
     * <p>
     * TODO: Implement JWT creation using JJWT library with claims, expiration, and secret signing.
     * </p>
     *
     * @param userDetails the user details
     * @return the generated JWT token
     * @throws UnsupportedOperationException until implemented
     */
    public String generateToken(Object userDetails) {
        throw new UnsupportedOperationException("generateToken not implemented yet");
    }

    /**
     * Validates the given JWT token.
     * <p>
     * TODO: Implement token validation, signature verification, expiration check, and blacklist check.
     * </p>
     *
     * @param token the JWT token to validate
     * @return true if valid, false otherwise
     * @throws UnsupportedOperationException until implemented
     */
    public boolean validateToken(String token) {
        throw new UnsupportedOperationException("validateToken not implemented yet");
    }
}