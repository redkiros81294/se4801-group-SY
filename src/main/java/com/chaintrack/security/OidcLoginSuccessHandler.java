package com.chaintrack.security;

import com.chaintrack.model.User;
import com.chaintrack.model.UserStatus;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Completes an OIDC/SSO login:
 * <ol>
 *   <li>Reads the verified email from the OIDC identity token.</li>
 *   <li>Looks up the ChainTrack user with that email (SSO authenticates
 *       identity, but ChainTrack still governs provisioning and roles —
 *       an unknown email is not auto-provisioned).</li>
 *   <li>Mints the same JWT the password login uses and redirects the browser
 *       back to the frontend with {@code ?token=...}.</li>
 * </ol>
 * The user must exist and be ACTIVE, mirroring the password-login contract.
 */
@Component
public class OidcLoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OidcLoginSuccessHandler.class);

    private final UserRepository userRepository;
    private final UserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;
    private final AuditLogService auditLogService;

    @Value("${frontend.url}")
    private String frontendUrl;

    public OidcLoginSuccessHandler(UserRepository userRepository,
                                   UserDetailsService userDetailsService,
                                   JwtUtils jwtUtils,
                                   AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.jwtUtils = jwtUtils;
        this.auditLogService = auditLogService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        String email = extractEmail(authentication);

        if (email == null || email.isBlank()) {
            redirectError(response, "sso=missing_email");
            return;
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            log.info("SSO login rejected: no ChainTrack account for {}", email);
            auditLogService.record("system", "SSO_LOGIN_FAILED", "AUTH", null,
                "OIDC login for unknown email " + email, clientIp(request), requestId(request));
            redirectError(response, "sso=not_provisioned");
            return;
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.info("SSO login rejected: account {} not ACTIVE", email);
            auditLogService.record(user.getEmail(), "SSO_LOGIN_FAILED", "AUTH", user.getId().toString(),
                "OIDC login for non-active account", clientIp(request), requestId(request));
            redirectError(response, "sso=pending");
            return;
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String orgId = user.getOrg() != null ? user.getOrg().getId().toString() : null;
        String token = jwtUtils.generateToken(userDetails, user.getId().toString(), orgId,
            user.getRole().name(), user.getStatus().name());

        auditLogService.record(user.getEmail(), "SSO_LOGIN", "AUTH", user.getId().toString(),
            "Successful OIDC login", clientIp(request), requestId(request));

        log.info("SSO login succeeded for {}", email);
        response.sendRedirect(frontendUrl + "/login?token=" + token);
    }

    private String extractEmail(Authentication authentication) {
        if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
            String email = oidcUser.getEmail();
            if (email != null && !email.isBlank()) {
                return email;
            }
            return oidcUser.getPreferredUsername();
        }
        return null;
    }

    private void redirectError(HttpServletResponse response, String query) throws IOException {
        response.sendRedirect(frontendUrl + "/login?" + query);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String requestId(HttpServletRequest request) {
        String id = request.getHeader("X-Request-Id");
        return id == null || id.isBlank() ? null : id;
    }
}
