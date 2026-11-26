package com.example.portfolio.linkcheck;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.InetAddress;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Only IP literals are used, so these tests never touch DNS or the network. */
class SafeUrlValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "127.0.0.1", "127.1.2.3", "10.0.0.5", "172.16.0.1", "172.31.255.255", "192.168.1.10",
            "169.254.169.254",   // cloud metadata service
            "100.64.0.1",        // carrier-grade NAT
            "0.0.0.0", "224.0.0.1", "255.255.255.255", "198.18.0.1", "192.0.2.10",
            "::1", "fe80::1", "fc00::1", "fd12:3456::1", "2001:db8::1", "64:ff9b::7f00:1", "::7f00:1"})
    void blocksNonPublicAddresses(String literal) throws Exception {
        assertThat(SafeUrlValidator.isPublicAddress(InetAddress.getByName(literal))).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111"})
    void allowsPublicAddresses(String literal) throws Exception {
        assertThat(SafeUrlValidator.isPublicAddress(InetAddress.getByName(literal))).isTrue();
    }

    @org.junit.jupiter.api.Test
    void ipv4MappedLoopbackIsStillBlocked() throws Exception {
        assertThat(SafeUrlValidator.isPublicAddress(InetAddress.getByName("::ffff:127.0.0.1"))).isFalse();
    }
}
