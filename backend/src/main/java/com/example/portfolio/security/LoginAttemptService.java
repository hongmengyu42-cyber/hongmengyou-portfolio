package com.example.portfolio.security;

import java.time.Clock;
import java.time.Duration;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.portfolio.admin.AdminUserRepository;
import com.example.portfolio.config.AppProperties;

/** Per-account lockout (the per-IP limit lives in LoginRateLimitFilter). */
@Service
public class LoginAttemptService {

    private final AdminUserRepository users;
    private final AppProperties.Security settings;
    private final Clock clock;

    public LoginAttemptService(AdminUserRepository users, AppProperties props, Clock clock) {
        this.users = users;
        this.settings = props.security();
        this.clock = clock;
    }

    @Transactional
    public void recordFailure(String email) {
        users.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            int attempts = user.getFailedAttempts() + 1;
            if (attempts >= settings.maxFailedLogins()) {
                user.setLockedUntil(clock.instant().plus(Duration.ofMinutes(settings.lockoutMinutes())));
                user.setFailedAttempts(0);
            } else {
                user.setFailedAttempts(attempts);
            }
        });
    }

    @Transactional
    public void recordSuccess(String email) {
        users.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            user.setFailedAttempts(0);
            user.setLockedUntil(null);
        });
    }
}
