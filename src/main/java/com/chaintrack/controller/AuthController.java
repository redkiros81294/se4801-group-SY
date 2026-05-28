package com.chaintrack.controller;

import com.chaintrack.dto.request.LoginRequest;
import com.chaintrack.dto.request.RegisterRequest;
import com.chaintrack.dto.response.LoginResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.User;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.security.JwtUtils;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User registration, login, and logout")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final JwtBlacklistService blacklistService;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserService userService,
                          UserRepository userRepository,
                          JwtUtils jwtUtils,
                          JwtBlacklistService blacklistService,
                          AuthenticationManager authenticationManager) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.blacklistService = blacklistService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Creates a new user account")
    @ApiResponse(responseCode = "201", description = "User registered successfully")
    @ApiResponse(responseCode = "409", description = "Email already exists", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    @ApiResponse(responseCode = "400", description = "Invalid request data", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse userResponse = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates user and returns JWT token")
    @ApiResponse(responseCode = "200", description = "Login successful, returns JWT token")
    @ApiResponse(responseCode = "401", description = "Invalid credentials", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    @ApiResponse(responseCode = "400", description = "Invalid request data", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        User user = userRepository.findByEmail(request.username());
        String token = jwtUtils.generateToken(
            (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal(),
            user.getId(),
            user.getOrg() != null ? user.getOrg().getId() : null,
            user.getRole().name()
        );
        
        return ResponseEntity.ok(new LoginResponse(
            token,
            user.getId(),
            user.getEmail(),
            java.util.List.of(user.getRole()),
            Instant.ofEpochMilli(jwtUtils.getExpirationMillis(token))
        ));
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