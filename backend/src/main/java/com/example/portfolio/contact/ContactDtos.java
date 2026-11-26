package com.example.portfolio.contact;

import java.time.Instant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ContactDtos {

    private ContactDtos() {}

    /** "website" is the honeypot: the real form never shows it, so only bots fill it in. */
    public record Request(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 150) String subject,
            @NotBlank @Size(min = 10, max = 5_000) String message,
            @Size(max = 200) String website) {}

    public record Response(Long id, String name, String email, String subject, String message,
                           boolean read, Instant createdAt) {}

    public record ReadRequest(@NotNull Boolean read) {}

    public record UnreadCount(long count) {}
}
