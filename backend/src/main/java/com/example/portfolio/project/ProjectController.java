package com.example.portfolio.project;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.portfolio.common.PageResponse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/v1/projects")
class ProjectController {

    private final ProjectQueryService service;

    ProjectController(ProjectQueryService service) {
        this.service = service;
    }

    @GetMapping
    PageResponse<ProjectDtos.Summary> list(
            @RequestParam(required = false) ProjectCategory category,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(50) int size) {
        return service.list(category, page, size);
    }

    @GetMapping("/{slug}")
    ProjectDtos.Detail get(@PathVariable String slug) {
        return service.getBySlug(slug);
    }
}
