package com.chaintrack.controller;

import com.chaintrack.model.*;
import com.chaintrack.repository.QRTokenRepository;
import com.chaintrack.service.ChainVerificationService;
import com.chaintrack.service.MovementTransactionService;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.JwtBlacklistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VerifyController.class)
@AutoConfigureMockMvc(addFilters = false)
class VerifyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private QRTokenRepository qrTokenRepository;

    @MockBean
    private MovementTransactionService movementService;

    @MockBean
    private ChainVerificationService chainVerificationService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private JwtBlacklistService blacklistService;

    @Test
    @DisplayName("GET /api/verify/{token} — returns VerifyResult for valid token")
    void verifyByToken_returnsResult() throws Exception {
        UUID token = UUID.randomUUID();
        QRToken qrToken = QRToken.builder()
            .tokenValue(token)
            .batch(Batch.builder()
                .id("batch-1")
                .batchNumber("BATCH-001")
                .status(BatchStatus.CREATED)
                .product(Product.builder().name("Test Product").sku("SKU-001").build())
                .build())
            .build();
        
        when(qrTokenRepository.findByTokenValue(token)).thenReturn(Optional.of(qrToken));
        when(chainVerificationService.verifyChain("batch-1")).thenReturn(ChainStatus.VALID);
        when(movementService.getChainForBatch("batch-1")).thenReturn(List.of());

        mockMvc.perform(get("/api/verify/" + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.valid").value(true));
    }

    @Test
    @DisplayName("GET /api/verify/{token} — returns 404 for invalid token format")
    void verifyByToken_invalidFormat_returns404() throws Exception {
        mockMvc.perform(get("/api/verify/not-a-uuid"))
            .andExpect(status().isNotFound());
    }
}