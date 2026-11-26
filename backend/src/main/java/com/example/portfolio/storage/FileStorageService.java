package com.example.portfolio.storage;

import org.springframework.core.io.Resource;

/**
 * Where uploaded files live. Services depend on this interface only, so moving from a local
 * Docker volume to S3-compatible storage means adding one class, not touching any caller.
 */
public interface FileStorageService {

    /** Stores the bytes under a new server-generated key and returns that key. */
    String store(byte[] content, StoredFileType type);

    /** @throws com.example.portfolio.common.ResourceNotFoundException if the key is invalid or missing */
    Resource load(String key);

    /** Idempotent and non-throwing: a failed cleanup must never fail a request. */
    void delete(String key);
}
