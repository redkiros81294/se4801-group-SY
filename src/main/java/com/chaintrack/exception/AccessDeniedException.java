package com.chaintrack.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Stub — to be fully implemented by Simon on Day 10.
 * Thrown when a caller attempts an action they are not permitted to perform,
 * typically after a BOLA (Broken Object Level Authorisation) check fails.
 * Until Simon replaces this stub, callers should treat it as an
 * {@link org.springframework.security.access.AccessDeniedException} equivalent.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) {
        super(message);
    }
}
