package com.example.portfolio.profile;

import com.example.portfolio.common.HttpUrl;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ProfileDtos {

    private ProfileDtos() {}

    public record Request(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Size(max = 200) String headline,
            @Size(max = 500) String intro,
            @Size(max = 10_000) String background,
            @Size(max = 10_000) String careerGoals,
            @Size(max = 10_000) String professionalSummary,
            @Email @Size(max = 254) String publicEmail,
            @HttpUrl String githubUrl,
            @HttpUrl String linkedinUrl,
            @Size(max = 70) String seoTitle,
            @Size(max = 200) String seoDescription) {}

    public record Response(String fullName, String headline, String intro, String background,
                           String careerGoals, String professionalSummary, String publicEmail,
                           String githubUrl, String linkedinUrl, String avatarUrl, String avatarAlt,
                           String cvUrl, String seoTitle, String seoDescription) {}
}
