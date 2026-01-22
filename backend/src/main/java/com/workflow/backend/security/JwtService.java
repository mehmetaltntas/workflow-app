package com.workflow.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    private Key signingKey;

    @PostConstruct
    public void init() {
        // Secret key en az 64 karakter olmalı (HS256 için 256 bit)
        if (secretKey == null || secretKey.length() < 64) {
            throw new IllegalStateException(
                "JWT Secret key en az 64 karakter olmalı! " +
                "Lütfen application.properties veya environment variable'da jwt.secret değerini ayarlayın."
            );
        }
        this.signingKey = Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    // 1. Kullanıcı adı ile Token Üret
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Token'dan Kullanıcı Adını Çıkar
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Token Geçerli mi?
    public boolean isTokenValid(String token, String username) {
        final String extractedUser = extractUsername(token);
        return (extractedUser.equals(username) && !isTokenExpired(token));
    }

    // Yardımcı Metotlar
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}
