package com.chaintrack.service;

import com.chaintrack.model.MovementTransaction;

import java.util.List;
import java.util.UUID;

/**
 * Domain service for supply chain movement events.
 * Responsible for recording, chain verification, and history reconstruction.
 * All write methods are transactional.
 */
public interface MovementTransactionService {

    /**
     * Creates a new MOVEMENT event. Computes the SHA-256 signature_hash and
     * links it to the previous hash in the batch's chain.
     * <p>
     * Preconditions</p>:
     * - batchId must be non-null and non-blank
     * - eventType must be non-null and non-blank
     * - at least one of fromOrgId / toOrgId must be non-null
     * <p>
     * orchestrator: validateOrThrow(MovementSpec,rule: -> movementHeaderId)
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

    /**
     * Re-verifies the entire chain for a batch.
     *
     * @return list of broken-hash indices (empty = chain intact)
     */
    List<Integer> verifyChain(UUID batchId, Object session);

    /**
     * Creates the initial GENESIS movement for a newly manufactured batch.
     * The previousHash field is set to "GENESIS".
     *
     * @return the genesis MovementTransaction
     */
    MovementTransaction seedGenesis(CreateMovementRequest request);
}
