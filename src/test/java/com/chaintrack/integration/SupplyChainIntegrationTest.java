package com.chaintrack.integration;

import com.chaintrack.ChaintrackApplication;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.Role;
import com.chaintrack.model.User;
import com.chaintrack.model.UserStatus;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.ProductRepository;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.security.JwtUtils;
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

    @Autowired
    private JwtUtils jwtUtils;

    private String manufacturerToken;
    private String orgId;
    private String productId;
    private String batchId;
    private String tokenValue;

    @BeforeEach
    void setUp() throws Exception {
        // Create a manufacturer organization and user directly, get token
        Organization manufacturerOrg = Organization.builder()
            .name("Test Manufacturer Corp")
            .orgType(OrgType.MANUFACTURER)
            .build();
        Organization savedOrg = organizationRepository.save(manufacturerOrg);
        orgId = savedOrg.getId().toString();

        // Create manufacturer user directly (simulating accepted invitation)
        User manufacturer = User.builder()
            .email("manufacturer@test.com")
            .passwordHash("$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2")
            .role(Role.MANUFACTURER)
            .org(savedOrg)
            .status(UserStatus.ACTIVE)
            .build();
        User savedManufacturer = userRepository.save(manufacturer);

        // Generate token directly (skip login since password verification is complex)
        manufacturerToken = jwtUtils.generateToken(
            org.springframework.security.core.userdetails.User.withUsername("manufacturer@test.com")
                .password("test")
                .roles("MANUFACTURER")
                .build(),
            savedManufacturer.getId().toString(),
            savedOrg.getId().toString(),
            "MANUFACTURER",
            UserStatus.ACTIVE.name()
        );
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
        assertThat(organizationRepository.findById(java.util.UUID.fromString(orgId))).isPresent();
        assertThat(userRepository.findByEmail("manufacturer@test.com")).isNotNull();
    }
}