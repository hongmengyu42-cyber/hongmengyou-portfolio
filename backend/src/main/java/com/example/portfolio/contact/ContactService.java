package com.example.portfolio.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.portfolio.common.PageResponse;
import com.example.portfolio.common.ResourceNotFoundException;
import com.example.portfolio.common.TooManyRequestsException;
import com.example.portfolio.security.FixedWindowRateLimiter;

@Service
@Transactional
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final ContactMessageRepository messages;
    private final FixedWindowRateLimiter rateLimiter;
    private final IpHasher ipHasher;

    public ContactService(ContactMessageRepository messages,
                          @Qualifier("contactRateLimiter") FixedWindowRateLimiter rateLimiter,
                          IpHasher ipHasher) {
        this.messages = messages;
        this.rateLimiter = rateLimiter;
        this.ipHasher = ipHasher;
    }

    public void submit(ContactDtos.Request request, String clientIp) {
        String ipHash = ipHasher.hash(clientIp);
        // Rate limit first, so honeypot hits count against the limit too.
        if (!rateLimiter.tryAcquire(ipHash)) {
            throw new TooManyRequestsException("Too many messages. Please try again later.");
        }
        if (StringUtils.hasText(request.website())) {
            // Bot detected. Pretend success so it does not learn it was caught; store nothing.
            log.debug("Honeypot triggered; message discarded");
            return;
        }
        messages.save(new ContactMessage(request.name().strip(), request.email().strip(),
                request.subject().strip(), request.message().strip(), ipHash));
    }

    @Transactional(readOnly = true)
    public PageResponse<ContactDtos.Response> list(boolean unreadOnly, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        Page<ContactMessage> result = unreadOnly ? messages.findByReadFalse(pageable) : messages.findAll(pageable);
        return PageResponse.of(result, ContactService::toResponse);
    }

    @Transactional(readOnly = true)
    public ContactDtos.Response get(Long id) {
        return toResponse(load(id));
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return messages.countByReadFalse();
    }

    public ContactDtos.Response setRead(Long id, boolean read) {
        ContactMessage message = load(id);
        message.setRead(read);
        return toResponse(message);
    }

    public void delete(Long id) {
        messages.delete(load(id));
    }

    private ContactMessage load(Long id) {
        return messages.findById(id).orElseThrow(() -> new ResourceNotFoundException("Message", id));
    }

    private static ContactDtos.Response toResponse(ContactMessage m) {
        return new ContactDtos.Response(m.getId(), m.getName(), m.getEmail(), m.getSubject(), m.getMessage(),
                m.isRead(), m.getCreatedAt());
    }
}
