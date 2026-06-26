package com.chaintrack.controller;

import com.chaintrack.dto.request.LoginRequest;
import com.chaintrack.dto.request.RegisterRequest;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.exception.DuplicateSkuException;
import com.chaintrack.model.Role;
import com.chaintrack.model.User;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.JwtBlacklistService;
import com.chaintrack.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web MVC slice tests for {@link AuthController}.
 * All dependencies @MockBean'ed. Security filters disabled via addFilters=false.
 * Uses AAA, @DisplayName, section dividers, jsonPath assertions.
 * Covers exactly the cases specified in the 4-week plan (Day 12 B task).
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

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

    // ── register ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("register — returns 201 Created when valid payload")
    void register_returns201Created() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest(
            "new@user.com",
            "s3cr3tPass",
            Role.MANUFACTURER,
            "11111111-1111-1111-1111-111111111111"
        );
        UserResponse resp = new UserResponse(
            "u-001",
            "new@user.com",
            Role.MANUFACTURER,
            "11111111-1111-1111-1111-111111111111",
            true,
            Instant.parse("2026-05-20T10:00:00Z"),
            Instant.parse("2026-05-20T10:00:00Z")
        );
        when(userService.register(any(RegisterRequest.class))).thenReturn(resp);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "new@user.com",
                      "password": "s3cr3tPass",
                      "role": "MANUFACTURER",
                      "orgId": "11111111-1111-1111-1111-111111111111"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("u-001"))
            .andExpect(jsonPath("$.email").value("new@user.com"))
            .andExpect(jsonPath("$.role").value("MANUFACTURER"))
            .andExpect(jsonPath("$.orgId").value("11111111-1111-1111-1111-111111111111"));
    }

    @Test
    @DisplayName("register — returns 409 Conflict when email already registered")
    void register_returns409Conflict_forDuplicateEmail() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest(
            "dup@user.com",
            "s3cr3tPass",
            Role.RETAILER,
            "22222222-2222-2222-2222-222222222222"
        );
        when(userService.register(any(RegisterRequest.class)))
            .thenThrow(new DuplicateSkuException("dup@user.com"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "dup@user.com",
                      "password": "s3cr3tPass",
                      "role": "RETAILER",
                      "orgId": "22222222-2222-2222-2222-222222222222"
                    }
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value(409))
            .andExpect(jsonPath("$.error").value("Conflict"));
    }

    // ── login ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login — returns 200 OK + LoginResponse when credentials valid")
    void login_returns200Ok_withValidCredentials() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest("shipper@ex.com", "correct-pass");
        Authentication auth = mock(Authentication.class);
        UserDetails principal = mock(UserDetails.class);
        when(principal.getUsername()).thenReturn("shipper@ex.com");
        when(auth.getPrincipal()).thenReturn(principal);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(auth);

        User dbUser = User.builder()
            .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000007"))
            .email("shipper@ex.com")
            .passwordHash("$2a$12$...")
            .role(Role.SHIPPER)
            .org(null)
            .isActive(true)
            .build();
        when(userRepository.findByEmail("shipper@ex.com")).thenReturn(dbUser);

        when(jwtUtils.generateToken(any(), any(), any(), any()))
            .thenReturn("fake.jwt.token.value");
        when(jwtUtils.getExpirationMillis(anyString()))
            .thenReturn(Instant.parse("2026-06-01T00:00:00Z").toEpochMilli());

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "username": "shipper@ex.com",
                      "password": "correct-pass"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("fake.jwt.token.value"))
            .andExpect(jsonPath("$.userId").value("00000000-0000-0000-0000-000000000007"))
            .andExpect(jsonPath("$.email").value("shipper@ex.com"))
            .andExpect(jsonPath("$.roles[0]").value("SHIPPER"));
    }

    @Test
    @DisplayName("login — returns 401 Unauthorized when credentials invalid")
    void login_returns401Unauthorized_forInvalidCredentials() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest("bad@ex.com", "wrong");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenThrow(new BadCredentialsException("Bad credentials"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "username": "bad@ex.com",
                      "password": "wrong"
                    }
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.error").value("Unauthorized"));
    }
}
