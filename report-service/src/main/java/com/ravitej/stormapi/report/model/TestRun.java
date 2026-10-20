package com.ravitej.stormapi.report.model;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Read-only view of test_runs created by execution-service.
 * The report-service never writes to this table; it reads it to look up
 * run status and to mark runs DONE after finalizing a report.
 *
 * Note: we DO update the status column here when finalizing (marking DONE).
 * The schema is shared; only the Flyway history is separate.
 */
@Entity
@Table(name = "test_runs")
public class TestRun {

    public static final String STATUS_RUNNING = "RUNNING";
    public static final String STATUS_DONE = "DONE";
    public static final String STATUS_FAILED = "FAILED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_config_id", nullable = false)
    private Long testConfigId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTestConfigId() {
        return testConfigId;
    }

    public void setTestConfigId(Long testConfigId) {
        this.testConfigId = testConfigId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }
}
