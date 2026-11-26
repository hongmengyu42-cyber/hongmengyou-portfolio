package com.example.portfolio.project;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.portfolio.common.ConflictException;
import com.example.portfolio.common.PageResponse;
import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.common.TransactionHooks;
import com.example.portfolio.storage.FileStorageService;

@Service
@Transactional
public class ProjectAdminService {

    private final ProjectRepository projects;
    private final TechnologyRepository technologies;
    private final FileStorageService storage;

    public ProjectAdminService(ProjectRepository projects, TechnologyRepository technologies,
                               FileStorageService storage) {
        this.projects = projects;
        this.technologies = technologies;
        this.storage = storage;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectDtos.AdminListItem> list(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("displayOrder", "id"));
        return PageResponse.of(projects.findAll(pageable), ProjectMapper::toAdminListItem);
    }

    @Transactional(readOnly = true)
    public ProjectDtos.AdminDetail get(Long id) {
        return ProjectMapper.toAdminDetail(load(id));
    }

    @EvictProjectCaches
    public ProjectDtos.AdminDetail create(ProjectDtos.Request request) {
        Project project = new Project();
        project.setSlug(resolveNewSlug(request));
        ProjectMapper.apply(request, project, resolveTechnologies(request.technologies()));
        Integer max = projects.findMaxDisplayOrder();
        project.setDisplayOrder(max == null ? 0 : max + 1);
        return ProjectMapper.toAdminDetail(projects.save(project));
    }

    @EvictProjectCaches
    public ProjectDtos.AdminDetail update(Long id, ProjectDtos.Request request) {
        Project project = load(id);
        // A blank slug on update keeps the current one: URLs must not change just because the name did.
        if (StringUtils.hasText(request.slug()) && !request.slug().equals(project.getSlug())) {
            if (projects.existsBySlugAndIdNot(request.slug(), id)) {
                throw new ConflictException("Slug already in use: " + request.slug());
            }
            project.setSlug(request.slug());
        }
        ProjectMapper.apply(request, project, resolveTechnologies(request.technologies()));
        return ProjectMapper.toAdminDetail(project); // managed entity: dirty checking saves it
    }

    @EvictProjectCaches
    public void delete(Long id) {
        Project project = load(id);
        List<String> fileKeys = project.getImages().stream().map(ProjectImage::getFileKey).toList();
        projects.delete(project);
        // Remove files only once the row deletion is really committed.
        TransactionHooks.afterCommit(() -> fileKeys.forEach(storage::delete));
    }

    /** Expects the complete list of project ids, so the result is unambiguous. */
    @EvictProjectCaches
    public void reorder(List<Long> orderedIds) {
        if (orderedIds.size() != new HashSet<>(orderedIds).size()
                || !new HashSet<>(orderedIds).equals(new HashSet<>(projects.findAllIds()))) {
            throw new ConflictException("The id list must contain every project exactly once.");
        }
        Map<Long, Project> byId = new LinkedHashMap<>();
        projects.findAllById(orderedIds).forEach(project -> byId.put(project.getId(), project));
        for (int index = 0; index < orderedIds.size(); index++) {
            byId.get(orderedIds.get(index)).setDisplayOrder(index);
        }
    }

    private Project load(Long id) {
        return projects.findWithAssociationsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private String resolveNewSlug(ProjectDtos.Request request) {
        if (StringUtils.hasText(request.slug())) {
            if (projects.existsBySlug(request.slug())) {
                throw new ConflictException("Slug already in use: " + request.slug());
            }
            return request.slug();
        }
        return SlugGenerator.unique(SlugGenerator.slugify(request.name()), projects::existsBySlug);
    }

    /** Tags are get-or-create by case-insensitive name, so "java" and "Java" are one technology. */
    private Set<Technology> resolveTechnologies(List<String> names) {
        Map<String, String> distinct = new LinkedHashMap<>();
        if (names != null) {
            names.forEach(name -> distinct.putIfAbsent(name.strip().toLowerCase(Locale.ROOT), name.strip()));
        }
        Set<Technology> result = new LinkedHashSet<>();
        distinct.values().forEach(name -> result.add(technologies.findByNameIgnoreCase(name)
                .orElseGet(() -> technologies.save(new Technology(name)))));
        return result;
    }
}
