package com.workflow.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
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

    // Endpoint başına maksimum izin verilen benzersiz IP sayısı (Memory DoS koruması)
    private static final int MAX_BUCKETS_PER_ENDPOINT = 10_000;

    // Rate limit konfigürasyonları
    private static final Map<String, RateLimitConfig> RATE_LIMITS = Map.ofEntries(
            Map.entry("/auth/login", new RateLimitConfig(5, Duration.ofMinutes(5))),
            Map.entry("/auth/register", new RateLimitConfig(3, Duration.ofMinutes(15))),
            Map.entry("/auth/refresh", new RateLimitConfig(10, Duration.ofMinutes(5))),
            Map.entry("/auth/forgot-password", new RateLimitConfig(3, Duration.ofMinutes(15))),
            Map.entry("/auth/verify-code", new RateLimitConfig(5, Duration.ofMinutes(5))),
            Map.entry("/auth/reset-password", new RateLimitConfig(3, Duration.ofMinutes(15))),
            Map.entry("/auth/google", new RateLimitConfig(10, Duration.ofMinutes(5)))
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
        Map<String, Bucket> endpointBuckets = buckets.computeIfAbsent(endpoint, k -> new ConcurrentHashMap<>());

        // Memory DoS koruması: Endpoint başına bucket sayısı sınırını aşarsa map'i temizle
        if (endpointBuckets.size() > MAX_BUCKETS_PER_ENDPOINT) {
            logger.warn("Bucket limit exceeded for endpoint: {}. Clearing all buckets for this endpoint.", endpoint);
            endpointBuckets.clear();
        }

        return endpointBuckets.computeIfAbsent(clientIp, k -> createBucket(config));
    }

    private Bucket createBucket(RateLimitConfig config) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(config.tokens())
                .refillIntervally(config.tokens(), config.duration())
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        // Sadece request.getRemoteAddr() kullanılır.
        // X-Forwarded-For header'ı client tarafından manipüle edilebilir (IP Spoofing).
        // Reverse proxy arkasındaysa, proxy'nin trusted IP'yi RemoteAddr olarak set etmesi gerekir.
        return request.getRemoteAddr();
    }

    /**
     * Her 30 dakikada bir tüm bucket'ları temizler.
     * Bucket4j bucket'ları zaman bazlı token yenileme yaptığı için,
     * temizlenen bucket'lar bir sonraki istekte yeniden oluşturulur.
     * Bu mekanizma bellek sızıntısını önler.
     */
    @Scheduled(fixedRate = 30 * 60 * 1000) // 30 dakika
    public void cleanupBuckets() {
        int totalEntries = buckets.values().stream().mapToInt(Map::size).sum();
        buckets.clear();
        logger.info("Rate limit bucket cleanup completed. Cleared {} entries.", totalEntries);
    }

    private record RateLimitConfig(long tokens, Duration duration) {}
}
