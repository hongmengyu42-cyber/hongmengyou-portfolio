package com.example.portfolio.skill;

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

/** Public read plus admin writes. Access is enforced by URL in SecurityConfig (/admin/** needs ROLE_ADMIN). */
@RestController
class SkillController {

    private final SkillService service;

    SkillController(SkillService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/skills", "/api/v1/admin/skills"})
    List<SkillDtos.Response> list() {
        return service.list();
    }

    @PostMapping("/api/v1/admin/skills")
    ResponseEntity<SkillDtos.Response> create(@Valid @RequestBody SkillDtos.Request request) {
        return ResponseEntity.status(201).body(service.create(request));
    }

    @PutMapping("/api/v1/admin/skills/{id}")
    SkillDtos.Response update(@PathVariable Long id, @Valid @RequestBody SkillDtos.Request request) {
        return service.update(id, request);
    }

    @DeleteMapping("/api/v1/admin/skills/{id}")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
