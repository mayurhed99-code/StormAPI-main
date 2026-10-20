package com.ravitej.stormapi.execution.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

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

    public void setId(Long id) {
        this.id = id;
    }

    public Long getApiTargetId() {
        return apiTargetId;
    }

    public void setApiTargetId(Long apiTargetId) {
        this.apiTargetId = apiTargetId;
    }

    public Integer getConcurrency() {
        return concurrency;
    }

    public void setConcurrency(Integer concurrency) {
        this.concurrency = concurrency;
    }

    public Integer getTotalRequests() {
        return totalRequests;
    }

    public void setTotalRequests(Integer totalRequests) {
        this.totalRequests = totalRequests;
    }

    public Integer getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(Integer timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
