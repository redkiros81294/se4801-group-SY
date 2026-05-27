package com.chaintrack.controller;

import com.chaintrack.dto.response.AdminAnalyticsResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.Role;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.AdminAnalyticsService;
import com.chaintrack.service.JwtBlacklistService;
import com.chaintrack.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("removal")
@WebMvcTest(controllers = AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private AdminAnalyticsService adminAnalyticsService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private JwtBlacklistService blacklistService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Nested
    @DisplayName("listUsers")
    class ListUsers {

        @Test
        @DisplayName("ADMIN 200")
        void listUsers_adminReturnsPage() throws Exception {
            UserResponse userResponse = new UserResponse(
                "user-1",
                "admin@test.com",
                Role.ADMIN,
                "org-1",
                true,
                Instant.now(),
                Instant.now()
            );
            Page<UserResponse> page = new PageImpl<>(List.of(userResponse));

            when(userService.listUsers(any())).thenReturn(page);

            mockMvc.perform(get("/api/admin/users")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("admin@test.com"));
        }
    }

    @Nested
    @DisplayName("getAnalytics")
    class GetAnalytics {

        @Test
        @DisplayName("ADMIN 200")
        void getAnalytics_returnsStats() throws Exception {
            AdminAnalyticsResponse response = new AdminAnalyticsResponse(
                3L, 10L, 20L, 30L,
                5L, 8L, 7L, 0L
            );

            when(adminAnalyticsService.getAnalytics()).thenReturn(response);

            mockMvc.perform(get("/api/admin/analytics")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrganizations").value(3))
                .andExpect(jsonPath("$.totalProducts").value(10))
                .andExpect(jsonPath("$.totalBatches").value(20))
                .andExpect(jsonPath("$.totalTransactions").value(30));
        }
    }
}