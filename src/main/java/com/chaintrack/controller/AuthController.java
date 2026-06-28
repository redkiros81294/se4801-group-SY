package com.chaintrack.controller;

import com.chaintrack.dto.request.*;
import com.chaintrack.dto.response.*;
import com.chaintrack.model.User;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.InvitationService;
import com.chaintrack.service.JwtBlacklistService;
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

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final JwtBlacklistService blacklistService;
    private final AuthenticationManager authenticationManager;
    private final InvitationService invitationService;

    public AuthController(UserService userService,
                          UserRepository userRepository,
                          JwtUtils jwtUtils,
                          JwtBlacklistService blacklistService,
                          AuthenticationManager authenticationManager,
                          InvitationService invitationService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.blacklistService = blacklistService;
        this.authenticationManager = authenticationManager;
        this.invitationService = invitationService;
    }

    @PostMapping("/invite")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Invite new user", description = "ADMIN creates an invitation for a new user (creates PENDING user)")
    @ApiResponse(responseCode = "201", description = "Invitation created successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "400", description = "Invalid request or user already exists")
    public ResponseEntity<InvitationResponse> inviteUser(@Valid @RequestBody InviteUserRequest request) {
        InvitationResponse response = userService.inviteUser(request, SecurityContextHolder.getContext().getAuthentication().getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/invitations/accept")
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
                    .body(new LoginResponse(null, null, null, null, null));
            }
            
            String token = jwtUtils.generateToken(
                (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal(),
                user.getId().toString(),
                user.getOrg() != null ? user.getOrg().getId().toString() : null,
                user.getRole().name(),
                user.getStatus().name()
            );
            
            return ResponseEntity.ok(new LoginResponse(
                token,
                user.getId().toString(),
                user.getEmail(),
                java.util.List.of(user.getRole()),
                Instant.ofEpochMilli(jwtUtils.getExpirationMillis(token))
            ));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new LoginResponse(null, null, request.username(), null, null));
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Blacklists the JWT token")
    @ApiResponse(responseCode = "200", description = "Logout successful")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            blacklistService.addToBlacklist(token, jwtUtils.getExpirationMillis(token));
        }
        return ResponseEntity.ok().build();
    }
}