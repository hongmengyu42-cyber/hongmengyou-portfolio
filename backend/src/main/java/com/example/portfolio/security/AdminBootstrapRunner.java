package com.example.portfolio.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.example.portfolio.admin.AdminUser;
import com.example.portfolio.admin.AdminUserRepository;
import com.example.portfolio.config.AppProperties;

/**
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD, only when no admin exists yet.
 * There is no default account. After the first start you can remove ADMIN_PASSWORD from the environment.
 */
@Component
class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);
    private static final int MIN_PASSWORD_LENGTH = 12;

    private final AdminUserRepository users;
    private final PasswordEncoder encoder;
    private final AppProperties.Admin admin;

    AdminBootstrapRunner(AdminUserRepository users, PasswordEncoder encoder, AppProperties props) {
        this.users = users;
        this.encoder = encoder;
        this.admin = props.admin();
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }
        if (!StringUtils.hasText(admin.email()) || !StringUtils.hasText(admin.password())) {
            log.warn("No admin user exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set: "
                    + "the dashboard cannot be used until you set them and restart.");
            return;
        }
        if (admin.password().length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException("ADMIN_PASSWORD must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        String email = admin.email().trim().toLowerCase();
        users.save(new AdminUser(email, encoder.encode(admin.password()), "ADMIN"));
        log.info("Created initial admin user {}", email); // the password is never logged
    }
}
