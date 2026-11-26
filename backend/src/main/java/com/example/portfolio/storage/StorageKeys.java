package com.example.portfolio.storage;

import java.util.regex.Pattern;

/** Storage keys are server-generated UUIDs plus an allow-listed extension, never user input. */
public final class StorageKeys {

    private static final Pattern VALID = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp|pdf)$");

    private StorageKeys() {}

    /** Validating the shape of a key before touching the file system is what blocks path traversal. */
    public static boolean isValid(String key) {
        return key != null && VALID.matcher(key).matches();
    }

    /** Public URL of a stored file; null-safe so mappers can pass optional keys straight in. */
    public static String urlFor(String key) {
        return key == null ? null : "/api/v1/files/" + key;
    }
}
