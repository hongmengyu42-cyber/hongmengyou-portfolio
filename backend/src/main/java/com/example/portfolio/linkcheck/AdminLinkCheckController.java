package com.example.portfolio.linkcheck;

import java.util.List;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/projects")
class AdminLinkCheckController {

    private final LinkCheckService service;

    AdminLinkCheckController(LinkCheckService service) {
        this.service = service;
    }

    @PostMapping("/link-check")
    List<LinkCheckResult> checkAll() {
        return service.checkAll();
    }

    @PostMapping("/{id}/link-check")
    LinkCheckResult checkOne(@PathVariable Long id) {
        return service.check(id);
    }
}
