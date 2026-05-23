package com.chaintrack.controller;

import com.chaintrack.dto.request.CreateBatchRequest;
import com.chaintrack.dto.response.BatchResponse;
import com.chaintrack.dto.response.GenerateBatchTokenResponse;
import com.chaintrack.model.Batch;
import com.chaintrack.service.BatchService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MANUFACTURER')")
    public BatchResponse createBatch(@Valid @RequestBody CreateBatchRequest request) {
        Batch batch = batchService.createBatch(request);
        return BatchResponse.fromEntity(batch);
    }

    @GetMapping("/{batchId}")
    public BatchResponse getBatchById(@PathVariable String batchId) {
        Batch batch = batchService.getBatchById(batchId);
        return BatchResponse.fromEntity(batch);
    }

    @GetMapping
    public Page<BatchResponse> listBatches(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Batch> batches = batchService.listBatches(pageable);
        return batches.map(BatchResponse::fromEntity);
    }

    @PostMapping("/{batchId}/qr")
    @PreAuthorize("hasRole('MANUFACTURER')")
    public GenerateBatchTokenResponse generateQR(@PathVariable String batchId) {
        return batchService.generateQR(batchId);
    }
}