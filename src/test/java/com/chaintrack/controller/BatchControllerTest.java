package com.chaintrack.controller;

import com.chaintrack.dto.request.CreateBatchRequest;
import com.chaintrack.dto.response.BatchResponse;
import com.chaintrack.dto.response.GenerateBatchTokenResponse;
import com.chaintrack.model.*;
import com.chaintrack.service.BatchService;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.JwtBlacklistService;
import com.chaintrack.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BatchController.class)
@AutoConfigureMockMvc(addFilters = false)
class BatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BatchService batchService;

    @MockBean
    private UserService userService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private JwtBlacklistService blacklistService;

    @MockBean
    private AuthenticationManager authenticationManager;

    @Test
    @DisplayName("POST /api/batches — returns 200 with BatchResponse on success")
    void createBatch_returns200() throws Exception {
        CreateBatchRequest request = new CreateBatchRequest("prod-1", "BATCH-001", "org-1");
        Batch batch = Batch.builder()
            .id("batch-1")
            .batchNumber("BATCH-001")
            .status(BatchStatus.CREATED)
            .build();
        
        when(batchService.createBatch(any())).thenReturn(batch);

        mockMvc.perform(post("/api/batches")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":\"prod-1\",\"batchNumber\":\"BATCH-001\",\"manufacturerId\":\"org-1\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("batch-1"));
    }

    @Test
    @DisplayName("GET /api/batches/{batchId} — returns BatchResponse")
    void getBatchById_returnsBatch() throws Exception {
        Batch batch = Batch.builder()
            .id("batch-1")
            .batchNumber("BATCH-001")
            .status(BatchStatus.CREATED)
            .build();
        
        when(batchService.getBatchById("batch-1")).thenReturn(batch);

        mockMvc.perform(get("/api/batches/batch-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("batch-1"));
    }

    @Test
    @DisplayName("GET /api/batches — returns paginated list")
    void listBatches_returnsPage() throws Exception {
        Batch batch = Batch.builder()
            .id("batch-1")
            .batchNumber("BATCH-001")
            .status(BatchStatus.CREATED)
            .build();
        Page<Batch> page = new PageImpl<>(List.of(batch));
        
        when(batchService.listBatches(any())).thenReturn(page);

        mockMvc.perform(get("/api/batches"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/batches/{batchId}/qr — returns QR token")
    void generateQR_returnsToken() throws Exception {
        GenerateBatchTokenResponse resp = new GenerateBatchTokenResponse(
            "batch-1",
            java.util.UUID.randomUUID(),
            "base64qr",
            Instant.now()
        );
        
        when(batchService.generateQR("batch-1")).thenReturn(resp);

        mockMvc.perform(post("/api/batches/batch-1/qr"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.batchId").value("batch-1"));
        }
}