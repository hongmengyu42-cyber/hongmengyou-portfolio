package com.example.portfolio.project;

import java.time.Instant;
import java.util.List;

import com.example.portfolio.common.HttpUrl;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request/response shapes for projects. JPA entities never leave the service layer. */
public final class ProjectDtos {

    private ProjectDtos() {}

    public record ImageResponse(Long id, String url, String altText, boolean thumbnail,
                                int sortOrder, int width, int height) {}

    /** Card in the public grid. */
    public record Summary(Long id, String slug, String name, String summary, ProjectCategory category,
                          ProjectStatus status, List<String> technologies, String liveUrl, String githubUrl,
                          boolean featured, ImageResponse thumbnail) {}

    /** Public detail page. */
    public record Detail(Long id, String slug, String name, String summary, String description,
                         String problem, String solution, List<String> keyFeatures,
                         ProjectCategory category, ProjectStatus status, List<String> technologies,
                         String liveUrl, String githubUrl, boolean featured, List<ImageResponse> images) {}

    public record AdminListItem(Long id, String slug, String name, ProjectCategory category,
                                ProjectStatus status, boolean featured, boolean published, int displayOrder,
                                LinkStatus linkStatus, Instant linkCheckedAt, String thumbnailUrl) {}

    public record AdminDetail(Long id, String slug, String name, String summary, String description,
                              String problem, String solution, List<String> keyFeatures,
                              ProjectCategory category, ProjectStatus status, List<String> technologies,
                              String liveUrl, String githubUrl, boolean featured, boolean published,
                              int displayOrder, LinkStatus linkStatus, Instant linkCheckedAt,
                              List<ImageResponse> images, Instant createdAt, Instant updatedAt) {}

    public record Request(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 140) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
                    message = "must be lowercase letters, digits and single hyphens") String slug,
            @NotBlank @Size(max = 300) String summary,
            @NotBlank @Size(max = 20_000) String description,
            @Size(max = 5_000) String problem,
            @Size(max = 5_000) String solution,
            @Size(max = 20) List<@NotBlank @Size(max = 200) String> keyFeatures,
            @NotNull ProjectCategory category,
            @NotNull ProjectStatus status,
            @HttpUrl String liveUrl,
            @HttpUrl String githubUrl,
            boolean featured,
            boolean published,
            @Size(max = 30) List<@NotBlank @Size(max = 50) String> technologies) {}

    /** The complete list of ids in the desired order. */
    public record OrderRequest(@NotEmpty List<@NotNull Long> ids) {}

    public record AltTextRequest(@NotBlank @Size(max = 200) String altText) {}
}
