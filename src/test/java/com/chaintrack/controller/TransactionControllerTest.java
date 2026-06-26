package com.chaintrack.controller;

import com.chaintrack.model.MovementTransaction;
import com.chaintrack.service.MovementTransactionService;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.JwtBlacklistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TransactionController.class)
@AutoConfigureMockMvc(addFilters = false)
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MovementTransactionService movementService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private JwtBlacklistService blacklistService;

    @MockBean
    private AuthenticationManager authenticationManager;

    @Test
    @DisplayName("POST /api/transactions — logs movement event (201)")
    void logEvent_returns201() throws Exception {
        MovementTransaction tx = MovementTransaction.builder()
            .id(java.util.UUID.randomUUID())
            .eventType(MovementTransaction.EventType.MANUFACTURED)
            .eventTimestamp(Instant.now())
            .signatureHash("sig-123")
            .previousHash("GENESIS")
            .build();
        
        when(movementService.recordMovement(any())).thenReturn(tx);

        mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"eventType\":\"MANUFACTURED\",\"batchId\":\"batch-1\",\"fromOrgId\":null,\"toOrgId\":null,\"signatureHash\":\"abc123\",\"previousHash\":\"prev123\",\"tokenValue\":\"token-1\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/transactions — returns history for batch")
    void getHistory_returnsList() throws Exception {
        MovementTransaction tx = MovementTransaction.builder()
            .id(java.util.UUID.randomUUID())
            .eventType(MovementTransaction.EventType.MANUFACTURED)
            .build();
        
        when(movementService.getChainForBatch("batch-1")).thenReturn(List.of(tx));
        when(movementService.recordMovement(any())).thenReturn(tx);

        mockMvc.perform(get("/api/transactions/batch/batch-1"))
            .andExpect(status().isOk());
    }
}