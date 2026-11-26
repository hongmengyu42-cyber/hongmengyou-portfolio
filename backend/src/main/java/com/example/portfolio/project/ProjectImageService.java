package com.example.portfolio.project;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.portfolio.common.ConflictException;
import com.example.portfolio.common.InvalidUploadException;
import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.common.TransactionHooks;
import com.example.portfolio.storage.FileStorageService;
import com.example.portfolio.storage.UploadValidator;

@Service
@Transactional
public class ProjectImageService {

    static final int MAX_IMAGES_PER_PROJECT = 12;

    private final ProjectRepository projects;
    private final FileStorageService storage;

    public ProjectImageService(ProjectRepository projects, FileStorageService storage) {
        this.projects = projects;
        this.storage = storage;
    }

    @EvictProjectCaches
    public ProjectDtos.ImageResponse add(Long projectId, MultipartFile file, String altText) {
        if (!StringUtils.hasText(altText) || altText.length() > 200) {
            throw new InvalidUploadException("Alt text is required (max 200 characters) for accessibility.");
        }
        Project project = load(projectId);
        if (project.getImages().size() >= MAX_IMAGES_PER_PROJECT) {
            throw new ConflictException("A project can have at most " + MAX_IMAGES_PER_PROJECT + " images.");
        }
        byte[] data = read(file);
        UploadValidator.InspectedImage image =
                UploadValidator.inspectImage(file.getOriginalFilename(), file.getContentType(), data);

        String key = storage.store(data, image.type());
        TransactionHooks.afterRollback(() -> storage.delete(key)); // no orphan file if the DB write fails

        ProjectImage entity = new ProjectImage(project, key, altText.strip(), image.width(), image.height());
        entity.setSortOrder(project.getImages().size());
        entity.setThumbnail(project.getImages().isEmpty()); // the first image becomes the thumbnail
        project.getImages().add(entity);
        projects.flush(); // assigns the id before we map the response
        return ProjectMapper.toImage(entity);
    }

    @EvictProjectCaches
    public void delete(Long projectId, Long imageId) {
        Project project = load(projectId);
        ProjectImage image = find(project, imageId);
        boolean wasThumbnail = image.isThumbnail();
        project.getImages().remove(image); // orphanRemoval deletes the row
        projects.flush();                   // DELETE must run before promoting a new thumbnail (unique index)
        if (wasThumbnail && !project.getImages().isEmpty()) {
            project.getImages().get(0).setThumbnail(true);
        }
        TransactionHooks.afterCommit(() -> storage.delete(image.getFileKey()));
    }

    @EvictProjectCaches
    public void setThumbnail(Long projectId, Long imageId) {
        Project project = load(projectId);
        ProjectImage target = find(project, imageId);
        project.getImages().forEach(image -> image.setThumbnail(false));
        projects.flush(); // clear the old thumbnail first, or the partial unique index rejects the update
        target.setThumbnail(true);
    }

    @EvictProjectCaches
    public void reorder(Long projectId, List<Long> orderedIds) {
        Project project = load(projectId);
        HashSet<Long> existing = new HashSet<>();
        project.getImages().forEach(image -> existing.add(image.getId()));
        if (orderedIds.size() != existing.size() || !existing.equals(new HashSet<>(orderedIds))) {
            throw new ConflictException("The id list must contain every image of the project exactly once.");
        }
        for (int index = 0; index < orderedIds.size(); index++) {
            find(project, orderedIds.get(index)).setSortOrder(index);
        }
    }

    @EvictProjectCaches
    public ProjectDtos.ImageResponse updateAltText(Long projectId, Long imageId, String altText) {
        ProjectImage image = find(load(projectId), imageId);
        image.setAltText(altText.strip());
        return ProjectMapper.toImage(image);
    }

    private Project load(Long projectId) {
        return projects.findWithAssociationsById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private static ProjectImage find(Project project, Long imageId) {
        return project.getImages().stream().filter(image -> image.getId().equals(imageId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Image", imageId));
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
}
