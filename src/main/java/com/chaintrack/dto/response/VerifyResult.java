package com.chaintrack.dto.response;

import java.util.List;

/**
 * Returned by POST /v1/verify.
 */
public record VerifyResult(
    boolean valid,
    String productName,
    String sku,
    String batchNumber,
    String status,
    List<MovementResponse> chain
) {}
