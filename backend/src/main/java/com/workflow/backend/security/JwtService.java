package com.workflow.backend.security;

import com.workflow.backend.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;

    private Key signingKey;

    @PostConstruct
    public void init() {
        String secret = jwtProperties.getSecret();
        // Secret key en az 64 karakter olmalı (HS256 için 256 bit)
        if (secret == null || secret.length() < 64) {
            throw new IllegalStateException(
                "JWT Secret key en az 64 karakter olmalı! " +
                "Lütfen application.properties veya environment variable'da jwt.secret değerini ayarlayın."
            );
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // 1. Kullanıcı adı ile Access Token Üret (eski token'lar için geriye uyumluluk)
    public String generateToken(String username) {
        return generateAccessToken(username);
    }

    // userId ile Access Token Üret
    public String generateToken(String username, Long userId) {
        return generateAccessToken(username, userId);
    }

    // Access Token Üret - userId olmadan (geriye uyumluluk)
    public String generateAccessToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtProperties.getAccessToken().getExpiration()))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // Access Token Üret - userId claim ile (kısa süreli)
    public String generateAccessToken(String username, Long userId) {
        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtProperties.getAccessToken().getExpiration()))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Token'dan Kullanıcı Adını Çıkar
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 3. Token'dan Kullanıcı ID'sini Çıkar
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
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
