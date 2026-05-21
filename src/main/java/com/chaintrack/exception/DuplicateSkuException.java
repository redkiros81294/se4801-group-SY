package com.chaintrack.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Stub — to be fully implemented by Simon on Day 10.
 * Thrown when a caller attempts to create or update a product with a SKU that is
 * already taken by another product row.
 * Until Simon replaces this stub, callers should treat it as a business-exception
 * equivalent of {@link org.springframework.dao.DataIntegrityViolationException}.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateSkuException extends RuntimeException {
    public DuplicateSkuException(String sku) {
        super("Product SKU already exists: " + sku);
    }
}
