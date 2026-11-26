package com.example.portfolio.seo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
class SeoController {

    private final SeoHeadService head;
    private final SitemapService sitemap;

    SeoController(SeoHeadService head, SitemapService sitemap) {
        this.head = head;
        this.sitemap = sitemap;
    }

    /** An HTML fragment for the proxy to inject into index.html's head. */
    @GetMapping(value = "/api/v1/seo/head", produces = "text/html;charset=UTF-8")
    String head(@RequestParam(defaultValue = "/") String path) {
        return head.headFor(path);
    }

    @GetMapping(value = "/sitemap.xml", produces = "application/xml;charset=UTF-8")
    String sitemap() {
        return sitemap.sitemapXml();
    }

    @GetMapping(value = "/robots.txt", produces = "text/plain;charset=UTF-8")
    String robots() {
        return sitemap.robotsTxt();
    }
}
