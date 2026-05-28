package com.chaintrack.security;

import com.chaintrack.service.JwtBlacklistService;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.*;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private Key key;

    @PostConstruct
    public void init() {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(org.springframework.security.core.userdetails.UserDetails userDetails, 
                                 String userId, 
                                 String orgId, 
                                 String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("orgId", orgId);
        claims.put("role", role);

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
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

    public Date extractExpiration(String token) {
        return parseToken(token).getExpiration();
    }

    public long getExpirationMillis(String token) {
        return parseToken(token).getExpiration().getTime();
    }

    public boolean validateToken(String token, JwtBlacklistService blacklistService) {
        try {
            parseToken(token);
            if (blacklistService != null && blacklistService.isBlacklisted(token)) {
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseToken(String token) {
        JwtParser parser = Jwts.parser()
            .setSigningKey(key)
            .build();
        return parser.parseClaimsJws(token).getBody();
    }
}