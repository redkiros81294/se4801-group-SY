package com.chaintrack.controller;

import com.chaintrack.dto.request.LogMovementRequest;
import com.chaintrack.dto.response.MovementCreateResponse;
import com.chaintrack.dto.response.MovementResponse;
import com.chaintrack.model.MovementTransaction;
import com.chaintrack.service.CreateMovementRequest;
import com.chaintrack.service.MovementTransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final MovementTransactionService movementService;

    public TransactionController(MovementTransactionService movementService) {
        this.movementService = movementService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MANUFACTURER') or hasRole('SHIPPER') or hasRole('RETAILER')")
    @ResponseStatus(HttpStatus.CREATED)
    public MovementCreateResponse logEvent(@Valid @RequestBody LogMovementRequest request) {
        CreateMovementRequest createRequest = new CreateMovementRequest() {
            @Override
            public String eventType() {
                return request.eventType().name();
            }

            @Override
            public String batchId() {
                return request.batchId();
            }

            @Override
            public String fromOrgId() {
                return request.fromOrgId();
            }

            @Override
            public String toOrgId() {
                return request.toOrgId();
            }

            @Override
            public String signatureHash() {
                return request.signatureHash();
            }

            @Override
            public String previousHash() {
                return request.previousHash();
            }

            @Override
            public String tokenValue() {
                return request.tokenValue();
            }
        };

        MovementTransaction movement = movementService.recordMovement(createRequest);
        return new MovementCreateResponse(
            movement.getId(),
            movement.getBatch() != null ? movement.getBatch().getId() : movement.getBatchId(),
            movement.getEventType().name(),
            movement.getSignatureHash(),
            movement.getPreviousHash(),
            movement.getCreatedAt(),
            null
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('MANUFACTURER') or hasRole('SHIPPER') or hasRole('RETAILER')")
    public Page<MovementResponse> getHistory(
            @RequestParam String batchId,
            @PageableDefault(size = 20) Pageable pageable) {
        List<MovementTransaction> chain = movementService.getChainForBatch(batchId);
        return Page.empty();
    }
}