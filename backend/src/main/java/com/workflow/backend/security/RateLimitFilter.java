package com.workflow.backend.security;

import tools.jackson.databind.ObjectMapper;
import com.workflow.backend.exception.GlobalExceptionHandler;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    private final ObjectMapper objectMapper;

    // IP bazlı bucket'ları tutan map (endpoint -> IP -> Bucket)
    private final Map<String, Map<String, Bucket>> buckets = new ConcurrentHashMap<>();

    // Endpoint başına maksimum izin verilen benzersiz IP sayısı (Memory DoS koruması)
    private static final int MAX_BUCKETS_PER_ENDPOINT = 10_000;

    // Auth endpoint'leri için rate limit konfigürasyonları (düşük limitler — brute-force koruması)
    private static final Map<String, RateLimitConfig> AUTH_RATE_LIMITS = Map.ofEntries(
            Map.entry("/auth/login", new RateLimitConfig(5, Duration.ofMinutes(5))),
            Map.entry("/auth/register/send-code", new RateLimitConfig(5, Duration.ofMinutes(15))),
            Map.entry("/auth/register", new RateLimitConfig(3, Duration.ofMinutes(15))),
            Map.entry("/auth/refresh", new RateLimitConfig(10, Duration.ofMinutes(5))),
            Map.entry("/auth/forgot-password", new RateLimitConfig(3, Duration.ofMinutes(15))),
            Map.entry("/auth/verify-code", new RateLimitConfig(5, Duration.ofMinutes(5))),
            Map.entry("/auth/reset-password", new RateLimitConfig(3, Duration.ofMinutes(15))),
            Map.entry("/auth/check-username", new RateLimitConfig(15, Duration.ofMinutes(5))),
            Map.entry("/auth/google", new RateLimitConfig(10, Duration.ofMinutes(5))),
            Map.entry("/auth/logout", new RateLimitConfig(10, Duration.ofMinutes(5)))
    );

    // Authenticated (CRUD) endpoint'ler için genel rate limit (dakikada 60 istek)
    private static final RateLimitConfig AUTHENTICATED_RATE_LIMIT = new RateLimitConfig(60, Duration.ofMinutes(1));

    // Rate limiting dışında tutulacak path'ler (statik kaynaklar, swagger, error)
    private static final String[] EXCLUDED_PATHS = {
            "/swagger-ui", "/v3/api-docs", "/swagger-resources", "/error"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Statik kaynaklar ve swagger için rate limiting uygulanmaz
        if (isExcludedPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        // Auth endpoint'leri: endpoint bazlı rate limiting
        if (path.startsWith("/auth/")) {
            RateLimitConfig config = findAuthRateLimitConfig(path);
            if (config == null) {
                // Auth altında tanımsız bir endpoint — güvenlik için genel auth limiti uygula
                config = new RateLimitConfig(10, Duration.ofMinutes(5));
            }
            if (!tryConsume(path, clientIp, config, response)) {
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        // Authenticated endpoint'ler (boards, tasks, lists, subtasks, labels, users):
        // IP bazlı genel rate limiting — dakikada 60 istek
        String bucketKey = "authenticated_global";
        if (!tryConsume(bucketKey, clientIp, AUTHENTICATED_RATE_LIMIT, response)) {
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Rate limit kontrolü yapar. Limit aşılmışsa 429 yanıtı döner ve false döner.
     * Başarılı ve başarısız durumlarda RateLimit-* header'larını ekler.
     */
    private boolean tryConsume(String bucketKey, String clientIp, RateLimitConfig config, HttpServletResponse response)
            throws IOException {
        Bucket bucket = resolveBucket(bucketKey, clientIp, config);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        response.setHeader("RateLimit-Limit", String.valueOf(config.tokens()));
        response.setHeader("RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
        response.setHeader("RateLimit-Reset", String.valueOf(
                Math.max(0, probe.getNanosToWaitForRefill() / 1_000_000_000)));

        if (probe.isConsumed()) {
            return true;
        }
        logger.warn("Rate limit exceeded for IP: {} on endpoint: {}", clientIp, bucketKey);
        response.setHeader("Retry-After", String.valueOf(
                Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000)));
        response.setStatus(429); // Too Many Requests
        response.setContentType("application/json");
        GlobalExceptionHandler.ErrorResponse errorResponse = new GlobalExceptionHandler.ErrorResponse(
                429, "Too Many Requests",
                "İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.", null);
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
        return false;
    }

    private boolean isExcludedPath(String path) {
        for (String excluded : EXCLUDED_PATHS) {
            if (path.startsWith(excluded)) {
                return true;
            }
        }
        return false;
    }

    private RateLimitConfig findAuthRateLimitConfig(String path) {
        // Tam eşleşme kontrolü (öncelikli — /auth/register/send-code gibi daha spesifik path'ler)
        if (AUTH_RATE_LIMITS.containsKey(path)) {
            return AUTH_RATE_LIMITS.get(path);
        }
        // Prefix eşleşmesi için kontrol (en uzun eşleşmeyi bul)
        RateLimitConfig bestMatch = null;
        int bestLength = 0;
        for (Map.Entry<String, RateLimitConfig> entry : AUTH_RATE_LIMITS.entrySet()) {
            if (path.startsWith(entry.getKey()) && entry.getKey().length() > bestLength) {
                bestMatch = entry.getValue();
                bestLength = entry.getKey().length();
            }
        }
        return bestMatch;
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
