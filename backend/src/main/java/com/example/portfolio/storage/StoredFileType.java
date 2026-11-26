package com.example.portfolio.storage;

import java.util.Locale;
import java.util.Optional;

/** The only file types this application will ever store. Everything else is rejected. */
public enum StoredFileType {
    JPEG("jpg", "image/jpeg"),
    PNG("png", "image/png"),
    WEBP("webp", "image/webp"),
    PDF("pdf", "application/pdf");

    private final String extension;
    private final String mimeType;

    StoredFileType(String extension, String mimeType) {
        this.extension = extension;
        this.mimeType = mimeType;
    }

    public String extension() { return extension; }
    public String mimeType() { return mimeType; }
    public boolean isImage() { return this != PDF; }

    public static Optional<StoredFileType> fromExtension(String extension) {
        String normalized = extension.toLowerCase(Locale.ROOT);
        for (StoredFileType type : values()) {
            if (type.extension.equals(normalized)) {
                return Optional.of(type);
            }
        }
        return Optional.empty();
    }
}
