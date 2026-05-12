package com.chaintrack.security;

import java.util.List;

public class JwtUtils {

    public static String generateToken(String username, List<String> roles) {
        return null;
    }

    public static boolean validateToken(String token) {
        return false;
    }
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
=======
import java.util.List;

public class JwtUtils {

    public static String generateToken(String username, List<String> roles) {
        return null;
    }

    public static boolean validateToken(String token) {
        return false;
>>>>>>> 0640cb1e653b2f122bf8393427a9983f2355549a
    }
}