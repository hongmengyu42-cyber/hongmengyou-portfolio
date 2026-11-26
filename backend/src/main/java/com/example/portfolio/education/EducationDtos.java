package com.example.portfolio.education;

import java.time.LocalDate;

import com.example.portfolio.common.HttpUrl;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class EducationDtos {

    private EducationDtos() {}

    public record Request(@NotBlank @Size(max = 150) String institution, @NotBlank @Size(max = 150) String degree,
                          @Size(max = 150) String fieldOfStudy, @NotNull LocalDate startDate, LocalDate endDate,
                          @Size(max = 5_000) String description) {

        @AssertTrue(message = "endDate must not be before startDate")
        public boolean isDateRangeValid() {
            return endDate == null || startDate == null || !endDate.isBefore(startDate);
        }
    }

    public record Response(Long id, String institution, String degree, String fieldOfStudy,
                           LocalDate startDate, LocalDate endDate, String description) {}

    public record CertificationRequest(@NotBlank @Size(max = 150) String name, @NotBlank @Size(max = 120) String issuer,
                                       @NotNull LocalDate issuedOn, @HttpUrl String credentialUrl) {}

    public record CertificationResponse(Long id, String name, String issuer, LocalDate issuedOn,
                                        String credentialUrl) {}
}
