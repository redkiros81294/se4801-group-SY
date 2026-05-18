package com.chaintrack.service;

import com.chaintrack.dto.request.CreateBatchRequest;
import com.chaintrack.model.Batch;
import com.chaintrack.model.BatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing product batches across the supply chain.
 * Covers creation, status transitions (manufacturer → shipper → retailer),
 * and readonly access for supply chain participants.
 */
public interface BatchService {

    /**
     * Creates a new batch for a product (MANUFACTURER only).
     */
    Batch createBatch(CreateBatchRequest request);

    /**
     * Returns a batch with its full movement history.
     * All roles may read batched details.
     */
    Batch getBatchById(String batchId);

    /**
     * Paginated list of batches for the authenticated user's organization.
     */
    Page<Batch> listBatches(Pageable pageable);

    /**
     * Advances the batch status to the next supply-chain state.
     * Only the current owning organization may change status.
     */
    Batch advanceStatus(String batchId, BatchStatus nextStatus, String actorOrgId);

    /**
     * Returns the current stock token list for the batch.
     */
    List<String> getStockTokens(UUID batchId);
}
