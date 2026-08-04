package com.chaintrack.service;

import com.chaintrack.dto.request.CreateBatchRequest;
import com.chaintrack.dto.response.GenerateBatchTokenResponse;
import com.chaintrack.model.Batch;
import com.chaintrack.model.BatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
     * Paginated list of ALL batches (ADMIN only at the controller).
     */
    Page<Batch> listBatches(Pageable pageable);

    /**
     * Paginated list of batches owned by the caller's organization.
     * Used to scope batch visibility to the authenticated user's org (BOLA protection).
     */
    Page<Batch> listBatchesForOrg(String orgId, Pageable pageable);

    /**
     * Advances the batch status to the next supply-chain state.
     * Only the current owning organization may change status.
     */
    Batch advanceStatus(String batchId, BatchStatus nextStatus, String actorOrgId);

    /**
     * Generates (or returns the existing) QR token for a batch.
     * Only the owning manufacturer organization may call this.
     *
     * @param batchId    the batch id
     * @param actorOrgId the authenticated caller's organization id
     * @return GenerateBatchTokenResponse with token and QR image
     */
    GenerateBatchTokenResponse generateQR(String batchId, String actorOrgId);
}
