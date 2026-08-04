package com.chaintrack.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Arrays;
import java.util.Date;

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    /**
     * Development-only fallback secret. NEVER used when the prod profile is active:
     * a missing or short JWT_SECRET is a hard startup failure instead, so tokens can
     * never be forged with a publicly-known key.
     */
    private static final String DEFAULT_SECRET = "chaintrack-dev-only-secret-key-min-32-chars";

    @Value("${jwt.secret:}")
    private String secret;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Autowired
    private Environment environment;

    private Key key;

    @PostConstruct
    public void init() {
        String effectiveSecret = secret;

        if (effectiveSecret == null || effectiveSecret.length() < 32) {
            boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
            if (isProd) {
                throw new IllegalStateException(
                    "JWT_SECRET must be configured with at least 32 characters when the 'prod' profile is active");
            }
            if (effectiveSecret == null || effectiveSecret.isBlank()) {
                logger.warn("JWT_SECRET is not set — using the development fallback secret. "
                    + "Set JWT_SECRET (>= 32 chars) for any non-local deployment.");
            } else {
                logger.warn("JWT_SECRET is shorter than 32 characters — using the development fallback secret. "
                    + "Set JWT_SECRET (>= 32 chars) for any non-local deployment.");
            }
            effectiveSecret = DEFAULT_SECRET;
        }

        this.key = Keys.hmacShaKeyFor(effectiveSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(org.springframework.security.core.userdetails.UserDetails userDetails,
                                 String userId, 
                                 String orgId, 
                                 String role,
                                 String status) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
            .subject(userDetails.getUsername())
            .issuedAt(now)
            .expiration(expiryDate)
            .claim("userId", userId)
            .claim("orgId", orgId)
            .claim("role", role)
            .claim("status", status)
            .signWith(key)
            .compact();
    }

    public String extractUsername(String token) {
        return parseToken(token).getSubject();
    }

    public String extractUserId(String token) {
        return parseToken(token).get("userId", String.class);
    }

    public String extractOrgId(String token) {
        return parseToken(token).get("orgId", String.class);
    }

    public String extractRole(String token) {
        return parseToken(token).get("role", String.class);
    }

    public String extractStatus(String token) {
        return parseToken(token).get("status", String.class);
    }

    public Date extractExpiration(String token) {
        return parseToken(token).getExpiration();
    }

    public long getExpirationMillis(String token) {
        return parseToken(token).getExpiration().getTime();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
            .verifyWith((javax.crypto.SecretKey) key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
