package com.chaintrack.controller;

import com.chaintrack.dto.response.AdminAnalyticsResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.Role;
import com.chaintrack.model.UserStatus;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.AdminAnalyticsService;
import com.chaintrack.service.JwtBlacklistService;
import com.chaintrack.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

    @MockBean
    private UserService userService;

    @MockBean
    private AdminAnalyticsService adminAnalyticsService;

    @MockBean
    private JwtBlacklistService blacklistService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Nested
    @DisplayName("listUsers")
    class ListUsers {

        @Test
        @DisplayName("ADMIN 200")
        void listUsers_adminReturnsPage() throws Exception {
            UserResponse userResponse = new UserResponse(
                "user-1",
                "admin@test.com",
                Role.ADMIN,
                "org-1",
                UserStatus.ACTIVE,
                null,
                null,
                null,
                Instant.now(),
                Instant.now()
            );
            Page<UserResponse> page = new PageImpl<>(List.of(userResponse));

            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            when(userDetailsService.loadUserByUsername("admin@test.com"))
                .thenReturn(org.springframework.security.core.userdetails.User.withUsername("admin@test.com")
                    .password("test")
                    .roles("ADMIN")
                    .build());
            when(userService.listUsers(any())).thenReturn(page);

            mockMvc.perform(get("/api/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + generateToken("ADMIN"))
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("admin@test.com"));
        }

        @Test
        @DisplayName("non-ADMIN 403")
        void listUsers_nonAdminReturns403() throws Exception {
            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            when(userDetailsService.loadUserByUsername("manufacturer@test.com"))
                .thenReturn(org.springframework.security.core.userdetails.User.withUsername("manufacturer@test.com")
                    .password("test")
                    .roles("MANUFACTURER")
                    .build());

            mockMvc.perform(get("/api/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + generateToken("MANUFACTURER"))
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("getAnalytics")
    class GetAnalytics {

        @Test
        @DisplayName("ADMIN 200")
        void getAnalytics_returnsStats() throws Exception {
            AdminAnalyticsResponse response = new AdminAnalyticsResponse(
                3L, 10L, 20L, 30L,
                5L, 8L, 7L, 0L
            );

            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            when(userDetailsService.loadUserByUsername("admin@test.com"))
                .thenReturn(org.springframework.security.core.userdetails.User.withUsername("admin@test.com")
                    .password("test")
                    .roles("ADMIN")
                    .build());
            when(adminAnalyticsService.getAnalytics()).thenReturn(response);

            mockMvc.perform(get("/api/admin/analytics")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + generateToken("ADMIN"))
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrganizations").value(3))
                .andExpect(jsonPath("$.totalProducts").value(10))
                .andExpect(jsonPath("$.totalBatches").value(20))
                .andExpect(jsonPath("$.totalTransactions").value(30));
        }

        @Test
        @DisplayName("non-ADMIN 403")
        void getAnalytics_nonAdminReturns403() throws Exception {
            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            when(userDetailsService.loadUserByUsername("shipper@test.com"))
                .thenReturn(org.springframework.security.core.userdetails.User.withUsername("shipper@test.com")
                    .password("test")
                    .roles("SHIPPER")
                    .build());

            mockMvc.perform(get("/api/admin/analytics")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + generateToken("SHIPPER"))
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
        }
    }

    private String generateToken(String role) {
        return jwtUtils.generateToken(
            org.springframework.security.core.userdetails.User.withUsername(role.toLowerCase() + "@test.com")
                .password("test")
                .roles(role)
                .build(),
            "user-1", "org-1", role, UserStatus.ACTIVE.name()
        );
    }
}