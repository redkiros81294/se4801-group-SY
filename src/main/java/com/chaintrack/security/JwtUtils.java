package com.chaintrack.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    private static final String DEFAULT_SECRET = "chaintrack-render-production-secret-key-min-32-chars";

    @Value("${jwt.secret:}")
    private String secret;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private Key key;

    @PostConstruct
    public void init() {
        String effectiveSecret = (secret == null || secret.length() < 32) ? DEFAULT_SECRET : secret;
        this.key = Keys.hmacShaKeyFor(effectiveSecret.getBytes());
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
