package com.example.portfolio.seo;

import java.time.LocalDate;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import com.example.portfolio.config.AppProperties;
import com.example.portfolio.project.ProjectRepository;

@Service
@Transactional(readOnly = true)
public class SitemapService {

    private final ProjectRepository projects;
    private final String baseUrl;

    public SitemapService(ProjectRepository projects, AppProperties props) {
        this.projects = projects;
        this.baseUrl = props.site().baseUrl().replaceAll("/+$", "");
    }

    public String sitemapXml() {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n")
                .append("  <url><loc>").append(HtmlUtils.htmlEscape(baseUrl + "/")).append("</loc></url>\n");
        projects.findByPublishedTrueOrderByDisplayOrderAscIdAsc().forEach(project -> xml
                .append("  <url><loc>").append(HtmlUtils.htmlEscape(baseUrl + "/projects/" + project.getSlug()))
                .append("</loc><lastmod>")
                .append(LocalDate.ofInstant(project.getUpdatedAt(), ZoneOffset.UTC))
                .append("</lastmod></url>\n"));
        return xml.append("</urlset>\n").toString();
    }

    public String robotsTxt() {
        return "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: " + baseUrl + "/sitemap.xml\n";
    }
}
