package com.ravitej.stormapi.report.polling;

/**
 * Redis key layout — must stay in sync with execution-service's RedisKeys
 * class. These are purely strings; no shared JAR required.
 */
final class RedisKeys {

    static final String STATUS_RUNNING = "RUNNING";
    static final String STATUS_FINISHED = "FINISHED";

    private RedisKeys() {
    }

    static String completed(long runId) {
        return "test:" + runId + ":completed";
    }

    static String failures(long runId) {
        return "test:" + runId + ":failures";
    }

    static String latencies(long runId) {
        return "test:" + runId + ":latencies";
    }

    static String latencySum(long runId) {
        return "test:" + runId + ":latency_sum";
    }

    static String status(long runId) {
        return "test:" + runId + ":status";
    }

    static String total(long runId) {
        return "test:" + runId + ":total";
    }

    static String durationMs(long runId) {
        return "test:" + runId + ":duration_ms";
    }
}
