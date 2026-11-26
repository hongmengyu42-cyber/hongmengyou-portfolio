package com.example.portfolio.linkcheck;

import java.io.BufferedInputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

import org.springframework.stereotype.Component;

import com.example.portfolio.config.AppProperties;

/**
 * Sends HEAD/GET requests over a socket pinned to the IP that SafeUrlValidator approved.
 * The JDK HttpClient cannot do this (it re-resolves DNS internally), so we speak a minimal HTTP/1.1.
 * TLS still verifies the certificate against the original hostname and sends it as SNI.
 * Redirects are followed manually so EVERY hop is re-validated, with a hop limit and an overall deadline.
 */
@Component
public class LinkProber {

    private static final int MAX_LINE = 8192;
    private static final int MAX_HEADERS = 100;
    private static final String USER_AGENT = "PortfolioLinkChecker/1.0";

    public record ProbeResult(int status, URI finalUri) {}

    private record Response(int status, String location) {}

    private final SafeUrlValidator validator;
    private final AppProperties.LinkCheck settings;

    public LinkProber(SafeUrlValidator validator, AppProperties props) {
        this.validator = validator;
        this.settings = props.linkcheck();
    }

    public ProbeResult probe(URI start) throws IOException {
        URI current = start;
        for (int hop = 0; hop <= settings.maxRedirects(); hop++) {
            Response response = request(current, "HEAD");
            if (response.status() >= 400) {
                response = request(current, "GET"); // some servers mishandle HEAD; the body is never read
            }
            if (isRedirect(response.status()) && response.location() != null) {
                try {
                    current = current.resolve(response.location());
                } catch (IllegalArgumentException e) {
                    throw new IOException("Invalid redirect target");
                }
                continue;
            }
            return new ProbeResult(response.status(), current);
        }
        throw new IOException("Too many redirects");
    }

    private Response request(URI uri, String method) throws IOException {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) {
            throw new BlockedTargetException("Only http and https are allowed.");
        }
        String host = uri.getHost();
        if (host == null) {
            throw new BlockedTargetException("The URL has no host.");
        }
        boolean tls = scheme.equals("https");
        int port = uri.getPort() != -1 ? uri.getPort() : (tls ? 443 : 80);
        InetAddress address = validator.resolvePublicAddress(host);
        long deadline = System.nanoTime()
                + TimeUnit.MILLISECONDS.toNanos(settings.connectTimeoutMs() + 2L * settings.readTimeoutMs());

        Socket socket = new Socket();
        try {
            socket.connect(new InetSocketAddress(address, port), settings.connectTimeoutMs());
            socket.setSoTimeout(settings.readTimeoutMs());
            if (tls) {
                socket = startTls(socket, host, port, settings.readTimeoutMs());
            }
            OutputStream out = socket.getOutputStream();
            out.write(buildRequest(uri, method).getBytes(StandardCharsets.ISO_8859_1));
            out.flush();
            return readResponse(new BufferedInputStream(socket.getInputStream()), deadline);
        } finally {
            closeQuietly(socket);
        }
    }

    private static Socket startTls(Socket plain, String host, int port, int timeoutMs) throws IOException {
        SSLSocket ssl = (SSLSocket) ((SSLSocketFactory) SSLSocketFactory.getDefault())
                .createSocket(plain, host, port, true); // host => SNI + certificate name check
        ssl.setSoTimeout(timeoutMs);
        SSLParameters params = ssl.getSSLParameters();
        params.setEndpointIdentificationAlgorithm("HTTPS");
        ssl.setSSLParameters(params);
        ssl.startHandshake();
        return ssl;
    }

    private static String buildRequest(URI uri, String method) {
        String path = uri.getRawPath() == null || uri.getRawPath().isEmpty() ? "/" : uri.getRawPath();
        String query = uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery();
        String hostHeader = uri.getPort() == -1 ? uri.getHost() : uri.getHost() + ":" + uri.getPort();
        return method + " " + path + query + " HTTP/1.1\r\n"
                + "Host: " + hostHeader + "\r\n"
                + "User-Agent: " + USER_AGENT + "\r\n"
                + "Accept: */*\r\n"
                + "Connection: close\r\n\r\n";
    }

    private static Response readResponse(InputStream in, long deadline) throws IOException {
        String[] statusLine = readLine(in, deadline).split(" ", 3);
        if (statusLine.length < 2 || !statusLine[0].startsWith("HTTP/")) {
            throw new IOException("Malformed HTTP response");
        }
        int status;
        try {
            status = Integer.parseInt(statusLine[1]);
        } catch (NumberFormatException e) {
            throw new IOException("Malformed HTTP status");
        }
        String location = null;
        for (int i = 0; i < MAX_HEADERS; i++) {
            String line = readLine(in, deadline);
            if (line.isEmpty()) {
                return new Response(status, location);
            }
            if (line.regionMatches(true, 0, "location:", 0, 9)) {
                location = line.substring(9).strip();
            }
        }
        throw new IOException("Too many response headers");
    }

    /** Bounded line reader: a hostile server cannot make us buffer unlimited data or wait forever. */
    private static String readLine(InputStream in, long deadline) throws IOException {
        StringBuilder line = new StringBuilder();
        int next;
        while ((next = in.read()) != -1) {
            if (System.nanoTime() > deadline) {
                throw new SocketTimeoutException("Overall deadline exceeded");
            }
            if (next == '\n') {
                int length = line.length();
                if (length > 0 && line.charAt(length - 1) == '\r') {
                    line.setLength(length - 1);
                }
                return line.toString();
            }
            if (line.length() >= MAX_LINE) {
                throw new IOException("Response header line too long");
            }
            line.append((char) next);
        }
        throw new EOFException("Connection closed before the response was complete");
    }

    private static boolean isRedirect(int status) {
        return status == 301 || status == 302 || status == 303 || status == 307 || status == 308;
    }

    private static void closeQuietly(Socket socket) {
        try {
            socket.close();
        } catch (IOException ignored) {
            // nothing useful to do
        }
    }
}
