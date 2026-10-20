package com.ravitej.stormapi.execution.web;

import jakarta.validation.constraints.*;

import java.time.Instant;

/**
 * Request/response records for the Test Service REST layer.
 * Records per Rules.md §3. Validation annotations enforce MVP limits
 * at the controller level before anything reaches the executor.
 */
public final class TestDtos {

    private TestDtos() {
    }

    // ── API Targets ──────────────────────────────────────────────────────────

    public record CreateTargetRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(max = 2048) @Pattern(regexp = "https?://.*",
                    message = "must be an http or https URL") String baseUrl,
            @NotBlank @Pattern(regexp = "GET|POST|PUT|DELETE|PATCH",
                    message = "must be one of GET, POST, PUT, DELETE, PATCH") String method,
            String headersJson,
            String bodyTemplate
    ) {
    }

    public record TargetResponse(
            long id,
            long userId,
            String name,
            String baseUrl,
            String method,
            String headersJson,
            String bodyTemplate,
            Instant createdAt
    ) {
    }

    // ── Test Configs ─────────────────────────────────────────────────────────

    public record CreateConfigRequest(
            @NotNull @Min(1) @Max(250) Integer concurrency,
            @NotNull @Min(1) @Max(10_000) Integer totalRequests,
            @NotNull @Min(1) @Max(30_000) Integer timeoutMs
    ) {
    }

    public record ConfigResponse(
            long id,
            long apiTargetId,
            int concurrency,
            int totalRequests,
            int timeoutMs,
            Instant createdAt
    ) {
    }

    // ── Test Runs ────────────────────────────────────────────────────────────

    public record StartRunResponse(
            long runId,
            String status
    ) {
    }

    public record RunResponse(
            long id,
            long testConfigId,
            String status,
            Instant startedAt,
            Instant endedAt
    ) {
    }
}
