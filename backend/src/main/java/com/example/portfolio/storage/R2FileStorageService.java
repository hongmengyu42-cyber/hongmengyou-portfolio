package com.example.portfolio.storage;

import java.net.URI;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.config.AppProperties;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * Stores uploaded files in Cloudflare R2 (S3-compatible object storage).
 * Active whenever {@code R2_ENDPOINT} is non-blank; local disk storage is used otherwise.
 */
@Service
@ConditionalOnExpression("!'${app.storage.r2.endpoint:}'.isBlank()")
public class R2FileStorageService implements FileStorageService, DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(R2FileStorageService.class);

    private final S3Client s3;
    private final String bucket;

    public R2FileStorageService(AppProperties props) {
        AppProperties.Storage.R2 r2 = props.storage().r2();
        if (r2 == null || !StringUtils.hasText(r2.endpoint()) || !StringUtils.hasText(r2.bucket())
                || !StringUtils.hasText(r2.accessKey()) || !StringUtils.hasText(r2.secretKey())) {
            throw new IllegalStateException(
                    "R2_ENDPOINT is set, so R2_BUCKET, R2_ACCESS_KEY and R2_SECRET_KEY must also be set.");
        }
        this.bucket = r2.bucket().trim();
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(r2.endpoint().trim()))
                .region(Region.of("auto"))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(r2.accessKey().trim(), r2.secretKey().trim())))
                .forcePathStyle(true)
                .build();
        log.info("Configured Cloudflare R2 file storage (bucket: {})", this.bucket);
    }

    @Override
    public String store(byte[] content, StoredFileType type) {
        String key = UUID.randomUUID() + "." + type.extension();
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(type.mimeType())
                .build();
        s3.putObject(request, RequestBody.fromBytes(content));
        return key;
    }

    @Override
    public Resource load(String key) {
        if (!StorageKeys.isValid(key)) {
            throw new ResourceNotFoundException("File", key);
        }
        try {
            byte[] bytes = s3.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucket).key(key).build()
            ).asByteArray();
            return new ByteArrayResource(bytes);
        } catch (NoSuchKeyException e) {
            throw new ResourceNotFoundException("File", key);
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                throw new ResourceNotFoundException("File", key);
            }
            throw e;
        }
    }

    @Override
    public void delete(String key) {
        if (!StorageKeys.isValid(key)) {
            return;
        }
        try {
            s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception e) {
            log.warn("Could not delete stored file {} from R2", key, e);
        }
    }

    @Override
    public void destroy() {
        s3.close();
    }
}
