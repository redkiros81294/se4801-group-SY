package com.chaintrack.security.rate;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    /**
     * Upper bound on tracked client buckets. Prevents unbounded memory growth
     * from the per-IP bucket map. When exceeded, buckets are reset so only the
     * most recent clients remain rate-limited.
     */
    private static final int MAX_BUCKETS = 10_000;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            String clientKey = resolveClientKey(request);
            Bucket bucket = buckets.computeIfAbsent(clientKey, k -> {
                if (buckets.size() >= MAX_BUCKETS) {
                    buckets.clear();
                }
                return createNewBucket();
            });

            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                response.setStatus(429);
                response.setHeader("Retry-After", "60");
                response.getWriter().write("Too Many Requests - Please try again later.");
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Identifies the client for rate limiting. Uses the left-most X-Forwarded-For
     * address when present (deployments run behind a proxy / load balancer where
     * {@code getRemoteAddr()} would be the proxy itself and every client would
     * share a single bucket).
     */
    private String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int comma = forwardedFor.indexOf(',');
            String first = (comma > 0 ? forwardedFor.substring(0, comma) : forwardedFor).trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        return request.getRemoteAddr();
    }
}
