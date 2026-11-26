package com.example.portfolio.storage;

import java.time.Duration;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.portfolio.common.ResourceNotFoundException;

/** Serves uploaded files. Keys are random and never reused, so responses can be cached "forever". */
@RestController
@RequestMapping("/api/v1/files")
class FileController {

    private final FileStorageService storage;

    FileController(FileStorageService storage) {
        this.storage = storage;
    }

    @GetMapping("/{key}")
    ResponseEntity<Resource> get(@PathVariable String key) {
        if (!StorageKeys.isValid(key)) {
            throw new ResourceNotFoundException("File", key);
        }
        StoredFileType type = StoredFileType.fromExtension(key.substring(key.lastIndexOf('.') + 1))
                .orElseThrow(() -> new ResourceNotFoundException("File", key));
        ResponseEntity.BodyBuilder response = ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(type.mimeType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
        if (!type.isImage()) {
            response.header(HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.attachment().filename("cv.pdf").build().toString());
        }
        return response.body(storage.load(key));
    }
}
