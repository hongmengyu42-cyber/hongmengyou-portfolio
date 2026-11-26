package com.example.portfolio.project;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.portfolio.common.ConflictException;
import com.example.portfolio.storage.FileStorageService;

@ExtendWith(MockitoExtension.class)
class ProjectAdminServiceTest {

    @Mock ProjectRepository projects;
    @Mock TechnologyRepository technologies;
    @Mock FileStorageService storage;
    @InjectMocks ProjectAdminService service;

    private static ProjectDtos.Request request(String slug, List<String> tech) {
        return new ProjectDtos.Request("My Cool API", slug, "Summary", "Description", null, null, List.of("Fast"),
                ProjectCategory.API, ProjectStatus.LIVE, "https://example.com", null, true, true, tech);
    }

    @Test
    void createGeneratesUniqueSlugAppendsDisplayOrderAndDeduplicatesTechnologies() {
        when(projects.existsBySlug("my-cool-api")).thenReturn(true);
        when(projects.existsBySlug("my-cool-api-2")).thenReturn(false);
        when(projects.findMaxDisplayOrder()).thenReturn(4);
        when(technologies.findByNameIgnoreCase(any())).thenReturn(java.util.Optional.empty());
        when(technologies.save(any(Technology.class))).thenAnswer(call -> call.getArgument(0));
        when(projects.save(any(Project.class))).thenAnswer(call -> call.getArgument(0));

        ProjectDtos.AdminDetail created = service.create(request(null, List.of("java", "Java", "Spring Boot")));

        assertThat(created.slug()).isEqualTo("my-cool-api-2");
        assertThat(created.displayOrder()).isEqualTo(5);
        assertThat(created.technologies()).hasSize(2);   // "java" and "Java" collapse into one
        assertThat(created.keyFeatures()).containsExactly("Fast");
    }

    @Test
    void createRejectsExplicitSlugThatIsTaken() {
        when(projects.existsBySlug("taken")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request("taken", List.of())))
                .isInstanceOf(ConflictException.class);
        verify(projects, never()).save(any());
    }

    @Test
    void reorderRequiresTheCompleteIdList() {
        when(projects.findAllIds()).thenReturn(List.of(1L, 2L, 3L));

        assertThatThrownBy(() -> service.reorder(List.of(1L, 2L))).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> service.reorder(List.of(1L, 1L, 2L))).isInstanceOf(ConflictException.class);
    }
}
