package com.chaintrack.security;

import com.chaintrack.service.JwtBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final JwtBlacklistService jwtBlacklistService;

    public JwtAuthFilter(JwtUtils jwtUtils,
                         UserDetailsService userDetailsService,
                         JwtBlacklistService jwtBlacklistService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.jwtBlacklistService = jwtBlacklistService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        // Check if already authenticated (e.g., via @WithMockUser or other test setup)
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (isExempt(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            // Reject revoked tokens — logout adds the token to the blacklist.
            if (jwtBlacklistService.isBlacklisted(token)) {
                logger.debug("Rejected blacklisted JWT token (subject unknown)");
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has been revoked");
                return;
            }

            try {
                String username = jwtUtils.extractUsername(token);
                if (username != null) {
                    if (jwtUtils.validateToken(token)) {
                        UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        logger.debug("Authenticated user: {}", username);
                    } else {
                        logger.debug("Token validation failed");
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                        return;
                    }
                } else {
                    logger.debug("Username null in token");
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                    return;
                }
            } catch (Exception e) {
                logger.debug("Failed to extract username from token: {}", e.getMessage());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isExempt(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Exempt public endpoints - login, accept invitation, get invitation details
        // Note: /api/auth/invite is NOT exempt - it requires ADMIN role via @PreAuthorize
        if (path.equals("/api/auth/login")) {
            return true;
        }
        if (path.equals("/api/auth/invitations/accept")) {
            return true;
        }
        if (method.equals("GET") && path.matches("/api/auth/invitations/[^/]+")) {
            return true;
        }
        if (path.startsWith("/v3/api-docs/") || path.equals("/swagger-ui.html") || path.startsWith("/swagger-ui/")) {
            return true;
        }
        if (path.startsWith("/actuator/health")) {
            return true;
        }
        if ("GET".equals(method) && path.startsWith("/api/verify/")) {
            return true;
        }
        if ("OPTIONS".equals(method)) {
            return true;
        }
        return false;
    }
}
