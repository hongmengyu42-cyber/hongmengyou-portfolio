package com.example.portfolio.experience;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ExperienceDtos {

    private ExperienceDtos() {}

    public record Request(@NotBlank @Size(max = 120) String company, @NotBlank @Size(max = 120) String role,
                          @Size(max = 120) String location, @NotNull ExperienceType type,
                          @NotNull LocalDate startDate, LocalDate endDate,
                          @Size(max = 5_000) String description) {

        @AssertTrue(message = "endDate must not be before startDate")
        public boolean isDateRangeValid() {
            return endDate == null || startDate == null || !endDate.isBefore(startDate);
        }
    }

    public record Response(Long id, String company, String role, String location, ExperienceType type,
                           LocalDate startDate, LocalDate endDate, boolean current, String description) {}
}
