package com.chaintrack.service;

import com.chaintrack.model.MovementTransaction;

/**
 * Stub for CreateMovementRequest — contains only the fields needed by
 * MovementTransactionService.recordMovement and seedGenesis.
 */
public interface CreateMovementRequest {
    String eventType();
    String batchId();
    String fromOrgId();
    String toOrgId();
    String signatureHash();
    String previousHash();
    String tokenValue();   // present in POST /events
}
