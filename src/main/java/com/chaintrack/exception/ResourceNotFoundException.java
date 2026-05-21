package com.chaintrack.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Stub — to be fully implemented by Simon on Day 10.
 * Thrown when a requested resource (entity) does not exist in the database.
 * Until Simon replaces this stub, callers should treat it as an
 * {@link jakarta.persistence.EntityNotFoundException} equivalent.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, String field, Object value) {
        super("%s not found with %s: %s".formatted(resource, field, value));
    }
}
