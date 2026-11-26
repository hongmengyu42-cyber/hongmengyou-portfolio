package com.example.portfolio.linkcheck;

import java.net.InetAddress;
import java.net.UnknownHostException;

import org.springframework.stereotype.Component;

/**
 * SSRF defense, step 1: resolve the hostname ourselves and refuse non-public addresses.
 * The caller must then connect to the RETURNED address, not re-resolve the name, otherwise an attacker's
 * DNS server could answer "public IP" for our check and "127.0.0.1" for the real connection (DNS rebinding).
 */
@Component
public class SafeUrlValidator {

    public InetAddress resolvePublicAddress(String host) throws UnknownHostException {
        InetAddress[] addresses = InetAddress.getAllByName(host);
        for (InetAddress address : addresses) {
            if (!isPublicAddress(address)) {
                // All addresses must be public: a mixed answer is a classic rebinding trick.
                throw new BlockedTargetException("The host resolves to a non-public address.");
            }
        }
        return addresses[0];
    }

    public static boolean isPublicAddress(InetAddress address) {
        if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
                || address.isSiteLocalAddress() || address.isMulticastAddress()) {
            return false;
        }
        byte[] b = address.getAddress();
        return b.length == 4 ? isPublicIpv4(b) : isPublicIpv6(b);
    }

    private static boolean isPublicIpv4(byte[] b) {
        int b0 = b[0] & 0xFF;
        int b1 = b[1] & 0xFF;
        int b2 = b[2] & 0xFF;
        if (b0 == 0) return false;                                  // 0.0.0.0/8 "this network"
        if (b0 == 100 && (b1 & 0xC0) == 64) return false;           // 100.64.0.0/10 carrier-grade NAT
        if (b0 == 192 && b1 == 0 && b2 == 0) return false;          // 192.0.0.0/24 IETF protocol assignments
        if (b0 == 192 && b1 == 0 && b2 == 2) return false;          // 192.0.2.0/24 documentation
        if (b0 == 198 && (b1 & 0xFE) == 18) return false;           // 198.18.0.0/15 benchmarking
        if (b0 == 198 && b1 == 51 && b2 == 100) return false;       // 198.51.100.0/24 documentation
        if (b0 == 203 && b1 == 0 && b2 == 113) return false;        // 203.0.113.0/24 documentation
        return b0 < 240;                                            // 240.0.0.0/4 reserved + broadcast
    }

    private static boolean isPublicIpv6(byte[] b) {
        if ((b[0] & 0xFE) == 0xFC) return false;                                        // fc00::/7 unique local
        if (b[0] == 0x20 && b[1] == 0x01 && b[2] == 0x0D && (b[3] & 0xFF) == 0xB8) return false; // 2001:db8::/32 docs
        if (b[0] == 0x20 && b[1] == 0x01 && b[2] == 0 && b[3] == 0) return false;       // 2001::/32 Teredo
        if (b[0] == 0x20 && b[1] == 0x02) return false;                                 // 2002::/16 6to4 (embeds IPv4)
        if (b[0] == 0x00 && b[1] == 0x64 && (b[2] & 0xFF) == 0xFF && (b[3] & 0xFF) == 0x9B) return false; // NAT64
        for (int i = 0; i < 12; i++) {                                                  // ::a.b.c.d IPv4-compatible
            if (b[i] != 0) return true;
        }
        return false;
    }
}
