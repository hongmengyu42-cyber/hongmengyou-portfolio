package com.example.portfolio.security;

import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

/**
 * Bridges Spring Security events to the lockout counter. Only BadCredentials failures count:
 * attempts against an already-locked account (a different event) do not extend the lockout.
 */
@Component
class AuthenticationEvents {

    private final LoginAttemptService attempts;

    AuthenticationEvents(LoginAttemptService attempts) {
        this.attempts = attempts;
    }

    @EventListener
    void onFailure(AuthenticationFailureBadCredentialsEvent event) {
        attempts.recordFailure(event.getAuthentication().getName());
    }

    @EventListener
    void onSuccess(AuthenticationSuccessEvent event) {
        attempts.recordSuccess(event.getAuthentication().getName());
    }
}
