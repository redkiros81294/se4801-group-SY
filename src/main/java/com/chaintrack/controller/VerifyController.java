package com.chaintrack.controller;

import com.chaintrack.dto.response.VerifyResult;
import com.chaintrack.dto.response.MovementResponse;
import com.chaintrack.model.*;
import com.chaintrack.repository.QRTokenRepository;
import com.chaintrack.service.ChainVerificationService;
import com.chaintrack.service.MovementTransactionService;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class VerifyController {

    private final QRTokenRepository qrTokenRepository;
    private final MovementTransactionService movementService;
    private final ChainVerificationService chainVerificationService;

    public VerifyController(QRTokenRepository qrTokenRepository,
                            MovementTransactionService movementService,
                            ChainVerificationService chainVerificationService) {
        this.qrTokenRepository = qrTokenRepository;
        this.movementService = movementService;
        this.chainVerificationService = chainVerificationService;
    }

    @GetMapping("/verify/{token}")
    public ResponseEntity<VerifyResult> verifyByToken(@PathVariable String token) {
        try {
            UUID tokenValue = UUID.fromString(token);
            QRToken qrToken = qrTokenRepository.findByTokenValue(tokenValue)
                    .orElseThrow(() -> new IllegalArgumentException("Token not found"));
            
            Batch batch = qrToken.getBatch();
            Product product = batch.getProduct();
            ChainStatus chainStatus = chainVerificationService.verifyChain(batch.getId());
            
            List<MovementTransaction> movements = movementService.getChainForBatch(batch.getId());
            List<MovementResponse> chain = movements.stream()
                    .map(MovementResponse::fromEntity)
                    .toList();
            
            VerifyResult result = new VerifyResult(
                    chainStatus == ChainStatus.VALID,
                    product != null ? product.getName() : null,
                    product != null ? product.getSku() : null,
                    batch.getBatchNumber(),
                    batch.getStatus().name(),
                    chain
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}