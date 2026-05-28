package com.chaintrack.controller;

import com.chaintrack.dto.request.CreateBatchRequest;
import com.chaintrack.dto.response.BatchResponse;
import com.chaintrack.dto.response.GenerateBatchTokenResponse;
import com.chaintrack.model.Batch;
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

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MANUFACTURER')")
    @Operation(summary = "Create batch", description = "Creates a new product batch")
    @ApiResponse(responseCode = "201", description = "Batch created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request data", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden - MANUFACTURER role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public BatchResponse createBatch(@Valid @RequestBody CreateBatchRequest request) {
        Batch batch = batchService.createBatch(request);
        return BatchResponse.fromEntity(batch);
    }

    @GetMapping("/{batchId}")
    @Operation(summary = "Get batch by ID", description = "Returns batch details")
    @ApiResponse(responseCode = "200", description = "Batch found")
    @ApiResponse(responseCode = "404", description = "Batch not found", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    public BatchResponse getBatchById(@PathVariable String batchId) {
        Batch batch = batchService.getBatchById(batchId);
        return BatchResponse.fromEntity(batch);
    }

    @GetMapping
    @Operation(summary = "List batches", description = "Returns paginated list of batches")
    @ApiResponse(responseCode = "200", description = "Successful retrieval")
    public Page<BatchResponse> listBatches(@PageableDefault(size = 20) Pageable pageable) {
        Page<Batch> batches = batchService.listBatches(pageable);
        return batches.map(BatchResponse::fromEntity);
    }

    @PostMapping("/{batchId}/qr")
    @PreAuthorize("hasRole('MANUFACTURER')")
    @Operation(summary = "Generate QR code", description = "Generates QR token for batch")
    @ApiResponse(responseCode = "200", description = "QR code generated")
    @ApiResponse(responseCode = "400", description = "QR already generated", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden - MANUFACTURER role required")
    @ApiResponse(responseCode = "404", description = "Batch not found", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    public GenerateBatchTokenResponse generateQR(@PathVariable String batchId) {
        return batchService.generateQR(batchId);
    }
}