package com.workflow.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    // BU ANAHTAR ÇOK GİZLİ OLMALI! (Normalde Environment Variable'dan okunur)
    // Buraya rastgele uzun bir şifre yaz (En az 256 bit - 32 karakter)
    private static final String SECRET_KEY = "benimcokgizliuzunveguvenliworkflowsifrembudur";

    // 1. Kullanıcı adı ile Token Üret
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 Saat geçerli
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
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
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(io.jsonwebtoken.io.Encoders.BASE64.encode(SECRET_KEY.getBytes()));
        return Keys.hmacShaKeyFor(keyBytes);
    }
}