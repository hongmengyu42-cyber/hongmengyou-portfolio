package com.example.portfolio.security;

import java.time.Clock;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.portfolio.admin.AdminUser;
import com.example.portfolio.admin.AdminUserRepository;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminUserRepository users;
    private final Clock clock;

    public AdminUserDetailsService(AdminUserRepository users, Clock clock) {
        this.users = users;
        this.clock = clock;
    }

    /**
     * A missing user throws UsernameNotFoundException; DaoAuthenticationProvider converts it to
     * BadCredentialsException and still performs a dummy password check, so response time does not
     * reveal which emails exist.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        AdminUser user = users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new UsernameNotFoundException("Unknown user"));
        boolean locked = user.getLockedUntil() != null && user.getLockedUntil().isAfter(clock.instant());
        return User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole())
                .accountLocked(locked)
                .build();
    }
}
