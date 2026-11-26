package com.example.portfolio.project;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.portfolio.common.PageResponse;
import com.example.portfolio.common.ResourceNotFoundException;

/** Public, read-only, cached. Only published projects are ever visible here. */
@Service
@Transactional(readOnly = true)
public class ProjectQueryService {

    // The client cannot choose a sort field: that would be an injection surface for no benefit.
    private static final Sort PUBLIC_SORT = Sort.by(
            Sort.Order.desc("featured"), Sort.Order.asc("displayOrder"), Sort.Order.asc("id"));

    private final ProjectRepository projects;

    public ProjectQueryService(ProjectRepository projects) {
        this.projects = projects;
    }

    @Cacheable(cacheNames = "projects", key = "'list:' + #category + ':' + #page + ':' + #size")
    public PageResponse<ProjectDtos.Summary> list(ProjectCategory category, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, PUBLIC_SORT);
        Page<Project> result = category == null
                ? projects.findByPublishedTrue(pageable)
                : projects.findByPublishedTrueAndCategory(category, pageable);
        return PageResponse.of(result, ProjectMapper::toSummary);
    }

    @Cacheable(cacheNames = "project-detail", key = "#slug")
    public ProjectDtos.Detail getBySlug(String slug) {
        return projects.findBySlugAndPublishedTrue(slug)
                .map(ProjectMapper::toDetail)
                .orElseThrow(() -> new ResourceNotFoundException("Project", slug));
    }
}
