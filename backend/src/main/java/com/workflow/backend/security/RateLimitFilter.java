package com.workflow.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    // IP bazlı bucket'ları tutan map (endpoint -> IP -> Bucket)
    private final Map<String, Map<String, Bucket>> buckets = new ConcurrentHashMap<>();

    // Rate limit konfigürasyonları
    private static final Map<String, RateLimitConfig> RATE_LIMITS = Map.of(
            "/auth/login", new RateLimitConfig(5, Duration.ofMinutes(5)),
            "/auth/register", new RateLimitConfig(3, Duration.ofMinutes(15)),
            "/auth/refresh", new RateLimitConfig(10, Duration.ofMinutes(5))
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Sadece /auth/** endpoint'lerine uygula
        if (!path.startsWith("/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Rate limit konfigürasyonunu bul
        RateLimitConfig config = findRateLimitConfig(path);
        if (config == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        Bucket bucket = resolveBucket(path, clientIp, config);

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            logger.warn("Rate limit exceeded for IP: {} on endpoint: {}", clientIp, path);
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.\"}");
        }
    }

    private RateLimitConfig findRateLimitConfig(String path) {
        // Tam eşleşme kontrolü
        if (RATE_LIMITS.containsKey(path)) {
            return RATE_LIMITS.get(path);
        }
        // Prefix eşleşmesi için kontrol
        for (Map.Entry<String, RateLimitConfig> entry : RATE_LIMITS.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private Bucket resolveBucket(String endpoint, String clientIp, RateLimitConfig config) {
        return buckets
                .computeIfAbsent(endpoint, k -> new ConcurrentHashMap<>())
                .computeIfAbsent(clientIp, k -> createBucket(config));
    }

    private Bucket createBucket(RateLimitConfig config) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(config.tokens())
                .refillIntervally(config.tokens(), config.duration())
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record RateLimitConfig(long tokens, Duration duration) {}
}
