package com.ravitej.stormapi.report.polling;

/**
 * Payload pushed over the WebSocket topic {@code /topic/runs/{runId}}
 * every 1s while a run is active.
 */
public record RunProgress(
        long runId,
        long completed,
        long total,
        long failures,
        double avgLatencyMs,
        String status
) {
}
