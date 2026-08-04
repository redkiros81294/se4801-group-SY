package com.chaintrack.service;

import com.chaintrack.model.MovementTransaction;

import java.util.List;

/**
 * Domain service for supply chain movement events.
 * Responsible for recording and history reconstruction of the hash-chained ledger.
 * All write methods are transactional.
 */
public interface MovementTransactionService {

    /**
     * Creates a new MOVEMENT event. Computes the SHA-256 signature_hash and
     * links it to the previous hash in the batch's chain.
     * <p>
     * Preconditions:
     * - batchId must be non-null and non-blank
     * - eventType must be non-null and non-blank
     * <p>
     * The timestamp is truncated to microsecond precision before hashing so the
     * stored value round-trips through PostgreSQL exactly (see impl for details).
     *
     * @return the created MovementTransaction
     */
    MovementTransaction recordMovement(CreateMovementRequest request);

    /**
     * Reconstructs the complete hash chain for a given batch in timestamp order.
     * Returns an empty list for batches with zero movements.
     *
     * @return ordered list of events for the batch
     */
    List<MovementTransaction> getChainForBatch(String batchId);
}
