CREATE TABLE IF NOT EXISTS api_targets (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT        NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    base_url      VARCHAR(2048) NOT NULL,
    method        VARCHAR(10)   NOT NULL,
    headers_json  TEXT          NULL,
    body_template TEXT          NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_api_targets_user (user_id)
);

CREATE TABLE IF NOT EXISTS test_configs (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_target_id  BIGINT    NOT NULL,
    concurrency    INT       NOT NULL,
    total_requests INT       NOT NULL,
    timeout_ms     INT       NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_test_configs_target (api_target_id)
);

CREATE TABLE IF NOT EXISTS test_runs (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_config_id BIGINT      NOT NULL,
    status         VARCHAR(20) NOT NULL,
    started_at     TIMESTAMP   NULL,
    ended_at       TIMESTAMP   NULL,
    INDEX idx_test_runs_config (test_config_id),
    INDEX idx_test_runs_status (status)
);
