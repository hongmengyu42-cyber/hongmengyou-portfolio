package com.example.portfolio.project;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class SlugGenerator {

    private static final int MAX_BASE_LENGTH = 100;

    private SlugGenerator() {}

    /** "Café Müller API!" becomes "cafe-muller-api". */
    public static String slugify(String text) {
        String ascii = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        String slug = ascii.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        if (slug.length() > MAX_BASE_LENGTH) {
            slug = slug.substring(0, MAX_BASE_LENGTH).replaceAll("-+$", "");
        }
        return slug.isEmpty() ? "project" : slug;
    }

    /** Appends -2, -3 ... until the slug is free. */
    public static String unique(String base, Predicate<String> exists) {
        if (!exists.test(base)) {
            return base;
        }
        for (int suffix = 2; suffix < 1000; suffix++) {
            String candidate = base + "-" + suffix;
            if (!exists.test(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not find a free slug for " + base);
    }
}
