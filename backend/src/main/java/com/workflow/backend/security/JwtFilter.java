package com.workflow.backend.security;

import com.workflow.backend.entity.User;
import com.workflow.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 1. Header kontrolü: "Bearer " ile mi başlıyor?
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Token'ı al
        jwt = authHeader.substring(7); // "Bearer " kısmını at

        try {
            username = jwtService.extractUsername(jwt);
            System.out.println("JwtFilter: Processing token for user: " + username);

            // 3. Kullanıcı doğrulaması
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = userRepository.findByUsername(username);

                if (user != null && jwtService.isTokenValid(jwt, username)) {
                    // Spring Security'ye "Bu adam güvenli, içeri al" diyoruz
                    UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                            user.getUsername(),
                            user.getPassword(),
                            new ArrayList<>() // Yetkiler (Roles) şimdilik boş
                    );

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("JwtFilter: Authenticated user: " + username);
                } else {
                    System.out.println("JwtFilter: Token invalid or user not found");
                }
            }
        } catch (Exception e) {
            // JWT geçersiz veya imza uyuşmazlığı - 401 Unauthorized döndür
            System.out.println("JwtFilter: Invalid JWT token - " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Geçersiz veya süresi dolmuş token. Lütfen tekrar giriş yapın.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}