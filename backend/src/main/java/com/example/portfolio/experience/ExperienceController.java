package com.example.portfolio.experience;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
class ExperienceController {

    private final ExperienceService service;

    ExperienceController(ExperienceService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/experience", "/api/v1/admin/experience"})
    List<ExperienceDtos.Response> list() {
        return service.list();
    }

    @PostMapping("/api/v1/admin/experience")
    ResponseEntity<ExperienceDtos.Response> create(@Valid @RequestBody ExperienceDtos.Request request) {
        return ResponseEntity.status(201).body(service.create(request));
    }

    @PutMapping("/api/v1/admin/experience/{id}")
    ExperienceDtos.Response update(@PathVariable Long id, @Valid @RequestBody ExperienceDtos.Request request) {
        return service.update(id, request);
    }

    @DeleteMapping("/api/v1/admin/experience/{id}")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
