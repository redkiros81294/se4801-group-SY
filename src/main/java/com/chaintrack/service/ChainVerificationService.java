package com.chaintrack.service;

import com.chaintrack.exception.ResourceNotFoundException;
import com.chaintrack.model.Batch;
import com.chaintrack.model.ChainStatus;
import com.chaintrack.model.MovementTransaction;
import com.chaintrack.repository.BatchRepository;
import com.chaintrack.repository.MovementTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.apache.commons.lang3.StringUtils.isBlank;

/**
 * Domain service that recomputes and validates the SHA-256 hash chain for
 * any batch's {@link MovementTransaction} history.
 * <p>
 * Each movement's {@code signatureHash} must equal
 * {@code H(eventType|timestamp|fromOrgId|toOrgId|previousHash)} and the
 * {@code previousHash} pointer must exactly match the preceding transaction's
 * {@code signatureHash} (or "GENESIS").
 * </p>
 * Returns {@link ChainStatus#VALID} or {@link ChainStatus#COMPROMISED}.
 * <p>
 * This service is read-only and may be called by both authenticated flows
 * (admin analytics) and the public QR verification endpoint.
 */
@Service
@Transactional(readOnly = true)
public class ChainVerificationService {

    private final BatchRepository batchRepository;
    private final MovementTransactionRepository movementRepository;
    private final HashService hashService;

    public ChainVerificationService(BatchRepository batchRepository,
                                    MovementTransactionRepository movementRepository,
                                    HashService hashService) {
        this.batchRepository = batchRepository;
        this.movementRepository = movementRepository;
        this.hashService = hashService;
    }

    /**
     * Verifies the integrity of the entire hash-chained ledger for a batch.
     *
     * @param batchId the UUID string of the batch (never blank)
     * @return ChainStatus.VALID if every signature and link is correct,
     *         otherwise COMPROMISED
     * @throws ResourceNotFoundException if the batch does not exist
     * @throws IllegalArgumentException  if batchId is blank
     */
    public ChainStatus verifyChain(String batchId) {
        if (isBlank(batchId)) {
            throw new IllegalArgumentException("batchId must not be blank");
        }

        Batch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new ResourceNotFoundException("Batch", "id", batchId));

        List<MovementTransaction> chain =
            movementRepository.findByBatchOrderByEventTimestampAsc(batch);

        if (chain.isEmpty()) {
            return ChainStatus.VALID; // no movements recorded yet — trivially valid
        }

        List<Integer> brokenIndices = new ArrayList<>();
        String expectedPrevious = "GENESIS";

        for (int i = 0; i < chain.size(); i++) {
            MovementTransaction tx = chain.get(i);

            // 1. Check previous-hash linkage
            if (!expectedPrevious.equals(tx.getPreviousHash())) {
                brokenIndices.add(i);
            }

            // 2. Recompute the signature hash from stored fields
            String eventType = tx.getEventType() != null ? tx.getEventType().name() : "";
            String timestamp = tx.getEventTimestamp() != null
                ? tx.getEventTimestamp().toString()
                : "";
            String from = tx.getFromOrgId();
            String to = tx.getToOrgId();
            String prevForHash = tx.getPreviousHash();

            String computed = hashService.chainHash(eventType, timestamp, from, to, prevForHash);

            if (!computed.equals(tx.getSignatureHash())) {
                if (!brokenIndices.contains(i)) {
                    brokenIndices.add(i);
                }
            }

            // advance for next link
            expectedPrevious = tx.getSignatureHash();
        }

        return brokenIndices.isEmpty() ? ChainStatus.VALID : ChainStatus.COMPROMISED;
    }
}
