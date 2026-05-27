package com.chaintrack.controller;

import com.chaintrack.dto.response.AdminAnalyticsResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.service.AdminAnalyticsService;
import com.chaintrack.service.UserService;
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
public class AdminController {

    private final UserService userService;
    private final AdminAnalyticsService adminAnalyticsService;

    public AdminController(UserService userService, AdminAnalyticsService adminAnalyticsService) {
        this.userService = userService;
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> listUsers(@PageableDefault(size = 20) Pageable pageable) {
        Page<UserResponse> users = userService.listUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminAnalyticsResponse> getAnalytics() {
        AdminAnalyticsResponse analytics = adminAnalyticsService.getAnalytics();
        return ResponseEntity.ok(analytics);
    }
}