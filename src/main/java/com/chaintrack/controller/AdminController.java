package com.chaintrack.controller;

import com.chaintrack.dto.response.AdminAnalyticsResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.service.AdminAnalyticsService;
import com.chaintrack.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin-only APIs")
public class AdminController {

    private final UserService userService;
    private final AdminAnalyticsService adminAnalyticsService;

    public AdminController(UserService userService, AdminAnalyticsService adminAnalyticsService) {
        this.userService = userService;
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all users", description = "Returns paginated list of all users (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Successful retrieval")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<Page<UserResponse>> listUsers(@PageableDefault(size = 20) Pageable pageable) {
        Page<UserResponse> users = userService.listUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get system analytics", description = "Returns system-wide statistics (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Analytics retrieved successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<AdminAnalyticsResponse> getAnalytics() {
        AdminAnalyticsResponse analytics = adminAnalyticsService.getAnalytics();
        return ResponseEntity.ok(analytics);
    }
}