package com.example.portfolio.project;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.portfolio.common.PageResponse;
import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.security.FixedWindowRateLimiter;
import com.example.portfolio.security.SecurityConfig;

/** Web slice: real security rules and error handling, mocked services, no database. */
@WebMvcTest(ProjectController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class ProjectControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean ProjectQueryService service;
    @MockitoBean UserDetailsService userDetailsService;
    @MockitoBean(name = "loginRateLimiter") FixedWindowRateLimiter loginRateLimiter;

    @Test
    void listIsPublicAndPaged() throws Exception {
        when(service.list(null, 0, 12)).thenReturn(new PageResponse<>(List.of(), 0, 12, 0L, 0));

        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(12))
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void pageSizeAboveTheCapIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/projects").param("size", "500"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownSlugReturnsProblemDetail404() throws Exception {
        when(service.getBySlug("nope")).thenThrow(new ResourceNotFoundException("Project", "nope"));

        mockMvc.perform(get("/api/v1/projects/nope"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Resource not found"));
    }

    @Test
    void adminAreaIsClosedToAnonymousUsers() throws Exception {
        mockMvc.perform(get("/api/v1/admin/projects")).andExpect(status().isUnauthorized());
    }
}
