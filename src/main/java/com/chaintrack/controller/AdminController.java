package com.chaintrack.controller;

import com.chaintrack.dto.request.ApproveUserRequest;
import com.chaintrack.dto.response.AdminAnalyticsResponse;
import com.chaintrack.dto.response.InvitationResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.service.AdminAnalyticsService;
import com.chaintrack.service.InvitationService;
import com.chaintrack.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin-only APIs")
public class AdminController {

    private final UserService userService;
    private final AdminAnalyticsService adminAnalyticsService;
    private final InvitationService invitationService;

    public AdminController(UserService userService,
                           AdminAnalyticsService adminAnalyticsService,
                           InvitationService invitationService) {
        this.userService = userService;
        this.adminAnalyticsService = adminAnalyticsService;
        this.invitationService = invitationService;
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

    @GetMapping("/users/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List pending users", description = "Returns list of users with PENDING status (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "List of pending users")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<List<UserResponse>> listPendingUsers() {
        List<UserResponse> users = userService.listPendingUsers();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve pending user", description = "Approves a pending user account (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "User approved successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "400", description = "User is not in PENDING status")
    public ResponseEntity<UserResponse> approveUser(@PathVariable String id,
                                                    @Valid @RequestBody ApproveUserRequest request) {
        UserResponse response = userService.approveUser(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject pending user", description = "Rejects a pending user account with reason (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "User rejected successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "400", description = "User is not in PENDING status")
    public ResponseEntity<UserResponse> rejectUser(@PathVariable String id,
                                                   @Valid @RequestBody ApproveUserRequest request) {
        UserResponse response = userService.rejectUser(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invitations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all invitations", description = "Returns list of all invitations (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "List of invitations")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<List<InvitationResponse>> listInvitations() {
        List<InvitationResponse> invitations = invitationService.listAllInvitations();
        return ResponseEntity.ok(invitations);
    }

    @PostMapping("/invitations/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Revoke invitation", description = "Revokes a pending invitation (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Invitation revoked successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "404", description = "Invitation not found")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    public ResponseEntity<InvitationResponse> revokeInvitation(@PathVariable String id) {
        InvitationResponse response = invitationService.revokeInvitation(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-analytics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get system analytics", description = "Returns system-wide statistics (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Analytics retrieved successfully")
    public ResponseEntity<AdminAnalyticsResponse> testAnalytics() {
        AdminAnalyticsResponse analytics = adminAnalyticsService.getAnalytics();
        return ResponseEntity.ok(analytics);
    }

}
