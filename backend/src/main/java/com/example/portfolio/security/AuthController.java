package com.example.portfolio.security;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Login and logout are handled by the security filter chain; this lets the SPA ask "who am I?". */
@RestController
@RequestMapping("/api/v1/admin/auth")
class AuthController {

    record MeResponse(String email, List<String> roles) {}

    @GetMapping("/me")
    MeResponse me(Authentication authentication) {
        return new MeResponse(authentication.getName(),
                authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList());
    }
}
