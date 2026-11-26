package com.example.portfolio.linkcheck;

import java.time.Instant;

import com.example.portfolio.project.LinkStatus;

/** httpStatus and note are returned to the admin but not stored (the spec stores status + time only). */
public record LinkCheckResult(Long projectId, String projectName, LinkStatus status,
                              Instant checkedAt, Integer httpStatus, String note) {}
