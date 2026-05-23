package com.chaintrack.controller;

import com.chaintrack.dto.response.MovementResponse;
import com.chaintrack.dto.response.VerifyResult;
import com.chaintrack.model.*;
import com.chaintrack.repository.QRTokenRepository;
import com.chaintrack.service.ChainVerificationService;
import com.chaintrack.service.MovementTransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    public VerifyResult verifyByToken(@PathVariable String token) {
        UUID tokenValue;
        try {
            tokenValue = UUID.fromString(token);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid token format");
        }

        QRToken qrToken = qrTokenRepository.findByTokenValue(tokenValue)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token not found"));

        Batch batch = qrToken.getBatch();
        Product product = batch.getProduct();
        ChainStatus chainStatus = chainVerificationService.verifyChain(batch.getId());

        List<MovementTransaction> movements = movementService.getChainForBatch(batch.getId());
        List<MovementResponse> chain = movements.stream()
            .map(MovementResponse::fromEntity)
            .toList();

        return new VerifyResult(
            chainStatus == ChainStatus.VALID,
            product != null ? product.getName() : null,
            product != null ? product.getSku() : null,
            batch.getBatchNumber(),
            batch.getStatus().name(),
            chain
        );
    }
}