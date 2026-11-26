package com.example.portfolio.project;

import com.example.portfolio.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_image")
public class ProjectImage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "file_key", nullable = false, length = 80)
    private String fileKey;

    @Column(name = "alt_text", nullable = false, length = 200)
    private String altText;

    @Column(name = "is_thumbnail", nullable = false)
    private boolean thumbnail;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private int width;

    @Column(nullable = false)
    private int height;

    protected ProjectImage() {
        // required by JPA
    }

    public ProjectImage(Project project, String fileKey, String altText, int width, int height) {
        this.project = project;
        this.fileKey = fileKey;
        this.altText = altText;
        this.width = width;
        this.height = height;
    }

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public String getFileKey() { return fileKey; }
    public String getAltText() { return altText; }
    public void setAltText(String altText) { this.altText = altText; }
    public boolean isThumbnail() { return thumbnail; }
    public void setThumbnail(boolean thumbnail) { this.thumbnail = thumbnail; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
}
