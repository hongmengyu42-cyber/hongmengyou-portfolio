package com.example.portfolio.common;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Allow-list validation: only http/https with a host. This rejects javascript:, data:, file:,
 * scheme-less and credential-bearing URLs. An allow-list is safer than a deny-list of bad schemes.
 */
public class HttpUrlValidator implements ConstraintValidator<HttpUrl, String> {

    private static final int MAX_LENGTH = 2048;

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.isBlank() || isValidHttpUrl(value);
    }

    public static boolean isValidHttpUrl(String value) {
        if (value.length() > MAX_LENGTH || value.chars().anyMatch(c -> c <= 0x20 || c == 0x7F)) {
            return false; // whitespace and control characters (also catches CR/LF injection)
        }
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            return (scheme.equals("http") || scheme.equals("https"))
                    && uri.getHost() != null
                    && uri.getUserInfo() == null;
        } catch (URISyntaxException e) {
            return false;
        }
    }
}
