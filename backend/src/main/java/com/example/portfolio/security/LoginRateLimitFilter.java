package com.example.portfolio.security;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rejects login attempts from an IP that is over its limit, before any password is checked.
 * Not a @Component on purpose: it is added to the security chain explicitly, so it is not
 * also registered as a plain servlet filter (which would run it twice).
 * The IP comes from getRemoteAddr(); Tomcat resolves X-Forwarded-For only from trusted proxies.
 */
final class LoginRateLimitFilter extends OncePerRequestFilter {

    private final FixedWindowRateLimiter limiter;
    private final String loginUrl;

    LoginRateLimitFilter(FixedWindowRateLimiter limiter, String loginUrl) {
        this.limiter = limiter;
        this.loginUrl = loginUrl;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean isLoginAttempt = HttpMethod.POST.matches(request.getMethod())
                && loginUrl.equals(request.getRequestURI());
        if (isLoginAttempt && !limiter.tryAcquire(request.getRemoteAddr())) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader(HttpHeaders.RETRY_AFTER, "60");
            response.setContentType("application/problem+json");
            response.getWriter().write("{\"title\":\"Too many requests\",\"status\":429,"
                    + "\"detail\":\"Too many login attempts. Try again later.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
