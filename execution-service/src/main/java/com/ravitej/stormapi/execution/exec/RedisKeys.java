package com.ravitej.stormapi.execution.exec;

/**
 * Redis key layout shared (by convention) with the Metrics Service.
 * All keys are ephemeral live-run state, never permanent data.
 */
public final class RedisKeys {

    public static final String STATUS_RUNNING = "RUNNING";
    public static final String STATUS_FINISHED = "FINISHED";

    private RedisKeys() {
    }

    public static String completed(long runId) {
        return "test:" + runId + ":completed";
    }

    public static String failures(long runId) {
        return "test:" + runId + ":failures";
    }

    public static String latencies(long runId) {
        return "test:" + runId + ":latencies";
    }

    public static String latencySum(long runId) {
        return "test:" + runId + ":latency_sum";
    }

    public static String status(long runId) {
        return "test:" + runId + ":status";
    }

    public static String total(long runId) {
        return "test:" + runId + ":total";
    }

    public static String durationMs(long runId) {
        return "test:" + runId + ":duration_ms";
    }
}
