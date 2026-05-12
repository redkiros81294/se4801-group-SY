package com.chaintrack.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for ChainTrack.
 * <p>
 * This is a skeleton to be completed in coordination with Simon.
 * </p>
 *
 * @see <a href="https://github.com/redkiros81294/se4801-group-SY">Project Repo</a>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // enables @PreAuthorize / @PostAuthorize on service methods
public class SecurityConfig {

    /**
     * Defines the security filter chain.
     * <p>
     * Current state: CSRF disabled (stateless API), session management set to STATELESS.
     * TODO: Add JWT authentication filter, CORS, and endpoint authorization rules once
     * Simon implements JwtUtils and AuthController.
     * </p>
     *
     * @param http the HttpSecurity builder
     * @return the configured SecurityFilterChain
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // @formatter:off
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        // @formatter:on

        // TODO: Wire JWT authentication filter, authorization rules, and exception handling once Simon's JwtUtils are ready.

        return http.build();
    }
}