package com.example.portfolio.project;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    // Lists are paged WITHOUT fetch joins (a collection fetch join + paging forces in-memory paging).
    // Technologies and images load afterwards in batches (default_batch_fetch_size), so no N+1.
    Page<Project> findByPublishedTrue(Pageable pageable);

    Page<Project> findByPublishedTrueAndCategory(ProjectCategory category, Pageable pageable);

    // Single-row lookups can safely fetch the associations in one query.
    @EntityGraph(attributePaths = {"technologies", "images"})
    Optional<Project> findBySlugAndPublishedTrue(String slug);

    @EntityGraph(attributePaths = {"technologies", "images"})
    Optional<Project> findWithAssociationsById(Long id);

    List<Project> findByPublishedTrueOrderByDisplayOrderAscIdAsc();

    List<Project> findByLiveUrlIsNotNullOrderByDisplayOrderAscIdAsc();

    @Query("select p.id from Project p")
    List<Long> findAllIds();

    @Query("select max(p.displayOrder) from Project p")
    Integer findMaxDisplayOrder();

    /** Bulk update so a link check never rewrites the whole entity (or touches updated_at). */
    @Modifying
    @Transactional
    @Query("update Project p set p.linkStatus = :status, p.linkCheckedAt = :checkedAt where p.id = :id")
    int updateLinkStatus(@Param("id") Long id, @Param("status") LinkStatus status,
                         @Param("checkedAt") Instant checkedAt);
}
