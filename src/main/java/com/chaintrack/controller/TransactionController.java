package com.chaintrack.controller;

import com.chaintrack.dto.request.LogMovementRequest;
import com.chaintrack.dto.response.MovementCreateResponse;
import com.chaintrack.dto.response.MovementResponse;
import com.chaintrack.model.MovementTransaction;
import com.chaintrack.service.CreateMovementRequest;
import com.chaintrack.service.MovementTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@Tag(name = "Transactions", description = "Supply chain movement transaction APIs")
public class TransactionController {

    private final MovementTransactionService movementService;

    public TransactionController(MovementTransactionService movementService) {
        this.movementService = movementService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MANUFACTURER') or hasRole('SHIPPER') or hasRole('RETAILER')")
    @Operation(summary = "Log movement event", description = "Records a supply chain event")
    @ApiResponse(responseCode = "201", description = "Event logged successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request or event transition")
    @ApiResponse(responseCode = "403", description = "Forbidden - invalid role for event type")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ResponseStatus(HttpStatus.CREATED)
    public MovementCreateResponse logEvent(@Valid @RequestBody LogMovementRequest request) {
        CreateMovementRequest createRequest = new CreateMovementRequestImpl(request);
        MovementTransaction movement = movementService.recordMovement(createRequest);
        return new MovementCreateResponse(
            movement.getId().toString(),
            movement.getBatch() != null ? movement.getBatch().getId().toString() : movement.getBatchId(),
            movement.getEventType().name(),
            movement.getSignatureHash(),
            movement.getPreviousHash(),
            movement.getCreatedAt(),
            null
        );
    }

    @GetMapping("/batch/{batchId}")
    @PreAuthorize("hasRole('MANUFACTURER') or hasRole('SHIPPER') or hasRole('RETAILER')")
    @Operation(summary = "Get transaction history", description = "Returns full provenance chain for a batch")
    @ApiResponse(responseCode = "200", description = "Transaction history retrieved")
    @ApiResponse(responseCode = "403", description = "Forbidden - role cannot access this batch")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public Page<MovementResponse> getHistory(
            @PathVariable String batchId,
            @PageableDefault(size = 20) Pageable pageable) {
        List<MovementTransaction> chain = movementService.getChainForBatch(batchId);
        List<MovementResponse> responses = chain.stream()
            .map(MovementResponse::fromEntity)
            .toList();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), responses.size());
        List<MovementResponse> pagedContent = start < responses.size()
            ? responses.subList(start, end)
            : List.of();
        return new PageImpl<>(pagedContent, pageable, responses.size());
    }

    private static record CreateMovementRequestImpl(LogMovementRequest req) implements CreateMovementRequest {
        @Override public String eventType() { return req.eventType().name(); }
        @Override public String batchId() { return req.batchId(); }
        @Override public String fromOrgId() { return req.fromOrgId(); }
        @Override public String toOrgId() { return req.toOrgId(); }
        @Override public String signatureHash() { return req.signatureHash(); }
        @Override public String previousHash() { return req.previousHash(); }
        @Override public String tokenValue() { return req.tokenValue(); }
    }
}
