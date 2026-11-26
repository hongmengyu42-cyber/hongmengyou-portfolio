package com.example.portfolio.config;

import java.time.Clock;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.portfolio.security.FixedWindowRateLimiter;

@Configuration
@EnableCaching
public class AppConfig {

    /** Injected instead of calling Instant.now() so time-dependent logic is testable. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    @Qualifier("loginRateLimiter")
    FixedWindowRateLimiter loginRateLimiter(AppProperties props) {
        return new FixedWindowRateLimiter(props.security().loginAttemptsPerMinute(), Duration.ofMinutes(1));
    }

    @Bean
    @Qualifier("contactRateLimiter")
    FixedWindowRateLimiter contactRateLimiter(AppProperties props) {
        return new FixedWindowRateLimiter(props.security().contactPerHour(), Duration.ofHours(1));
    }
}
