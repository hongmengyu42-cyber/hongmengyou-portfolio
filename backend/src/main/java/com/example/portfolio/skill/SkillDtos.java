package com.example.portfolio.skill;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class SkillDtos {

    private SkillDtos() {}

    public record Request(@NotBlank @Size(max = 60) String name, @NotNull SkillCategory category,
                          @Min(1) @Max(5) Integer level, @Min(0) int displayOrder) {}

    public record Response(Long id, String name, SkillCategory category, Integer level, int displayOrder) {}
}
