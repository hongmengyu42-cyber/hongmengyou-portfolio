package com.example.portfolio.profile;

import java.io.IOException;
import java.io.UncheckedIOException;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.portfolio.common.InvalidUploadException;
import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.common.TransactionHooks;
import com.example.portfolio.storage.FileStorageService;
import com.example.portfolio.storage.StorageKeys;
import com.example.portfolio.storage.UploadValidator;

@Service
@Transactional
public class ProfileService {

    private final ProfileRepository repository;
    private final FileStorageService storage;

    public ProfileService(ProfileRepository repository, FileStorageService storage) {
        this.repository = repository;
        this.storage = storage;
    }

    @Cacheable("profile")
    @Transactional(readOnly = true)
    public ProfileDtos.Response get() {
        return toResponse(load());
    }

    @Caching(evict = {@CacheEvict(cacheNames = "profile", allEntries = true),
                      @CacheEvict(cacheNames = "seo-head", allEntries = true)})
    public ProfileDtos.Response update(ProfileDtos.Request r) {
        Profile p = load();
        p.setFullName(r.fullName().strip());
        p.setHeadline(r.headline().strip());
        p.setIntro(nullToEmpty(r.intro()));
        p.setBackground(nullToEmpty(r.background()));
        p.setCareerGoals(nullToEmpty(r.careerGoals()));
        p.setProfessionalSummary(nullToEmpty(r.professionalSummary()));
        p.setPublicEmail(blankToNull(r.publicEmail()));
        p.setGithubUrl(blankToNull(r.githubUrl()));
        p.setLinkedinUrl(blankToNull(r.linkedinUrl()));
        p.setSeoTitle(blankToNull(r.seoTitle()));
        p.setSeoDescription(blankToNull(r.seoDescription()));
        return toResponse(p);
    }

    @Caching(evict = {@CacheEvict(cacheNames = "profile", allEntries = true),
                      @CacheEvict(cacheNames = "seo-head", allEntries = true)})
    public ProfileDtos.Response replaceAvatar(MultipartFile file, String altText) {
        if (!StringUtils.hasText(altText) || altText.length() > 200) {
            throw new InvalidUploadException("Alt text is required (max 200 characters) for accessibility.");
        }
        byte[] data = read(file);
        UploadValidator.InspectedImage image =
                UploadValidator.inspectImage(file.getOriginalFilename(), file.getContentType(), data);
        Profile p = load();
        String oldKey = p.getAvatarKey();
        String newKey = storage.store(data, image.type());
        TransactionHooks.afterRollback(() -> storage.delete(newKey));
        p.setAvatarKey(newKey);
        p.setAvatarAlt(altText.strip());
        if (oldKey != null) {
            TransactionHooks.afterCommit(() -> storage.delete(oldKey));
        }
        return toResponse(p);
    }

    @Caching(evict = {@CacheEvict(cacheNames = "profile", allEntries = true),
                      @CacheEvict(cacheNames = "seo-head", allEntries = true)})
    public ProfileDtos.Response replaceCv(MultipartFile file) {
        byte[] data = read(file);
        UploadValidator.requirePdf(file.getOriginalFilename(), file.getContentType(), data);
        Profile p = load();
        String oldKey = p.getCvKey();
        String newKey = storage.store(data, com.example.portfolio.storage.StoredFileType.PDF);
        TransactionHooks.afterRollback(() -> storage.delete(newKey));
        p.setCvKey(newKey);
        if (oldKey != null) {
            TransactionHooks.afterCommit(() -> storage.delete(oldKey));
        }
        return toResponse(p);
    }

    private Profile load() {
        return repository.findById(Profile.SINGLETON_ID)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", Profile.SINGLETON_ID));
    }

    private static byte[] read(MultipartFile file) {
        if (file.getSize() > UploadValidator.MAX_BYTES) {
            throw new InvalidUploadException("The file is larger than 5 MB.");
        }
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value.strip();
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.strip() : null;
    }

    private static ProfileDtos.Response toResponse(Profile p) {
        return new ProfileDtos.Response(p.getFullName(), p.getHeadline(), p.getIntro(), p.getBackground(),
                p.getCareerGoals(), p.getProfessionalSummary(), p.getPublicEmail(), p.getGithubUrl(),
                p.getLinkedinUrl(), StorageKeys.urlFor(p.getAvatarKey()), p.getAvatarAlt(),
                StorageKeys.urlFor(p.getCvKey()), p.getSeoTitle(), p.getSeoDescription());
    }
}
