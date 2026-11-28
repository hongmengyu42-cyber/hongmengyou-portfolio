package com.example.portfolio.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.config.AppProperties;

/** Stores files in a directory (a Docker volume in production), outside any web root. */
@Service
@ConditionalOnExpression("'${app.storage.r2.endpoint:}'.isBlank()")
public class LocalFileStorageService implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFileStorageService.class);

    private final Path root;

    public LocalFileStorageService(AppProperties props) {
        this.root = Path.of(props.storage().localRoot()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create storage directory " + root, e);
        }
    }

    @Override
    public String store(byte[] content, StoredFileType type) {
        String key = UUID.randomUUID() + "." + type.extension();
        try {
            // CREATE_NEW: never overwrite an existing file, even on a (practically impossible) UUID clash.
            Files.write(root.resolve(key), content, StandardOpenOption.CREATE_NEW);
            return key;
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store file", e);
        }
    }

    @Override
    public Resource load(String key) {
        Path path = resolve(key);
        if (path == null || !Files.isRegularFile(path)) {
            throw new ResourceNotFoundException("File", key);
        }
        return new PathResource(path);
    }

    @Override
    public void delete(String key) {
        Path path = resolve(key);
        if (path == null) {
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Could not delete stored file {}", key, e);
        }
    }

    /** Two independent checks: the key must match the strict pattern AND stay inside the root. */
    private Path resolve(String key) {
        if (!StorageKeys.isValid(key)) {
            return null;
        }
        Path path = root.resolve(key).normalize();
        return path.startsWith(root) ? path : null;
    }
}
