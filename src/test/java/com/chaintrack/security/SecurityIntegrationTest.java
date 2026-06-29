package com.chaintrack.security;

import com.chaintrack.ChaintrackApplication;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.User;
import com.chaintrack.model.Role;
import com.chaintrack.model.UserStatus;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.service.JwtBlacklistService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ChaintrackApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private JwtBlacklistService blacklistService;

    // We'll use the real UserDetailsService, not mock it
    // @MockBean
    // private UserDetailsService userDetailsService;

    private String manufacturerToken;
    private String shipperToken;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        // Clear all data before each test to avoid constraint violations
        userRepository.deleteAll();
        organizationRepository.deleteAll();

        // Create test organizations
        Organization manufacturerOrg = Organization.builder()
            .name("Test Manufacturer")
            .orgType(OrgType.MANUFACTURER)
            .build();
        organizationRepository.save(manufacturerOrg);

        Organization shipperOrg = Organization.builder()
            .name("Test Shipper")
            .orgType(OrgType.SHIPPER)
            .build();
        organizationRepository.save(shipperOrg);

        // Create test users
        User manufacturerUser = User.builder()
            .email("manufacturer@test.com")
            .passwordHash("$2a$12$hashedpassword")
            .role(Role.MANUFACTURER)
            .org(manufacturerOrg)
            .status(UserStatus.ACTIVE)
            .build();
        userRepository.save(manufacturerUser);

        User shipperUser = User.builder()
            .email("shipper@test.com")
            .passwordHash("$2a$12$hashedpassword")
            .role(Role.SHIPPER)
            .org(shipperOrg)
            .status(UserStatus.ACTIVE)
            .build();
        userRepository.save(shipperUser);

        // Generate tokens for tests
        manufacturerToken = jwtUtils.generateToken(
                org.springframework.security.core.userdetails.User.withUsername("manufacturer@test.com")
                        .password("test")
                        .roles("MANUFACTURER")
                        .build(),
                manufacturerUser.getId().toString(),
                manufacturerOrg.getId().toString(),
                "MANUFACTURER",
                UserStatus.ACTIVE.name()
        );

        shipperToken = jwtUtils.generateToken(
                org.springframework.security.core.userdetails.User.withUsername("shipper@test.com")
                        .password("test")
                        .roles("SHIPPER")
                        .build(),
                shipperUser.getId().toString(),
                shipperOrg.getId().toString(),
                "SHIPPER",
                UserStatus.ACTIVE.name()
        );
    }

    @Nested
    @DisplayName("Authentication")
    class Authentication {

        @Test
        @DisplayName("No token 401")
        void noTokenReturns401() throws Exception {
            System.out.println("SecurityContext before request: " + SecurityContextHolder.getContext().getAuthentication());
            mockMvc.perform(get("/api/admin/analytics"))
                    .andDo(result -> {
                        System.out.println("SecurityContext after request: " + SecurityContextHolder.getContext().getAuthentication());
                    })
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
            mockMvc.perform(get("/api/admin/analytics")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + shipperToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Wrong role 403 on /api/admin/users")
        void wrongRoleReturns403OnUsers() throws Exception {
            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            mockMvc.perform(get("/api/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + shipperToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("BOLA")
    class Bola {

        @Test
        @DisplayName("Accessing non-existent batch returns 404")
        void bolaReturns404() throws Exception {
            when(blacklistService.isBlacklisted(any())).thenReturn(false);
            // Use a non-existent batch ID with manufacturer token
            mockMvc.perform(get("/api/batches/00000000-0000-0000-0000-000000000000")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + manufacturerToken))
                    .andExpect(status().isNotFound());
        }
    }
    
    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

}