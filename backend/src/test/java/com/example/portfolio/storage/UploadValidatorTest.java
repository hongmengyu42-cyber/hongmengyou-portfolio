package com.example.portfolio.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

import com.example.portfolio.common.InvalidUploadException;

class UploadValidatorTest {

    private static byte[] png(int width, int height) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", out);
        return out.toByteArray();
    }

    /** A minimal RIFF/WebP "VP8X" header declaring 800x600. Enough for dimension parsing. */
    private static byte[] webpVp8x() {
        byte[] b = new byte[30];
        byte[] riff = "RIFF".getBytes(StandardCharsets.US_ASCII);
        byte[] webp = "WEBPVP8X".getBytes(StandardCharsets.US_ASCII);
        System.arraycopy(riff, 0, b, 0, 4);
        System.arraycopy(webp, 0, b, 8, 8);
        b[16] = 10;                                  // chunk size
        b[24] = 0x1F; b[25] = 0x03; b[26] = 0x00;   // width - 1 = 799
        b[27] = 0x57; b[28] = 0x02; b[29] = 0x00;   // height - 1 = 599
        return b;
    }

    @Test
    void acceptsValidPngAndReadsDimensions() throws Exception {
        UploadValidator.InspectedImage image = UploadValidator.inspectImage("shot.PNG", "image/png", png(3, 2));
        assertThat(image.type()).isEqualTo(StoredFileType.PNG);
        assertThat(image.width()).isEqualTo(3);
        assertThat(image.height()).isEqualTo(2);
    }

    @Test
    void readsWebpDimensionsWithoutDecoding() {
        UploadValidator.InspectedImage image = UploadValidator.inspectImage("a.webp", "image/webp", webpVp8x());
        assertThat(image.type()).isEqualTo(StoredFileType.WEBP);
        assertThat(image.width()).isEqualTo(800);
        assertThat(image.height()).isEqualTo(600);
    }

    @Test
    void rejectsTextDisguisedAsImage() {
        byte[] fake = "<?php echo 'hi'; ?>".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> UploadValidator.inspectImage("shell.png", "image/png", fake))
                .isInstanceOf(InvalidUploadException.class);
    }

    @Test
    void rejectsDisallowedExtensionEvenWithValidContent() throws Exception {
        byte[] data = png(2, 2);
        assertThatThrownBy(() -> UploadValidator.inspectImage("image.php", "image/png", data))
                .isInstanceOf(InvalidUploadException.class);
        assertThatThrownBy(() -> UploadValidator.inspectImage("image.svg", "image/svg+xml", data))
                .isInstanceOf(InvalidUploadException.class);
    }

    @Test
    void rejectsWrongDeclaredContentType() throws Exception {
        byte[] data = png(2, 2);
        assertThatThrownBy(() -> UploadValidator.inspectImage("a.png", "text/html", data))
                .isInstanceOf(InvalidUploadException.class);
    }

    @Test
    void rejectsEmptyAndOversizedFiles() {
        assertThatThrownBy(() -> UploadValidator.inspectImage("a.png", "image/png", new byte[0]))
                .isInstanceOf(InvalidUploadException.class);
        byte[] huge = new byte[(int) UploadValidator.MAX_BYTES + 1];
        assertThatThrownBy(() -> UploadValidator.inspectImage("a.png", "image/png", huge))
                .isInstanceOf(InvalidUploadException.class);
    }

    @Test
    void pdfMustHaveMagicBytesAndMatchingMetadata() {
        byte[] pdf = "%PDF-1.7 fake body".getBytes(StandardCharsets.US_ASCII);
        UploadValidator.requirePdf("cv.pdf", "application/pdf", pdf); // no exception
        assertThatThrownBy(() -> UploadValidator.requirePdf("cv.pdf", "application/pdf",
                "not a pdf at all".getBytes(StandardCharsets.US_ASCII))).isInstanceOf(InvalidUploadException.class);
        assertThatThrownBy(() -> UploadValidator.requirePdf("cv.exe", "application/pdf", pdf))
                .isInstanceOf(InvalidUploadException.class);
    }

    @Test
    void storageKeysRejectTraversalAndUnknownExtensions() {
        assertThat(StorageKeys.isValid("123e4567-e89b-12d3-a456-426614174000.png")).isTrue();
        assertThat(StorageKeys.isValid("../etc/passwd")).isFalse();
        assertThat(StorageKeys.isValid("123e4567-e89b-12d3-a456-426614174000.svg")).isFalse();
        assertThat(StorageKeys.isValid("123e4567-e89b-12d3-a456-426614174000.png/../x")).isFalse();
        assertThat(StorageKeys.isValid(null)).isFalse();
    }
}
