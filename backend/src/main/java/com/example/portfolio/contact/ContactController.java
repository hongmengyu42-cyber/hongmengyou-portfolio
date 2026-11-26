package com.example.portfolio.contact;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.portfolio.common.PageResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
class ContactController {

    private final ContactService service;

    ContactController(ContactService service) {
        this.service = service;
    }

    /** getRemoteAddr() is correct here: Tomcat already resolved X-Forwarded-For from trusted proxies only. */
    @PostMapping("/api/v1/contact")
    @ResponseStatus(HttpStatus.CREATED)
    void submit(@Valid @RequestBody ContactDtos.Request request, HttpServletRequest http) {
        service.submit(request, http.getRemoteAddr());
    }

    @GetMapping("/api/v1/admin/contact-messages")
    PageResponse<ContactDtos.Response> list(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(unreadOnly, page, size);
    }

    @GetMapping("/api/v1/admin/contact-messages/unread-count")
    ContactDtos.UnreadCount unreadCount() {
        return new ContactDtos.UnreadCount(service.unreadCount());
    }

    @GetMapping("/api/v1/admin/contact-messages/{id}")
    ContactDtos.Response get(@PathVariable Long id) {
        return service.get(id);
    }

    @PatchMapping("/api/v1/admin/contact-messages/{id}")
    ContactDtos.Response setRead(@PathVariable Long id, @Valid @RequestBody ContactDtos.ReadRequest request) {
        return service.setRead(id, request.read());
    }

    @DeleteMapping("/api/v1/admin/contact-messages/{id}")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
