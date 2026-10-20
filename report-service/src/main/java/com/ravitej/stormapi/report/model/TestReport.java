package com.ravitej.stormapi.report.model;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Persisted after a test run finishes. Computed by the MetricsPoller from
 * Redis final counters (Architecture.md §5, test_reports table).
 */
@Entity
@Table(name = "test_reports")
public class TestReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_run_id", nullable = false)
    private Long testRunId;

    @Column(name = "avg_latency_ms", nullable = false)
    private Double avgLatencyMs;

    @Column(name = "min_latency_ms", nullable = false)
    private Long minLatencyMs;

    @Column(name = "max_latency_ms", nullable = false)
    private Long maxLatencyMs;

    @Column(name = "p95_latency_ms", nullable = false)
    private Long p95LatencyMs;

    @Column(name = "success_count", nullable = false)
    private Integer successCount;

    @Column(name = "failure_count", nullable = false)
    private Integer failureCount;

    @Column(nullable = false)
    private Double rps;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTestRunId() {
        return testRunId;
    }

    public void setTestRunId(Long testRunId) {
        this.testRunId = testRunId;
    }

    public Double getAvgLatencyMs() {
        return avgLatencyMs;
    }

    public void setAvgLatencyMs(Double avgLatencyMs) {
        this.avgLatencyMs = avgLatencyMs;
    }

    public Long getMinLatencyMs() {
        return minLatencyMs;
    }

    public void setMinLatencyMs(Long minLatencyMs) {
        this.minLatencyMs = minLatencyMs;
    }

    public Long getMaxLatencyMs() {
        return maxLatencyMs;
    }

    public void setMaxLatencyMs(Long maxLatencyMs) {
        this.maxLatencyMs = maxLatencyMs;
    }

    public Long getP95LatencyMs() {
        return p95LatencyMs;
    }

    public void setP95LatencyMs(Long p95LatencyMs) {
        this.p95LatencyMs = p95LatencyMs;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(Integer failureCount) {
        this.failureCount = failureCount;
    }

    public Double getRps() {
        return rps;
    }

    public void setRps(Double rps) {
        this.rps = rps;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
