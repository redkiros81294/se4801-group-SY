package com.chaintrack.controller;

import com.chaintrack.audit.Audited;
import com.chaintrack.dto.request.CreateBatchRequest;
import com.chaintrack.dto.response.BatchResponse;
import com.chaintrack.dto.response.GenerateBatchTokenResponse;
import com.chaintrack.model.Batch;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.BatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/batches")
@Tag(name = "Batches", description = "Batch management APIs")
public class BatchController {

    private final BatchService batchService;
    private final JwtUtils jwtUtils;

    public BatchController(BatchService batchService, JwtUtils jwtUtils) {
        this.batchService = batchService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping
    @PreAuthorize("hasRole('MANUFACTURER')")
    @Audited(action = "CREATE", entityType = "BATCH", entityIdExpr = "#result?.id()")
    @Operation(summary = "Create batch", description = "Creates a new product batch")
    @ApiResponse(responseCode = "201", description = "Batch created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request data")
    @ApiResponse(responseCode = "403", description = "Forbidden - MANUFACTURER role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public BatchResponse createBatch(@Valid @RequestBody CreateBatchRequest request) {
        Batch batch = batchService.createBatch(request);
        return BatchResponse.fromEntity(batch);
    }

    @GetMapping("/{batchId}")
    @Operation(summary = "Get batch by ID", description = "Returns batch details")
    @ApiResponse(responseCode = "200", description = "Batch found")
    @ApiResponse(responseCode = "404", description = "Batch not found")
    public BatchResponse getBatchById(@PathVariable String batchId) {
        Batch batch = batchService.getBatchById(batchId);
        return BatchResponse.fromEntity(batch);
    }

    @GetMapping
    @Operation(summary = "List batches", description = "Returns paginated list of batches (ADMIN sees all; other roles see only their own organization's batches)")
    @ApiResponse(responseCode = "200", description = "Successful retrieval")
    public Page<BatchResponse> listBatches(@PageableDefault(size = 20) Pageable pageable,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

        // ADMIN sees everything; other roles are scoped to their own organization (BOLA protection)
        String role = token != null ? jwtUtils.extractRole(token) : null;
        if ("ADMIN".equals(role)) {
            return batchService.listBatches(pageable).map(BatchResponse::fromEntity);
        }

        String orgId = token != null ? jwtUtils.extractOrgId(token) : null;
        return batchService.listBatchesForOrg(orgId, pageable).map(BatchResponse::fromEntity);
    }

    @PostMapping("/{batchId}/qr")
    @PreAuthorize("hasRole('MANUFACTURER')")
    @Audited(action = "GENERATE_QR", entityType = "QR_TOKEN", entityIdExpr = "#arg0")
    @Operation(summary = "Generate QR code", description = "Generates QR token for batch (own batches only; idempotent)")
    @ApiResponse(responseCode = "200", description = "QR code generated")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "403", description = "Forbidden - MANUFACTURER role required or not the owning organization")
    @ApiResponse(responseCode = "404", description = "Batch not found")
    public GenerateBatchTokenResponse generateQR(@PathVariable String batchId,
                                                 @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        String actorOrgId = token != null ? jwtUtils.extractOrgId(token) : null;
        return batchService.generateQR(batchId, actorOrgId);
    }

    @GetMapping("/search")
    @Operation(summary = "Public batch search", description = "Search batches by batch number (public; no auth required)")
    @ApiResponse(responseCode = "200", description = "Search results")
    public Page<BatchResponse> searchPublicBatches(@RequestParam String q, @PageableDefault(size = 20) Pageable pageable) {
        return batchService.searchPublicBatches(q, pageable).map(BatchResponse::fromEntity);
    }
}