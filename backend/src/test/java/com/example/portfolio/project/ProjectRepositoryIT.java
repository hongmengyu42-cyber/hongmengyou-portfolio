package com.example.portfolio.project;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.example.portfolio.support.PostgresTestBase;

/**
 * Loading this context proves the migrations apply to a real PostgreSQL AND that every JPA entity
 * matches the schema (ddl-auto=validate). The seed data comes from the dev seed migration.
 */
@SpringBootTest
@ActiveProfiles("test")
class ProjectRepositoryIT extends PostgresTestBase {

    @Autowired ProjectRepository projects;

    @Test
    void seedProjectsAreListedAndPaged() {
        var page = projects.findByPublishedTrue(PageRequest.of(0, 2));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent()).hasSize(2);
    }

    @Test
    void detailLookupFetchesTechnologiesInOneGo() {
        Project project = projects.findBySlugAndPublishedTrue("todo-replace-project-one").orElseThrow();

        assertThat(project.getTechnologies()).extracting(Technology::getName)
                .contains("Java", "Spring Boot", "PostgreSQL", "React", "Docker");
        assertThat(project.getLiveUrl()).startsWith("https://example.com/TODO_REPLACE");
    }

    @Test
    void categoryFilterWorks() {
        var page = projects.findByPublishedTrueAndCategory(ProjectCategory.API, PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Project::getSlug).containsExactly("todo-replace-project-two");
    }
}
