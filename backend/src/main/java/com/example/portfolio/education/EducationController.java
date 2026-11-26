package com.example.portfolio.education;

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
class EducationController {

    private final EducationService service;

    EducationController(EducationService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/education", "/api/v1/admin/education"})
    List<EducationDtos.Response> listEducation() {
        return service.listEducation();
    }

    @PostMapping("/api/v1/admin/education")
    ResponseEntity<EducationDtos.Response> createEducation(@Valid @RequestBody EducationDtos.Request request) {
        return ResponseEntity.status(201).body(service.createEducation(request));
    }

    @PutMapping("/api/v1/admin/education/{id}")
    EducationDtos.Response updateEducation(@PathVariable Long id, @Valid @RequestBody EducationDtos.Request request) {
        return service.updateEducation(id, request);
    }

    @DeleteMapping("/api/v1/admin/education/{id}")
    ResponseEntity<Void> deleteEducation(@PathVariable Long id) {
        service.deleteEducation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping({"/api/v1/certifications", "/api/v1/admin/certifications"})
    List<EducationDtos.CertificationResponse> listCertifications() {
        return service.listCertifications();
    }

    @PostMapping("/api/v1/admin/certifications")
    ResponseEntity<EducationDtos.CertificationResponse> createCertification(
            @Valid @RequestBody EducationDtos.CertificationRequest request) {
        return ResponseEntity.status(201).body(service.createCertification(request));
    }

    @PutMapping("/api/v1/admin/certifications/{id}")
    EducationDtos.CertificationResponse updateCertification(@PathVariable Long id,
            @Valid @RequestBody EducationDtos.CertificationRequest request) {
        return service.updateCertification(id, request);
    }

    @DeleteMapping("/api/v1/admin/certifications/{id}")
    ResponseEntity<Void> deleteCertification(@PathVariable Long id) {
        service.deleteCertification(id);
        return ResponseEntity.noContent().build();
    }
}
