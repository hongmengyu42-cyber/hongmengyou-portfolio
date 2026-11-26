package com.example.portfolio.project;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.util.StringUtils;

import com.example.portfolio.storage.StorageKeys;

/** Manual mapping: explicit, debuggable, and no annotation processor to configure. */
final class ProjectMapper {

    private ProjectMapper() {}

    static ProjectDtos.ImageResponse toImage(ProjectImage image) {
        return new ProjectDtos.ImageResponse(image.getId(), StorageKeys.urlFor(image.getFileKey()),
                image.getAltText(), image.isThumbnail(), image.getSortOrder(), image.getWidth(), image.getHeight());
    }

    private static ProjectImage thumbnailOf(Project project) {
        return project.getImages().stream().filter(ProjectImage::isThumbnail).findFirst().orElse(null);
    }

    private static List<String> technologyNames(Project project) {
        return project.getTechnologies().stream().map(Technology::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER).toList();
    }

    static ProjectDtos.Summary toSummary(Project p) {
        ProjectImage thumbnail = thumbnailOf(p);
        return new ProjectDtos.Summary(p.getId(), p.getSlug(), p.getName(), p.getSummary(), p.getCategory(),
                p.getStatus(), technologyNames(p), p.getLiveUrl(), p.getGithubUrl(), p.isFeatured(),
                thumbnail == null ? null : toImage(thumbnail));
    }

    static ProjectDtos.Detail toDetail(Project p) {
        return new ProjectDtos.Detail(p.getId(), p.getSlug(), p.getName(), p.getSummary(), p.getDescription(),
                p.getProblem(), p.getSolution(), List.copyOf(p.getKeyFeatures()), p.getCategory(), p.getStatus(),
                technologyNames(p), p.getLiveUrl(), p.getGithubUrl(), p.isFeatured(),
                p.getImages().stream().map(ProjectMapper::toImage).toList());
    }

    static ProjectDtos.AdminListItem toAdminListItem(Project p) {
        ProjectImage thumbnail = thumbnailOf(p);
        return new ProjectDtos.AdminListItem(p.getId(), p.getSlug(), p.getName(), p.getCategory(), p.getStatus(),
                p.isFeatured(), p.isPublished(), p.getDisplayOrder(), p.getLinkStatus(), p.getLinkCheckedAt(),
                thumbnail == null ? null : StorageKeys.urlFor(thumbnail.getFileKey()));
    }

    static ProjectDtos.AdminDetail toAdminDetail(Project p) {
        return new ProjectDtos.AdminDetail(p.getId(), p.getSlug(), p.getName(), p.getSummary(), p.getDescription(),
                p.getProblem(), p.getSolution(), List.copyOf(p.getKeyFeatures()), p.getCategory(), p.getStatus(),
                technologyNames(p), p.getLiveUrl(), p.getGithubUrl(), p.isFeatured(), p.isPublished(),
                p.getDisplayOrder(), p.getLinkStatus(), p.getLinkCheckedAt(),
                p.getImages().stream().sorted(Comparator.comparingInt(ProjectImage::getSortOrder))
                        .map(ProjectMapper::toImage).toList(),
                p.getCreatedAt(), p.getUpdatedAt());
    }

    /** Copies request fields onto the entity. The slug and display order are decided by the service. */
    static void apply(ProjectDtos.Request request, Project project, Set<Technology> technologies) {
        project.setName(request.name().strip());
        project.setSummary(request.summary().strip());
        project.setDescription(request.description().strip());
        project.setProblem(blankToNull(request.problem()));
        project.setSolution(blankToNull(request.solution()));
        project.setCategory(request.category());
        project.setStatus(request.status());
        project.setLiveUrl(blankToNull(request.liveUrl()));
        project.setGithubUrl(blankToNull(request.githubUrl()));
        project.setFeatured(request.featured());
        project.setPublished(request.published());
        project.getKeyFeatures().clear();
        if (request.keyFeatures() != null) {
            request.keyFeatures().forEach(feature -> project.getKeyFeatures().add(feature.strip()));
        }
        project.getTechnologies().clear();
        project.getTechnologies().addAll(technologies);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.strip() : null;
    }
}
