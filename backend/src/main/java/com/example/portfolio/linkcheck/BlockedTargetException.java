package com.example.portfolio.linkcheck;

/** The URL points somewhere the SSRF policy forbids (private network, loopback, bad scheme...). */
public class BlockedTargetException extends RuntimeException {

    public BlockedTargetException(String message) {
        super(message);
    }
}
