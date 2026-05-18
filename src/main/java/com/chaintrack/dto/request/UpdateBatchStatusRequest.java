package com.chaintrack.dto.request;

import com.chaintrack.model.BatchStatus;

/**
 * Request for updating a batch status (SHIPPER/SHIPPER-AT-DEPOT/IN-TRANSIT → next status).
 *
 * @param batchId    the UUID of the target batch
 * @param updatedBy  UUID of the user triggering the status change
 * @param status     the new BatchStatus value (enum, sent as String)
 * @param upnextStatus the candidate for the next supply-chain state
 * @param declineReason reason if the status change was rejected
 */
public record UpdateBatchStatusRequest(
    String batchId,
    String updatedBy,
    BatchStatus status,
    String upnextStatus,
    String declineReason
) {}
