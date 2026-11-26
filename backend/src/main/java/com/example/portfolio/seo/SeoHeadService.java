package com.example.portfolio.seo;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.config.AppProperties;
import com.example.portfolio.profile.ProfileDtos;
import com.example.portfolio.profile.ProfileService;
import com.example.portfolio.project.ProjectDtos;
import com.example.portfolio.project.ProjectQueryService;

/**
 * Builds the {@code <head>} tags (title, description, canonical, Open Graph, JSON-LD) for a URL path.
 * Social crawlers do not run JavaScript, so these must exist in the HTML the server sends.
 * The reverse proxy pulls this fragment into index.html (see the Phase 5 nginx config).
 * Every dynamic value is escaped for its context: HTML attributes here, JSON strings inside JSON-LD.
 */
@Service
public class SeoHeadService {

    private static final Pattern PROJECT_PATH = Pattern.compile("^/projects/([a-z0-9]+(?:-[a-z0-9]+)*)$");

    private final ProfileService profiles;
    private final ProjectQueryService projects;
    private final String baseUrl;

    public SeoHeadService(ProfileService profiles, ProjectQueryService projects, AppProperties props) {
        this.profiles = profiles;
        this.projects = projects;
        this.baseUrl = props.site().baseUrl().replaceAll("/+$", "");
    }

    /** Only known shapes become cache keys, so arbitrary URLs cannot flood the cache. */
    public static String normalize(String path) {
        return path != null && PROJECT_PATH.matcher(path).matches() ? path : "/";
    }

    @Cacheable(cacheNames = "seo-head", key = "T(com.example.portfolio.seo.SeoHeadService).normalize(#path)")
    public String headFor(String path) {
        String normalized = normalize(path);
        ProfileDtos.Response profile = profiles.get();

        String title = firstText(profile.seoTitle(), profile.fullName() + " | " + profile.headline());
        String description = firstText(profile.seoDescription(), profile.intro());
        String canonical = baseUrl + "/";
        String type = "website";
        String image = absolute(profile.avatarUrl());
        boolean home = true;

        Matcher matcher = PROJECT_PATH.matcher(normalized);
        if (matcher.matches()) {
            try {
                ProjectDtos.Detail project = projects.getBySlug(matcher.group(1));
                title = project.name() + " | " + profile.fullName();
                description = project.summary();
                canonical = baseUrl + normalized;
                type = "article";
                home = false;
                image = project.images().stream().filter(ProjectDtos.ImageResponse::thumbnail).findFirst()
                        .or(() -> project.images().stream().findFirst())
                        .map(img -> absolute(img.url())).orElse(image);
            } catch (ResourceNotFoundException e) {
                // Unknown or unpublished slug: fall back to the site defaults.
            }
        }
        return render(title, description, canonical, type, image, home ? personJsonLd(profile, image) : null);
    }

    private String render(String title, String description, String canonical, String type, String image,
                          String jsonLd) {
        List<String> lines = new ArrayList<>();
        lines.add("<title>" + esc(title) + "</title>");
        lines.add(meta("name", "description", description));
        lines.add("<link rel=\"canonical\" href=\"" + esc(canonical) + "\">");
        lines.add(meta("property", "og:type", type));
        lines.add(meta("property", "og:title", title));
        lines.add(meta("property", "og:description", description));
        lines.add(meta("property", "og:url", canonical));
        lines.add(meta("name", "twitter:card", image == null ? "summary" : "summary_large_image"));
        lines.add(meta("name", "twitter:title", title));
        lines.add(meta("name", "twitter:description", description));
        if (image != null) {
            lines.add(meta("property", "og:image", image));
            lines.add(meta("name", "twitter:image", image));
        }
        if (jsonLd != null) {
            lines.add("<script type=\"application/ld+json\">" + jsonLd + "</script>");
        }
        return String.join("\n", lines) + "\n";
    }

    private String personJsonLd(ProfileDtos.Response profile, String image) {
        List<String> parts = new ArrayList<>();
        parts.add("\"@context\":\"https://schema.org\"");
        parts.add("\"@type\":\"Person\"");
        parts.add("\"name\":" + jsonString(profile.fullName()));
        parts.add("\"jobTitle\":" + jsonString(profile.headline()));
        parts.add("\"url\":" + jsonString(baseUrl + "/"));
        if (image != null) {
            parts.add("\"image\":" + jsonString(image));
        }
        List<String> sameAs = new ArrayList<>();
        if (StringUtils.hasText(profile.githubUrl())) sameAs.add(jsonString(profile.githubUrl()));
        if (StringUtils.hasText(profile.linkedinUrl())) sameAs.add(jsonString(profile.linkedinUrl()));
        if (!sameAs.isEmpty()) {
            parts.add("\"sameAs\":[" + String.join(",", sameAs) + "]");
        }
        return "{" + String.join(",", parts) + "}";
    }

    private String absolute(String path) {
        return path == null ? null : baseUrl + path;
    }

    private static String meta(String attribute, String name, String content) {
        return "<meta " + attribute + "=\"" + name + "\" content=\"" + esc(content) + "\">";
    }

    private static String esc(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private static String firstText(String first, String fallback) {
        return StringUtils.hasText(first) ? first : fallback;
    }

    /** JSON string literal that is also safe inside a script tag ("</script>" cannot appear). */
    static String jsonString(String value) {
        StringBuilder out = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '<', '>', '&', 0x2028, 0x2029 -> out.append(String.format("\\u%04x", (int) c));
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        return out.append('"').toString();
    }
}
