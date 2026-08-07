package com.chaintrack.controller;

import com.chaintrack.audit.Audited;
import com.chaintrack.dto.request.*;
import com.chaintrack.dto.response.*;
import com.chaintrack.model.User;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.InvitationService;
import com.chaintrack.service.JwtBlacklistService;
import com.chaintrack.service.RefreshTokenService;
import com.chaintrack.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User invitation, login, and logout")
public class AuthController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthController.class);

    @org.springframework.beans.factory.annotation.Value("${app.sso.enabled:false}")
    private boolean ssoEnabled;

    @org.springframework.beans.factory.annotation.Value("${app.sso.registration-id:chaintrack}")
    private String ssoRegistrationId;

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final JwtBlacklistService blacklistService;
    private final AuthenticationManager authenticationManager;
    private final InvitationService invitationService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(UserService userService,
                          UserRepository userRepository,
                          JwtUtils jwtUtils,
                          JwtBlacklistService blacklistService,
                          AuthenticationManager authenticationManager,
                          InvitationService invitationService,
                          RefreshTokenService refreshTokenService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.blacklistService = blacklistService;
        this.authenticationManager = authenticationManager;
        this.invitationService = invitationService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/invite")
    @PreAuthorize("hasRole('ADMIN')")
    @Audited(action = "INVITE", entityType = "INVITATION", entityIdExpr = "#result?.id()")
    @Operation(summary = "Invite new user", description = "ADMIN creates an invitation for a new user (creates PENDING user)")
    @ApiResponse(responseCode = "201", description = "Invitation created successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "400", description = "Invalid request or user already exists")
    public ResponseEntity<InvitationResponse> inviteUser(@Valid @RequestBody InviteUserRequest request) {
        InvitationResponse response = userService.inviteUser(request, SecurityContextHolder.getContext().getAuthentication().getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/invitations/accept")
    @Audited(action = "ACCEPT_INVITATION", entityType = "INVITATION", entityIdExpr = "#result?.id()")
    @Operation(summary = "Accept invitation", description = "Invited user sets password and activates account as PENDING")
    @ApiResponse(responseCode = "200", description = "Invitation accepted, user in PENDING status")
    @ApiResponse(responseCode = "400", description = "Invalid token or expired invitation")
    @ApiResponse(responseCode = "404", description = "Invitation not found")
    public ResponseEntity<UserResponse> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        UserResponse response = userService.acceptInvitation(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invitations/{token}")
    @Operation(summary = "Get invitation details", description = "Returns invitation details for the acceptance page (public)")
    @ApiResponse(responseCode = "200", description = "Invitation found")
    @ApiResponse(responseCode = "404", description = "Invitation not found")
    public ResponseEntity<InvitationResponse> getInvitationDetails(@PathVariable String token) {
        InvitationResponse response = invitationService.getInvitationByToken(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Audited(action = "LOGIN", entityType = "AUTH")
    @Operation(summary = "User login", description = "Authenticates user and returns JWT token (only ACTIVE users)")
    @ApiResponse(responseCode = "200", description = "Login successful, returns JWT token")
    @ApiResponse(responseCode = "401", description = "Invalid credentials or account not approved")
    @ApiResponse(responseCode = "400", description = "Invalid request data")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userRepository.findByEmail(request.username());
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(null, null, null, null, null, null));
            }
            
            String token = jwtUtils.generateToken(
                (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal(),
                user.getId().toString(),
                user.getOrg() != null ? user.getOrg().getId().toString() : null,
                user.getRole().name(),
                user.getStatus().name()
            );

            com.chaintrack.model.RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
            
            return ResponseEntity.ok(new LoginResponse(
                token,
                refreshToken.getTokenValue(),
                user.getId().toString(),
                user.getEmail(),
                java.util.List.of(user.getRole()),
                Instant.ofEpochMilli(jwtUtils.getExpirationMillis(token))
            ));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new LoginResponse(null, null, null, request.username(), null, null));
        }
    }

    @GetMapping("/sso/config")
    @Operation(summary = "SSO configuration", description = "Reports whether OIDC/SSO login is enabled and which registration id to use (public)")
    public java.util.Map<String, Object> ssoConfig() {
        return java.util.Map.of(
            "enabled", ssoEnabled,
            "registrationId", ssoRegistrationId
        );
    }

    @PostMapping("/change-password")
    @Audited(action = "CHANGE_PASSWORD", entityType = "USER", entityIdExpr = "#arg0?.email()")
    @Operation(summary = "Change own password", description = "Verifies the current password, stores the new one, and revokes the current token so the user must sign in again")
    @ApiResponse(responseCode = "200", description = "Password changed successfully")
    @ApiResponse(responseCode = "400", description = "Current password is incorrect or invalid request")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<UserResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                        @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
        String email = jwtUtils.extractUsername(token);

        UserResponse response = userService.changePassword(email, request.currentPassword(), request.newPassword());

        // Revoke the current session so the user signs in again with the new password
        try {
            blacklistService.addToBlacklist(token, jwtUtils.getExpirationMillis(token));
        } catch (Exception e) {
            // Best-effort revocation — the password itself is already updated
            logger.warn("Could not revoke token after password change: {}", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Audited(action = "LOGOUT", entityType = "AUTH")
    @Operation(summary = "User logout", description = "Blacklists the JWT token and revokes refresh tokens for the user")
    @ApiResponse(responseCode = "200", description = "Logout successful")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        String email = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            long expiryMillis;
            try {
                expiryMillis = jwtUtils.getExpirationMillis(token);
                email = jwtUtils.extractUsername(token);
            } catch (Exception e) {
                expiryMillis = java.time.Instant.now().plusSeconds(86400).toEpochMilli();
            }
            blacklistService.addToBlacklist(token, expiryMillis);
        }

        if (email != null) {
            User found = userRepository.findByEmail(email);
            if (found != null) {
                refreshTokenService.revokeAllForUser(found.getId());
            }
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Issues a new JWT using a valid refresh token")
    @ApiResponse(responseCode = "200", description = "Token refreshed successfully")
    @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    public ResponseEntity<LoginResponse> refresh(@RequestBody java.util.Map<String, String> payload) {
        String refreshTokenValue = payload.get("refreshToken");
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            com.chaintrack.model.RefreshToken refreshToken = refreshTokenService.rotate(refreshTokenValue);
            com.chaintrack.model.User user = refreshToken.getUser();

            String newAccessToken = jwtUtils.generateToken(
                new org.springframework.security.core.userdetails.User(user.getEmail(), "", java.util.List.of()),
                user.getId().toString(),
                user.getOrg() != null ? user.getOrg().getId().toString() : null,
                user.getRole().name(),
                user.getStatus().name()
            );

            return ResponseEntity.ok(new LoginResponse(
                newAccessToken,
                refreshToken.getTokenValue(),
                user.getId().toString(),
                user.getEmail(),
                java.util.List.of(user.getRole()),
                Instant.ofEpochMilli(jwtUtils.getExpirationMillis(newAccessToken))
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}