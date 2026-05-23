package com.chaintrack.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an invalid state transition is attempted on an entity,
 * such as transitioning a batch from CREATED directly to DELIVERED
 * (which requires intermediate SHIPPED state).
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidEventTransitionException extends RuntimeException {
    public InvalidEventTransitionException(String message) {
        super(message);
    }

    public InvalidEventTransitionException(String currentStatus, String attemptedStatus) {
        super("Invalid transition from '" + currentStatus + "' to '" + attemptedStatus + "'");
    }
}