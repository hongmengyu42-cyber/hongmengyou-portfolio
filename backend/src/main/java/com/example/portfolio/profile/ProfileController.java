package com.example.portfolio.profile;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

@RestController
class ProfileController {

    private final ProfileService service;

    ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/profile", "/api/v1/admin/profile"})
    ProfileDtos.Response get() {
        return service.get();
    }

    @PutMapping("/api/v1/admin/profile")
    ProfileDtos.Response update(@Valid @RequestBody ProfileDtos.Request request) {
        return service.update(request);
    }

    @PutMapping(path = "/api/v1/admin/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ProfileDtos.Response replaceAvatar(@RequestParam("file") MultipartFile file,
                                       @RequestParam("altText") String altText) {
        return service.replaceAvatar(file, altText);
    }

    @PutMapping(path = "/api/v1/admin/profile/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ProfileDtos.Response replaceCv(@RequestParam("file") MultipartFile file) {
        return service.replaceCv(file);
    }
}
