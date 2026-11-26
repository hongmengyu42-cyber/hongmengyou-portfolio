package com.example.portfolio.storage;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import com.example.portfolio.common.InvalidUploadException;

/**
 * Validates uploads by their actual bytes. The file name and Content-Type header are client-controlled,
 * so they are checked (allow-list) but never trusted: the magic bytes decide the real type.
 */
public final class UploadValidator {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final int MAX_DIMENSION = 10_000;
    private static final long MAX_PIXELS = 40_000_000L;
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> IMAGE_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    static {
        // Read image headers from memory; never spill uploads into temp files.
        ImageIO.setUseCache(false);
    }

    private UploadValidator() {}

    public record InspectedImage(StoredFileType type, int width, int height) {}

    public static InspectedImage inspectImage(String originalFilename, String contentType, byte[] data) {
        requireSize(data);
        requireAllowedExtension(originalFilename, IMAGE_EXTENSIONS);
        if (contentType == null || !IMAGE_MIME_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new InvalidUploadException("Only JPEG, PNG and WebP images are allowed.");
        }
        StoredFileType detected = sniffImageType(data);
        int[] size = switch (detected) {
            case WEBP -> webpDimensions(data);
            default -> imageIoDimensions(data);
        };
        if (size[0] <= 0 || size[1] <= 0 || size[0] > MAX_DIMENSION || size[1] > MAX_DIMENSION
                || (long) size[0] * size[1] > MAX_PIXELS) {
            throw new InvalidUploadException("Image dimensions are invalid or too large.");
        }
        return new InspectedImage(detected, size[0], size[1]);
    }

    public static void requirePdf(String originalFilename, String contentType, byte[] data) {
        requireSize(data);
        requireAllowedExtension(originalFilename, Set.of("pdf"));
        boolean magic = data.length > 5 && data[0] == '%' && data[1] == 'P' && data[2] == 'D'
                && data[3] == 'F' && data[4] == '-';
        if (!magic || !"application/pdf".equalsIgnoreCase(contentType)) {
            throw new InvalidUploadException("Only PDF files are allowed.");
        }
    }

    private static void requireSize(byte[] data) {
        if (data.length == 0) {
            throw new InvalidUploadException("The file is empty.");
        }
        if (data.length > MAX_BYTES) {
            throw new InvalidUploadException("The file is larger than 5 MB.");
        }
    }

    private static void requireAllowedExtension(String filename, Set<String> allowed) {
        String name = filename == null ? "" : filename;
        int dot = name.lastIndexOf('.');
        String extension = dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!allowed.contains(extension)) {
            throw new InvalidUploadException("File extension is not allowed.");
        }
    }

    static StoredFileType sniffImageType(byte[] d) {
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
            return StoredFileType.JPEG;
        }
        if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G'
                && d[4] == 0x0D && d[5] == 0x0A && d[6] == 0x1A && d[7] == 0x0A) {
            return StoredFileType.PNG;
        }
        if (d.length >= 30 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return StoredFileType.WEBP;
        }
        throw new InvalidUploadException("The file content is not a valid JPEG, PNG or WebP image.");
    }

    /** Reads width/height from the header only, so a "decompression bomb" is never decoded. */
    private static int[] imageIoDimensions(byte[] data) {
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(data))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(in);
            if (!readers.hasNext()) {
                throw new InvalidUploadException("The image could not be read.");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(in);
                return new int[] {reader.getWidth(0), reader.getHeight(0)};
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
            if (e instanceof InvalidUploadException invalid) {
                throw invalid;
            }
            throw new InvalidUploadException("The image could not be read.");
        }
    }

    /** Java 17 cannot decode WebP, so parse the RIFF header for the three WebP flavours. */
    static int[] webpDimensions(byte[] b) {
        String chunk = new String(b, 12, 4, java.nio.charset.StandardCharsets.US_ASCII);
        switch (chunk) {
            case "VP8X" -> {
                int width = 1 + ((b[24] & 0xFF) | (b[25] & 0xFF) << 8 | (b[26] & 0xFF) << 16);
                int height = 1 + ((b[27] & 0xFF) | (b[28] & 0xFF) << 8 | (b[29] & 0xFF) << 16);
                return new int[] {width, height};
            }
            case "VP8L" -> {
                if ((b[20] & 0xFF) != 0x2F) {
                    break;
                }
                long bits = (b[21] & 0xFFL) | (b[22] & 0xFFL) << 8 | (b[23] & 0xFFL) << 16 | (b[24] & 0xFFL) << 24;
                return new int[] {(int) (bits & 0x3FFF) + 1, (int) ((bits >> 14) & 0x3FFF) + 1};
            }
            case "VP8 " -> {
                if ((b[23] & 0xFF) != 0x9D || (b[24] & 0xFF) != 0x01 || (b[25] & 0xFF) != 0x2A) {
                    break;
                }
                int width = ((b[26] & 0xFF) | (b[27] & 0xFF) << 8) & 0x3FFF;
                int height = ((b[28] & 0xFF) | (b[29] & 0xFF) << 8) & 0x3FFF;
                return new int[] {width, height};
            }
            default -> { }
        }
        throw new InvalidUploadException("The WebP image could not be read.");
    }
}
