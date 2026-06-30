package com.chaintrack.controller;

import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.dto.request.InviteUserRequest;
import com.chaintrack.dto.request.AcceptInvitationRequest;
import com.chaintrack.dto.response.InvitationResponse;
import com.chaintrack.model.Invitation;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Role;
import com.chaintrack.model.UserStatus;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.InvitationService;
import com.chaintrack.service.JwtBlacklistService;
import com.chaintrack.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private InvitationService invitationService;

    @MockBean
    private JwtBlacklistService blacklistService;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private UserDetailsService userDetailsService;

    // ── invite ─────────────────────────────────────────────────────────────
    // Note: /api/auth/invite requires JWT authentication with ADMIN role.
    // Full integration test is in AuthInvitationIntegrationTest.

    @Nested
    @DisplayName("POST /api/auth/invite")
    class InviteUser {

        @Test
        @DisplayName("returns 401 without valid authentication")
        void inviteUser_requiresAuth() throws Exception {
            // Act & Assert - Request without valid authentication should fail
            mockMvc.perform(post("/api/auth/invite")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"invitee@test.com\",\"role\":\"MANUFACTURER\",\"orgId\":\"org-001\"}"))
                .andExpect(status().isUnauthorized());
        }
    }

    // ── accept invitation ────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/auth/invitations/accept")
    class AcceptInvitation {

        @Test
        @DisplayName("returns 200 OK with user response")
        void acceptInvitation_returns200() throws Exception {
            // Arrange
            var user = com.chaintrack.model.User.builder()
                .id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .email("invitee@test.com")
                .role(Role.MANUFACTURER)
                .status(UserStatus.ACTIVE)
                .build();

            UserResponse response = UserResponse.fromEntity(user);

            when(userService.acceptInvitation(any(AcceptInvitationRequest.class))).thenReturn(response);

            // Act & Assert
            mockMvc.perform(post("/api/auth/invitations/accept")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"token\":\"valid-invitation-token\",\"password\":\"newPassword123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("invitee@test.com"))
                .andExpect(jsonPath("$.role").value("MANUFACTURER"));
        }

        @Test
        @DisplayName("returns 400 Bad Request for invalid token")
        void acceptInvitation_invalidTokenReturns400() throws Exception {
            // Arrange
            when(userService.acceptInvitation(any(AcceptInvitationRequest.class)))
                .thenThrow(new IllegalArgumentException("Invalid or expired invitation token"));

            // Act & Assert
            mockMvc.perform(post("/api/auth/invitations/accept")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"token\":\"invalid-token\",\"password\":\"newPassword123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Bad Request"));
        }
    }

    // ── get invitation details ───────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/auth/invitations/{token}")
    class GetInvitationDetails {

        @Test
        @DisplayName("returns 200 OK with invitation details")
        void getInvitationDetails_returns200() throws Exception {
            // Arrange
            InvitationResponse response = new InvitationResponse(
                "inv-001",
                "invitee@test.com",
                Role.SHIPPER,
                "org-001",
                "Test Org",
                Invitation.InvitationStatus.PENDING,
                Instant.now().plusSeconds(86400),
                Instant.now(),
                "admin@test.com",
                "valid-token"
            );

            when(invitationService.getInvitationByToken("valid-token")).thenReturn(response);

            // Act & Assert
            mockMvc.perform(get("/api/auth/invitations/valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("invitee@test.com"))
                .andExpect(jsonPath("$.role").value("SHIPPER"));
        }

        @Test
        @DisplayName("returns 404 Not Found for unknown token")
        void getInvitationDetails_returns404() throws Exception {
            // Arrange
            when(invitationService.getInvitationByToken("unknown-token"))
                .thenThrow(new com.chaintrack.exception.ResourceNotFoundException("Invitation", "token", "unknown-token"));

            // Act & Assert
            mockMvc.perform(get("/api/auth/invitations/unknown-token"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Not Found"));
        }
    }

    // ── login ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("returns 200 OK with token for ACTIVE user")
        void login_activeUserReturns200() throws Exception {
            // Arrange
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(createAuthentication("shipper@ex.com", Role.SHIPPER));

            var user = com.chaintrack.model.User.builder()
                .id(UUID.randomUUID())
                .email("shipper@ex.com")
                .passwordHash("$2a$12$hash")
                .role(Role.SHIPPER)
                .org(Organization.builder().id(UUID.fromString("00000000-0000-0000-0000-000000000001")).build())
                .status(UserStatus.ACTIVE)
                .build();

            when(userRepository.findByEmail("shipper@ex.com")).thenReturn(user);
            when(jwtUtils.generateToken(any(), any(), any(), any(), any()))
                .thenReturn("mocked-jwt-token");

            // Act & Assert
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"shipper@ex.com\",\"password\":\"correct-pass\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("shipper@ex.com"));
        }

        @Test
        @DisplayName("PENDING user returns 401 Unauthorized")
        void login_pendingUserReturns401() throws Exception {
            // Arrange - PENDING user triggers BadCredentialsException via UserDetailsService
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("User account is not active"));

            // Act & Assert
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"pending@ex.com\",\"password\":\"correct-pass\"}"))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("invalid credentials returns 401 Unauthorized")
        void login_invalidCredentialsReturns401() throws Exception {
            // Arrange
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

            // Act & Assert
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"bad@ex.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
        }
    }

    private Authentication createAuthentication(String email, Role role) {
        var principal = org.springframework.security.core.userdetails.User.withUsername(email)
            .password("test")
            .roles(role.name())
            .build();
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }
}