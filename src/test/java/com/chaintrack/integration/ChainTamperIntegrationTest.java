package com.chaintrack.integration;

import com.chaintrack.ChaintrackApplication;
import com.chaintrack.dto.request.LogMovementRequest;
import com.chaintrack.model.*;
import com.chaintrack.model.MovementTransaction.EventType;
import com.chaintrack.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test for chain tampering detection.
 * Manually corrupts signature_hash in the database to verify
 * that /api/verify/{token} returns chainValid=false with COMPROMISED status.
 */
@SpringBootTest(classes = ChaintrackApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ChainTamperIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private MovementTransactionRepository movementTransactionRepository;

    @Autowired
    private QRTokenRepository qrTokenRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String manufacturerToken;
    private String orgId;
    private String productId;
    private String batchId;
    private String tokenValue;

    @BeforeEach
    void setUp() throws Exception {
        // Create organization
        Organization org = Organization.builder()
            .name("Tamper Test Manufacturer")
            .orgType(Organization.OrgType.MANUFACTURER)
            .build();
        Organization savedOrg = organizationRepository.save(org);
        orgId = savedOrg.getId().toString();

        // Register user
        String registerJson = """
            {
                "email": "tamper-test@test.com",
                "password": "SecurePass123!",
                "role": "MANUFACTURER",
                "orgId": "%s"
            }
            """.formatted(orgId);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson));

        // Login
        String loginJson = """
            {
                "username": "tamper-test@test.com",
                "password": "SecurePass123!"
            }
            """;

        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode jsonNode = objectMapper.readTree(response);
        manufacturerToken = jsonNode.get("token").asText();
    }

    @Test
    @DisplayName("Chain tamper detection — corrupted signature returns COMPROMISED")
    void chainTamperDetection_returnsCompromised() throws Exception {
        // Step 1: Create product
        String createProductJson = """
            {
                "sku": "TAMPER-TEST-SKU",
                "name": "Tamper Test Product",
                "category": "Medicine",
                "description": "Product for tamper testing"
            }
            """;

        String productResponse = mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createProductJson)
                .header("Authorization", "Bearer " + manufacturerToken))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode productNode = objectMapper.readTree(productResponse);
        productId = productNode.get("id").asText();

        // Step 2: Create batch
        String createBatchJson = """
            {
                "productId": "%s",
                "batchNumber": "TAMPER-BATCH",
                "manufacturerId": "%s"
            }
            """.formatted(productId, orgId);

        String batchResponse = mockMvc.perform(post("/api/batches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBatchJson)
                .header("Authorization", "Bearer " + manufacturerToken))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode batchNode = objectMapper.readTree(batchResponse);
        batchId = batchNode.get("id").asText();

        // Step 3: Generate QR
        String qrResponse = mockMvc.perform(post("/api/batches/" + batchId + "/qr")
                .header("Authorization", "Bearer " + manufacturerToken))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode qrNode = objectMapper.readTree(qrResponse);
        tokenValue = qrNode.get("tokenValue").asText();

        // Step 4: Verify clean chain (should be valid)
        mockMvc.perform(get("/api/verify/" + tokenValue))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.valid").value(true));

        // Step 5: CORRUPT the signature_hash directly in the database
        // Find any existing transactions or create one
        var transactions = movementTransactionRepository.findAll();
        if (transactions.isEmpty()) {
            // Create a genesis movement to tamper with
            MovementTransaction genesis = MovementTransaction.builder()
                .eventType(EventType.MANUFACTURED)
                .eventTimestamp(Instant.now())
                .fromOrgId(null)
                .toOrgId(orgId)
                .batch(batchRepository.findById(java.util.UUID.fromString(batchId)).orElseThrow())
                .signatureHash("original_hash_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
                .previousHash("GENESIS")
                .build();
            movementTransactionRepository.saveAndFlush(genesis);
        }
        
        // Corrupt the first transaction's signature
        MovementTransaction tx = movementTransactionRepository.findAll().get(0);
        tx.setSignatureHash("tampered_hash_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        movementTransactionRepository.saveAndFlush(tx);

        // Step 6: Verify chain now shows COMPROMISED (valid=false)
        mockMvc.perform(get("/api/verify/" + tokenValue))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.valid").value(false));
    }
}