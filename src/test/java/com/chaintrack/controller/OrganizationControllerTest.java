package com.chaintrack.controller;

import com.chaintrack.dto.request.CreateOrganizationRequest;
import com.chaintrack.dto.response.OrganizationResponse;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.OrganizationService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web MVC slice tests for {@link OrganizationController}.
 * Covers: GET list, POST create.
 */
@WebMvcTest(OrganizationController.class)
@AutoConfigureMockMvc(addFilters = false)
class OrganizationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrganizationService organizationService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private JwtBlacklistService blacklistService;

    @MockBean
    private AuthenticationManager authenticationManager;

    @Test
    @DisplayName("GET /api/organizations — returns paginated list (200)")
    void listOrganizations_returnsPage() throws Exception {
        OrganizationResponse resp = new OrganizationResponse(
            "org-1",
            "Test Org",
            OrgType.MANUFACTURER,
            Instant.now(),
            Instant.now()
        );
        Page<OrganizationResponse> page = new PageImpl<>(List.of(resp));

        when(organizationService.listOrganizations(any())).thenReturn(page);

        mockMvc.perform(get("/api/organizations"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].name").value("Test Org"));
    }

    @Test
    @DisplayName("POST /api/organizations — creates organization (201)")
    void createOrganization_returnsCreated() throws Exception {
        OrganizationResponse resp = new OrganizationResponse(
            "org-new",
            "New Organization",
            OrgType.SHIPPER,
            Instant.now(),
            Instant.now()
        );
        when(organizationService.createOrganization(any())).thenReturn(resp);

        mockMvc.perform(post("/api/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"New Organization\",\"orgType\":\"SHIPPER\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("org-new"))
            .andExpect(jsonPath("$.name").value("New Organization"));
    }
}