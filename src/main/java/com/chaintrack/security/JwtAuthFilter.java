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
    private final JwtBlacklistService blacklistService;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(JwtUtils jwtUtils, 
                         JwtBlacklistService blacklistService,
                         UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.blacklistService = blacklistService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                     HttpServletResponse response, 
                                     FilterChain filterChain) throws ServletException, IOException {
        logger.info("JwtAuthFilter called");
        
        if (isExempt(request)) {
            logger.info("Exempt path: {}, method: {}", request.getRequestURI(), request.getMethod());
            filterChain.doFilter(request, response);
            return;
        }
        
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtUtils.extractUsername(token);
                if (username != null) {
                    // Token has a username, now validate
                    if (jwtUtils.validateToken(token, blacklistService)) {
                        UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                        UsernamePasswordAuthenticationToken authToken = 
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        logger.info("Set authentication: {}", authToken);
                    } else {
                        logger.info("Token validation failed for token: {}", token);
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                        return;
                    }
                } else {
                    logger.info("Username null in token: {}", token);
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                    return;
                }
            } catch (Exception e) {
                logger.warn("Failed to extract username from token", e);
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                return;
            }
        } else {
            logger.info("Token: null, Username: null, Auth before filter: {}", SecurityContextHolder.getContext().getAuthentication());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return;
        }
        
        logger.info("Auth after filter (before chain): {}", SecurityContextHolder.getContext().getAuthentication());
        filterChain.doFilter(request, response);
        logger.info("Auth after filter (after chain): {}", SecurityContextHolder.getContext().getAuthentication());
    }

    private boolean isExempt(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if (path.startsWith("/api/auth/")) {
            return true;
        }
        if (path.startsWith("/v3/api-docs/") || path.equals("/swagger-ui.html") || path.startsWith("/swagger-ui/")) {
            return true;
        }
        if ("GET".equals(method) && path.startsWith("/api/verify/")) {
            return true;
        }
        return false;
    }
}