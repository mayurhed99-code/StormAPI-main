package com.ravitej.stormapi.report.web;

import java.time.Instant;

/**
 * Response records for the Metrics Service REST layer.
 */
public final class ReportDtos {

    private ReportDtos() {
    }

    public record ReportResponse(
            long id,
            long testRunId,
            double avgLatencyMs,
            long minLatencyMs,
            long maxLatencyMs,
            long p95LatencyMs,
            int successCount,
            int failureCount,
            double rps,
            Instant createdAt
    ) {
    }
}
