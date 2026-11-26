package com.example.portfolio.security;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Minimal fixed-window limiter: at most {@code limit} hits per key per window.
 * The window starts at a key's first hit because the cache entry expires after being written.
 * In-memory, so limits reset on restart and are per instance; fine for a single-instance portfolio.
 */
public class FixedWindowRateLimiter {

    private final int limit;
    private final Cache<String, AtomicInteger> hits;

    public FixedWindowRateLimiter(int limit, Duration window) {
        this.limit = limit;
        this.hits = Caffeine.newBuilder()
                .expireAfterWrite(window)
                .maximumSize(50_000) // bounds memory even under a spoofed-key flood
                .build();
    }

    /** @return true if the call is allowed, false if the key is over its limit. */
    public boolean tryAcquire(String key) {
        return hits.get(key, k -> new AtomicInteger()).incrementAndGet() <= limit;
    }
}
