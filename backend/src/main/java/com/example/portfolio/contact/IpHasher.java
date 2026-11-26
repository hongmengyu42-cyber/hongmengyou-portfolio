package com.example.portfolio.contact;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

import com.example.portfolio.config.AppProperties;

/**
 * Keyed hash (HMAC-SHA256) of the client IP. It still lets us rate-limit and spot repeat abusers,
 * but a leaked database does not reveal visitor IPs, and without the secret the hash cannot be brute-forced.
 */
@Component
public class IpHasher {

    private final byte[] secret;

    public IpHasher(AppProperties props) {
        this.secret = props.security().ipHashSecret().getBytes(StandardCharsets.UTF_8);
    }

    public String hash(String ip) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(ip.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 is not available", e);
        }
    }
}
