package com.example.portfolio.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class HttpUrlValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "https://example.com",
            "http://example.com/path?x=1#frag",
            "HTTPS://EXAMPLE.COM/Demo",
            "https://sub.example.co.uk:8443/app"})
    void acceptsHttpAndHttpsUrls(String url) {
        assertThat(HttpUrlValidator.isValidHttpUrl(url)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "javascript:alert(1)",
            "JaVaScRiPt:alert(1)",
            "data:text/html,<script>alert(1)</script>",
            "file:///etc/passwd",
            "ftp://example.com",
            "//example.com",
            "example.com",
            "https://user:secret@example.com",
            "https:///no-host",
            "https://exa mple.com",
            "https://example.com\r\nX-Injected: yes",
            " https://example.com"})
    void rejectsEverythingElse(String url) {
        assertThat(HttpUrlValidatorTest.valid(url)).isFalse();
    }

    @Test
    void rejectsOverlongUrls() {
        assertThat(HttpUrlValidator.isValidHttpUrl("https://example.com/" + "a".repeat(2100))).isFalse();
    }

    @Test
    void nullAndBlankAreLeftToNotBlank() {
        HttpUrlValidator validator = new HttpUrlValidator();
        assertThat(validator.isValid(null, null)).isTrue();
        assertThat(validator.isValid("  ", null)).isTrue();
    }

    private static boolean valid(String url) {
        return HttpUrlValidator.isValidHttpUrl(url);
    }
}
