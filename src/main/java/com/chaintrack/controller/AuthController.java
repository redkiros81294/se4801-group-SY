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
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse userResponse = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
    }

    @PostMapping("/login")
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
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            blacklistService.addToBlacklist(token, jwtUtils.getExpirationMillis(token));
        }
        return ResponseEntity.ok().build();
    }
}