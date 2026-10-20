package com.ravitej.stormapi.execution.exec;

/**
 * Hard server-side caps from Architecture.md, "MVP Limits" table.
 * These are the abuse mitigation for accepting any HTTP/HTTPS target.
 * Do not raise without updating Architecture.md.
 */
public final class MvpLimits {

    public static final int MAX_CONCURRENCY = 250;
    public static final int MAX_TOTAL_REQUESTS = 10_000;
    public static final int MAX_TIMEOUT_MS = 30_000;
    public static final int MAX_SIMULTANEOUS_RUNS = 2;
    public static final int DEFAULT_TIMEOUT_MS = 5_000;
    public static final int MAX_LATENCY_SAMPLES = 50_000;

    private MvpLimits() {
    }
}
