package com.example.portfolio.project;

/** Result of the last link check. BLOCKED means the URL was refused by the SSRF policy. */
public enum LinkStatus { UNKNOWN, OK, BROKEN, BLOCKED }
