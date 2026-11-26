package com.example.portfolio.contact;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.portfolio.common.TooManyRequestsException;
import com.example.portfolio.security.FixedWindowRateLimiter;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock ContactMessageRepository messages;
    @Mock FixedWindowRateLimiter rateLimiter;
    @Mock IpHasher ipHasher;
    @InjectMocks ContactService service;

    private static ContactDtos.Request request(String honeypot) {
        return new ContactDtos.Request("  Ada  ", "ada@example.com", "Hello", "A message long enough.", honeypot);
    }

    @Test
    void storesTheMessageWithAHashedIpNeverTheRawIp() {
        when(ipHasher.hash("203.0.113.9")).thenReturn("hashed");
        when(rateLimiter.tryAcquire("hashed")).thenReturn(true);

        service.submit(request(null), "203.0.113.9");

        ArgumentCaptor<ContactMessage> saved = ArgumentCaptor.forClass(ContactMessage.class);
        verify(messages).save(saved.capture());
        assertThat(saved.getValue().getName()).isEqualTo("Ada");   // trimmed
        assertThat(saved.getValue().isRead()).isFalse();
    }

    @Test
    void honeypotSubmissionsAreSilentlyDiscarded() {
        when(ipHasher.hash("198.51.100.7")).thenReturn("bot");
        when(rateLimiter.tryAcquire("bot")).thenReturn(true);

        service.submit(request("http://spam.example"), "198.51.100.7"); // no exception: the bot sees success

        verify(messages, never()).save(any());
    }

    @Test
    void overTheLimitIsRejectedWithoutStoring() {
        when(ipHasher.hash("192.0.2.1")).thenReturn("busy");
        when(rateLimiter.tryAcquire("busy")).thenReturn(false);

        assertThatThrownBy(() -> service.submit(request(null), "192.0.2.1"))
                .isInstanceOf(TooManyRequestsException.class);
        verify(messages, never()).save(any());
    }
}
