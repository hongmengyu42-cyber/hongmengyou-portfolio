package com.example.portfolio.project;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin/projects/{projectId}/images")
class AdminProjectImageController {

    private final ProjectImageService service;

    AdminProjectImageController(ProjectImageService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<ProjectDtos.ImageResponse> upload(@PathVariable Long projectId,
            @RequestParam("file") MultipartFile file, @RequestParam("altText") String altText) {
        return ResponseEntity.status(201).body(service.add(projectId, file, altText));
    }

    @PatchMapping("/{imageId}")
    ProjectDtos.ImageResponse updateAltText(@PathVariable Long projectId, @PathVariable Long imageId,
            @Valid @RequestBody ProjectDtos.AltTextRequest request) {
        return service.updateAltText(projectId, imageId, request.altText());
    }

    @PutMapping("/{imageId}/thumbnail")
    ResponseEntity<Void> setThumbnail(@PathVariable Long projectId, @PathVariable Long imageId) {
        service.setThumbnail(projectId, imageId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/order")
    ResponseEntity<Void> reorder(@PathVariable Long projectId, @Valid @RequestBody ProjectDtos.OrderRequest request) {
        service.reorder(projectId, request.ids());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{imageId}")
    ResponseEntity<Void> delete(@PathVariable Long projectId, @PathVariable Long imageId) {
        service.delete(projectId, imageId);
        return ResponseEntity.noContent().build();
    }
}
