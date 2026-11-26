package com.example.portfolio.linkcheck;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.project.LinkStatus;
import com.example.portfolio.project.Project;
import com.example.portfolio.project.ProjectRepository;

/**
 * Deliberately NOT @Transactional: a database transaction (and its connection) must never stay open
 * while we wait on a slow remote server. Each repository call is its own short transaction.
 */
@Service
public class LinkCheckService {

    private final ProjectRepository projects;
    private final LinkProber prober;
    private final Clock clock;

    public LinkCheckService(ProjectRepository projects, LinkProber prober, Clock clock) {
        this.projects = projects;
        this.prober = prober;
        this.clock = clock;
    }

    public LinkCheckResult check(Long projectId) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        return check(project);
    }

    /** Sequential on purpose: a handful of projects, and it keeps outbound traffic polite and simple. */
    public List<LinkCheckResult> checkAll() {
        return projects.findByLiveUrlIsNotNullOrderByDisplayOrderAscIdAsc().stream().map(this::check).toList();
    }

    private LinkCheckResult check(Project project) {
        if (!StringUtils.hasText(project.getLiveUrl())) {
            return new LinkCheckResult(project.getId(), project.getName(), LinkStatus.UNKNOWN, null, null,
                    "This project has no live URL.");
        }
        LinkStatus status;
        Integer httpStatus = null;
        String note;
        try {
            LinkProber.ProbeResult result = prober.probe(new URI(project.getLiveUrl()));
            httpStatus = result.status();
            status = result.status() >= 200 && result.status() < 300 ? LinkStatus.OK : LinkStatus.BROKEN;
            note = "HTTP " + result.status();
        } catch (BlockedTargetException e) {
            status = LinkStatus.BLOCKED;
            note = e.getMessage();
        } catch (IOException | URISyntaxException | RuntimeException e) {
            status = LinkStatus.BROKEN;
            note = "Unreachable (" + e.getClass().getSimpleName() + ")"; // no internal details in the response
        }
        Instant checkedAt = clock.instant();
        projects.updateLinkStatus(project.getId(), status, checkedAt);
        return new LinkCheckResult(project.getId(), project.getName(), status, checkedAt, httpStatus, note);
    }
}
