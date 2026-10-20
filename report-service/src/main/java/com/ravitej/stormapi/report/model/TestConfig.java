package com.ravitej.stormapi.report.model;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Read-only view of test_configs (owned by execution-service) used by
 * report-service to do user-scoped report queries via the join chain:
 * test_reports → test_runs → test_configs → api_targets (userId).
 */
@Entity
@Table(name = "test_configs")
public class TestConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_target_id", nullable = false)
    private Long apiTargetId;

    @Column(nullable = false)
    private Integer concurrency;

    @Column(name = "total_requests", nullable = false)
    private Integer totalRequests;

    @Column(name = "timeout_ms", nullable = false)
    private Integer timeoutMs;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public Long getApiTargetId() {
        return apiTargetId;
    }
}
