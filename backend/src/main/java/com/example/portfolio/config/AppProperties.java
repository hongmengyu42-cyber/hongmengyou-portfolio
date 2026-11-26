package com.example.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed, immutable view of the {@code app.*} configuration. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Site site, Security security, Admin admin, Storage storage, LinkCheck linkcheck) {

    public record Site(String baseUrl) {}

    public record Security(String ipHashSecret, int maxFailedLogins, int lockoutMinutes,
                           int loginAttemptsPerMinute, int contactPerHour) {}

    public record Admin(String email, String password) {}

    public record Storage(String localRoot) {}

    public record LinkCheck(int connectTimeoutMs, int readTimeoutMs, int maxRedirects) {}
}
