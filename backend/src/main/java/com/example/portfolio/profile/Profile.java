package com.example.portfolio.profile;

import com.example.portfolio.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Single-row table; the id is always 1 (enforced by a CHECK constraint). */
@Entity
@Table(name = "profile")
public class Profile extends AuditableEntity {

    static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 200)
    private String headline;

    @Column(nullable = false, length = 500)
    private String intro = "";

    @Column(nullable = false)
    private String background = "";

    @Column(name = "career_goals", nullable = false)
    private String careerGoals = "";

    @Column(name = "professional_summary", nullable = false)
    private String professionalSummary = "";

    @Column(name = "public_email", length = 254)
    private String publicEmail;

    @Column(name = "github_url", length = 2048)
    private String githubUrl;

    @Column(name = "linkedin_url", length = 2048)
    private String linkedinUrl;

    @Column(name = "avatar_key", length = 80)
    private String avatarKey;

    @Column(name = "avatar_alt", length = 200)
    private String avatarAlt;

    @Column(name = "cv_key", length = 80)
    private String cvKey;

    @Column(name = "seo_title", length = 70)
    private String seoTitle;

    @Column(name = "seo_description", length = 200)
    private String seoDescription;

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }
    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }
    public String getBackground() { return background; }
    public void setBackground(String background) { this.background = background; }
    public String getCareerGoals() { return careerGoals; }
    public void setCareerGoals(String careerGoals) { this.careerGoals = careerGoals; }
    public String getProfessionalSummary() { return professionalSummary; }
    public void setProfessionalSummary(String professionalSummary) { this.professionalSummary = professionalSummary; }
    public String getPublicEmail() { return publicEmail; }
    public void setPublicEmail(String publicEmail) { this.publicEmail = publicEmail; }
    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }
    public String getAvatarKey() { return avatarKey; }
    public void setAvatarKey(String avatarKey) { this.avatarKey = avatarKey; }
    public String getAvatarAlt() { return avatarAlt; }
    public void setAvatarAlt(String avatarAlt) { this.avatarAlt = avatarAlt; }
    public String getCvKey() { return cvKey; }
    public void setCvKey(String cvKey) { this.cvKey = cvKey; }
    public String getSeoTitle() { return seoTitle; }
    public void setSeoTitle(String seoTitle) { this.seoTitle = seoTitle; }
    public String getSeoDescription() { return seoDescription; }
    public void setSeoDescription(String seoDescription) { this.seoDescription = seoDescription; }
}
