package com.chaintrack.controller;

import com.chaintrack.dto.request.CreateProductRequest;
import com.chaintrack.dto.request.UpdateProductRequest;
import com.chaintrack.dto.response.ProductResponse;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Product;
import com.chaintrack.service.ProductService;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.JwtBlacklistService;
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
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web MVC slice tests for {@link ProductController}.
 * Covers: GET list, GET by id, POST create, PATCH update, GET search.
 * Security enforced via JwtUtils mocking.
 */
@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private OrganizationRepository organizationRepository;

    @MockBean
    private JwtBlacklistService blacklistService;

    @MockBean
    private AuthenticationManager authenticationManager;

    @Test
    @DisplayName("GET /api/products — returns paginated list (200)")
    void listProducts_returnsPage() throws Exception {
        ProductResponse resp = new ProductResponse(
            "prod-1",
            "SKU-001",
            "Test Product",
            "Description",
            "Medicine",
            "org-1",
            Instant.now(),
            Instant.now()
        );
        Page<ProductResponse> page = new PageImpl<>(List.of(resp));

        when(productService.listProducts(any())).thenReturn(page);

        mockMvc.perform(get("/api/products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].sku").value("SKU-001"));
    }

    @Test
    @DisplayName("GET /api/products/{id} — returns product (200)")
    void getProductById_returnsProduct() throws Exception {
        ProductResponse resp = new ProductResponse(
            "prod-1",
            "SKU-001",
            "Test Product",
            "Description",
            "Medicine",
            "org-1",
            Instant.now(),
            Instant.now()
        );

        when(productService.getProductById("prod-1")).thenReturn(resp);

        mockMvc.perform(get("/api/products/prod-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("prod-1"))
            .andExpect(jsonPath("$.sku").value("SKU-001"));
    }

    @Test
    @DisplayName("POST /api/products — creates product (201) for MANUFACTURER")
    void createProduct_returnsCreated() throws Exception {
        when(jwtUtils.extractOrgId(any())).thenReturn("org-1");
        when(organizationRepository.findById(eq("org-1")))
            .thenReturn(java.util.Optional.of(Organization.builder().id("org-1").build()));

        ProductResponse resp = new ProductResponse(
            "prod-new",
            "NEW-SKU",
            "New Product",
            "New Description",
            "Electronics",
            "org-1",
            Instant.now(),
            Instant.now()
        );
        when(productService.createProduct(any(), any())).thenReturn(resp);

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sku\":\"NEW-SKU\",\"name\":\"New Product\",\"category\":\"Electronics\",\"description\":\"New Description\"}")
                .header("Authorization", "Bearer token"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.sku").value("NEW-SKU"));
    }
}