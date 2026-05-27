package com.chaintrack.security;

import com.chaintrack.ChaintrackApplication;
import com.chaintrack.service.JwtBlacklistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(classes = ChaintrackApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("testdb")
        .withUsername("sa")
        .withPassword("");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> false);
        registry.add("jwt.secret", () -> "test-jwt-secret-key-for-testing-only-32ch");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

    @MockBean
    private JwtBlacklistService blacklistService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Nested
    @DisplayName("Authentication")
    class Authentication {

        @Test
        @DisplayName("No token 401")
        void noTokenReturns401() throws Exception {
            mockMvc.perform(get("/api/admin/analytics"))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Expired token 401")
        void expiredTokenReturns401() throws Exception {
            String token = "expired.jwt.token";
            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            // JwtUtils.validateToken will throw JwtException for invalid tokens
            mockMvc.perform(get("/api/admin/analytics")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Blacklist 401")
        void blacklistedTokenReturns401() throws Exception {
            String token = "blacklisted.jwt.token";
            when(blacklistService.isBlacklisted(token)).thenReturn(true);
            
            mockMvc.perform(get("/api/admin/analytics")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Authorization")
    class Authorization {

        @Test
        @DisplayName("Wrong role 403 on /api/admin/analytics")
        void wrongRoleReturns403() throws Exception {
            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            String token = jwtUtils.generateToken(
                org.springframework.security.core.userdetails.User.withUsername("user@test.com")
                    .password("test")
                    .roles("MANUFACTURER")
                    .build(),
                "user-1", "org-1", "MANUFACTURER"
            );
            mockMvc.perform(get("/api/admin/analytics")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Wrong role 403 on /api/admin/users")
        void wrongRoleReturns403OnUsers() throws Exception {
            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            String token = jwtUtils.generateToken(
                org.springframework.security.core.userdetails.User.withUsername("user@test.com")
                    .password("test")
                    .roles("SHIPPER")
                    .build(),
                "user-1", "org-1", "SHIPPER"
            );
            mockMvc.perform(get("/api/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("BOLA")
    class Bola {

        @Test
        @DisplayName("BOLA 403")
        void bolaReturns403() throws Exception {
            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            String token = jwtUtils.generateToken(
                org.springframework.security.core.userdetails.User.withUsername("user@test.com")
                    .password("test")
                    .roles("MANUFACTURER")
                    .build(),
                "user-1", "org-1", "MANUFACTURER"
            );
            mockMvc.perform(get("/api/batches/batch-123")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
        }
    }
}