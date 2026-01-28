package com.workflow.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Auth endpoint'lerinde JWT doğrulaması yapma (permitAll zaten var, ama
        // expired token header'ı gönderilirse filter hata fırlatıp 401 dönüyor)
        String requestPath = request.getServletPath();
        if (requestPath.startsWith("/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 1. Header kontrolü: "Bearer " ile mi başlıyor? Yoksa cookie'den oku
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Try cookie if no Authorization header
            jwt = extractCookieValue(request, "access_token");
            if (jwt == null) {
                filterChain.doFilter(request, response);
                return;
            }
        } else {
            // 2. Token'ı al
            jwt = authHeader.substring(7); // "Bearer " kısmını at
        }

        try {
            username = jwtService.extractUsername(jwt);
            logger.debug("Processing token for user: {}", username);

            // 3. Kullanıcı doğrulaması (DB sorgusu yapmadan JWT'den userId alınır)
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(jwt, username)) {
                    Long userId = jwtService.extractUserId(jwt);

                    UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                            username,
                            "",
                            new ArrayList<>()
                    );

                    // userId, credentials alanında saklanır (DB sorgusu gereksiz)
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, userId, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.debug("Authenticated user: {} (id: {})", username, userId);
                } else {
                    logger.warn("Token invalid for username: {}", username);
                }
            }
        } catch (Exception e) {
            // JWT geçersiz veya imza uyuşmazlığı - 401 Unauthorized döndür
            logger.warn("Invalid JWT token: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Geçersiz veya süresi dolmuş token. Lütfen tekrar giriş yapın.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractCookieValue(HttpServletRequest request, String cookieName) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
