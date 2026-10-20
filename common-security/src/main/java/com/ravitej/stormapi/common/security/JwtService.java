package com.ravitej.stormapi.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Issues and validates HS256 JWTs. The secret is shared across all services
 * via the JWT_SECRET environment variable (see Architecture.md, section 3).
 */
public class JwtService {

    private final SecretKey key;
    private final long ttlMillis;

    public JwtService(String secret, long ttlMillis) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("JWT_SECRET must be at least 32 bytes long");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMillis = ttlMillis;
    }

    public String generateToken(long userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(ttlMillis)))
                .signWith(key)
                .compact();
    }

    /**
     * Validates the token signature and expiry.
     *
     * @throws io.jsonwebtoken.JwtException if the token is invalid or expired
     */
    public AuthenticatedUser validate(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return new AuthenticatedUser(Long.parseLong(claims.getSubject()), claims.get("email", String.class));
    }
}
