package com.example.portfolio.project;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.portfolio.common.PageResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/v1/admin/projects")
class AdminProjectController {

    private final ProjectAdminService service;

    AdminProjectController(ProjectAdminService service) {
        this.service = service;
    }

    @GetMapping
    PageResponse<ProjectDtos.AdminListItem> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    ProjectDtos.AdminDetail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    ResponseEntity<ProjectDtos.AdminDetail> create(@Valid @RequestBody ProjectDtos.Request request) {
        ProjectDtos.AdminDetail created = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/admin/projects/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    ProjectDtos.AdminDetail update(@PathVariable Long id, @Valid @RequestBody ProjectDtos.Request request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** The literal path "order" takes priority over "/{id}" in Spring's matching. */
    @PutMapping("/order")
    ResponseEntity<Void> reorder(@Valid @RequestBody ProjectDtos.OrderRequest request) {
        service.reorder(request.ids());
        return ResponseEntity.noContent().build();
    }
}
