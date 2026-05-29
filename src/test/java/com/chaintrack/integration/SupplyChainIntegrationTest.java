package com.chaintrack.integration;

import com.chaintrack.ChaintrackApplication;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.ProductRepository;
import com.chaintrack.repository.UserRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = ChaintrackApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SupplyChainIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String manufacturerToken;
    private String shipperToken;
    private String retailerToken;
    private String orgId;
    private String productId;
    private String batchId;
    private String tokenValue;

    @BeforeEach
    void setUp() throws Exception {
        // Create a manufacturer organization
        Organization org = Organization.builder()
            .name("Test Manufacturer Corp")
            .orgType(OrgType.MANUFACTURER)
            .build();
        Organization savedOrg = organizationRepository.save(org);
        orgId = savedOrg.getId();

        // Register a manufacturer user
        String registerJson = """
            {
                "email": "manufacturer@test.com",
                "password": "SecurePass123!",
                "role": "MANUFACTURER",
                "orgId": "%s"
            }
            """.formatted(orgId);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson));

        // Login and get JWT token
        String loginJson = """
            {
                "username": "manufacturer@test.com",
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
    @DisplayName("Full supply chain flow: create product, batch, QR → valid chain")
    void fullSupplyChainFlow() throws Exception {
        // Step 1: Create a product
        String createProductJson = """
            {
                "sku": "PRODUCT-SKU-001",
                "name": "Test Product",
                "category": "Medicine",
                "description": "A test medicine product"
            }
            """;

        String productResponse = mockMvc.perform(post("/api/products")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createProductJson)
                    .header("Authorization", "Bearer " + manufacturerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("PRODUCT-SKU-001"))
                .andExpect(jsonPath("$.name").value("Test Product"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode productNode = objectMapper.readTree(productResponse);
        productId = productNode.get("id").asText();

        // Step 2: Create a batch for the product
        String createBatchJson = """
            {
                "productId": "%s",
                "batchNumber": "BATCH-001",
                "manufacturerId": "%s"
            }
            """.formatted(productId, orgId);

        String batchResponse = mockMvc.perform(post("/api/batches")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createBatchJson)
                    .header("Authorization", "Bearer " + manufacturerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(productId))
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode batchNode = objectMapper.readTree(batchResponse);
        batchId = batchNode.get("id").asText();

        // Step 3: Generate QR token for the batch
        String qrResponse = mockMvc.perform(post("/api/batches/" + batchId + "/qr")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + manufacturerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchId").value(batchId))
                .andExpect(jsonPath("$.tokenValue").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode qrNode = objectMapper.readTree(qrResponse);
        tokenValue = qrNode.get("tokenValue").asText();

        // Step 4: Verify the chain via the QR token
        mockMvc.perform(get("/api/verify/" + tokenValue))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.productName").value("Test Product"))
                .andExpect(jsonPath("$.sku").value("PRODUCT-SKU-001"))
                .andExpect(jsonPath("$.batchNumber").exists())
                .andExpect(jsonPath("$.chain").isArray());

        // Assert that product exists in database
        assertThat(productRepository.findBySku("PRODUCT-SKU-001")).isNotNull();
        assertThat(organizationRepository.findById(orgId)).isPresent();
        assertThat(userRepository.findByEmail("manufacturer@test.com")).isNotNull();
    }
}
