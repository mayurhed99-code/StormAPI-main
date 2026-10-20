-- No FK to test_runs on purpose: test_runs is created by execution-service's
-- migration and service start order must not matter for schema creation.
CREATE TABLE IF NOT EXISTS test_reports (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_run_id    BIGINT    NOT NULL,
    avg_latency_ms DOUBLE    NOT NULL,
    min_latency_ms BIGINT    NOT NULL,
    max_latency_ms BIGINT    NOT NULL,
    p95_latency_ms BIGINT    NOT NULL,
    success_count  INT       NOT NULL,
    failure_count  INT       NOT NULL,
    rps            DOUBLE    NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_test_reports_run (test_run_id)
);
