package com.chaintrack.service;

/**
 * Stub for CreateMovementRequest — contains only the fields needed by
 * MovementTransactionService.recordMovement.
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
