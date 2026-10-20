package com.ravitej.stormapi.execution.web;

import com.ravitej.stormapi.common.security.AuthenticatedUser;
import com.ravitej.stormapi.common.security.SecurityUtils;
import com.ravitej.stormapi.execution.exec.LoadTestExecutor;
import com.ravitej.stormapi.execution.exec.MvpLimits;
import com.ravitej.stormapi.execution.model.ApiTarget;
import com.ravitej.stormapi.execution.model.TestConfig;
import com.ravitej.stormapi.execution.model.TestRun;
import com.ravitej.stormapi.execution.repo.ApiTargetRepository;
import com.ravitej.stormapi.execution.repo.TestConfigRepository;
import com.ravitej.stormapi.execution.repo.TestRunRepository;
import com.ravitej.stormapi.execution.web.TestDtos.RunResponse;
import com.ravitej.stormapi.execution.web.TestDtos.StartRunResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * Test run management (Phase 3).
 *
 * POST /api/test/runs/{configId}/start
 *   - Validates ownership of config → target
 *   - Re-enforces MVP server-side limits (Rules.md §1 — never trust client alone)
 *   - Enforces max 2 simultaneous RUNNING runs
 *   - Writes audit log entry
 *   - Creates run row (status=RUNNING)
 *   - Calls LoadTestExecutor.launch (async, returns immediately)
 *   - Returns {runId, status} with 202 Accepted
 */
@RestController
@RequestMapping("/api/test/runs")
public class TestRunController {

    private static final Logger log = LoggerFactory.getLogger(TestRunController.class);

    private final TestRunRepository runRepo;
    private final TestConfigRepository configRepo;
    private final ApiTargetRepository targetRepo;
    private final LoadTestExecutor executor;

    public TestRunController(TestRunRepository runRepo,
                             TestConfigRepository configRepo,
                             ApiTargetRepository targetRepo,
                             LoadTestExecutor executor) {
        this.runRepo = runRepo;
        this.configRepo = configRepo;
        this.targetRepo = targetRepo;
        this.executor = executor;
    }

    /**
     * Starts a load test for the given config.
     * Returns 202 Accepted with the new run ID so the client can subscribe
     * to the WebSocket topic before the run finishes.
     */
    @PostMapping("/{configId}/start")
    public ResponseEntity<StartRunResponse> start(@PathVariable Long configId) {
        AuthenticatedUser user = SecurityUtils.currentUser();

        // 1. Resolve config and verify ownership
        TestConfig config = configRepo.findById(configId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Config not found"));
        ApiTarget target = targetRepo.findById(config.getApiTargetId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Target not found"));
        if (!target.getUserId().equals(user.userId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found", "Config not found");
        }

        // 2. Re-enforce MVP limits server-side (Architecture.md §8 / Rules.md §1)
        if (config.getConcurrency() > MvpLimits.MAX_CONCURRENCY) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "limit_exceeded",
                    "concurrency exceeds maximum of " + MvpLimits.MAX_CONCURRENCY);
        }
        if (config.getTotalRequests() > MvpLimits.MAX_TOTAL_REQUESTS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "limit_exceeded",
                    "totalRequests exceeds maximum of " + MvpLimits.MAX_TOTAL_REQUESTS);
        }
        if (config.getTimeoutMs() > MvpLimits.MAX_TIMEOUT_MS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "limit_exceeded",
                    "timeoutMs exceeds maximum of " + MvpLimits.MAX_TIMEOUT_MS);
        }

        // 3. Enforce max simultaneous RUNNING runs (Architecture.md §8)
        long runningCount = runRepo.countByStatus(TestRun.STATUS_RUNNING);
        if (runningCount >= MvpLimits.MAX_SIMULTANEOUS_RUNS) {
            throw new ApiException(HttpStatus.CONFLICT, "too_many_runs",
                    "Maximum of " + MvpLimits.MAX_SIMULTANEOUS_RUNS + " simultaneous runs reached");
        }

        // 4. Audit log (Rules.md §1)
        log.info("AUDIT: user={} (email={}) starting run: configId={}, target={} {} concurrency={} totalRequests={}",
                user.userId(), user.email(), configId, target.getMethod(), target.getBaseUrl(),
                config.getConcurrency(), config.getTotalRequests());

        // 5. Create the run row
        TestRun run = new TestRun();
        run.setTestConfigId(configId);
        run.setStatus(TestRun.STATUS_RUNNING);
        run.setStartedAt(Instant.now());
        TestRun saved = runRepo.save(run);

        // 6. Launch async (returns immediately)
        executor.launch(saved.getId(), target, config);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new StartRunResponse(saved.getId(), saved.getStatus()));
    }

    @GetMapping
    public ResponseEntity<List<RunResponse>> list() {
        AuthenticatedUser user = SecurityUtils.currentUser();
        List<Long> userConfigIds = configRepo.findAllForUser(user.userId())
                .stream().map(TestConfig::getId).toList();
        if (userConfigIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<RunResponse> responses = runRepo.findByTestConfigIdInOrderByStartedAtDesc(userConfigIds)
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RunResponse> getOne(@PathVariable Long id) {
        AuthenticatedUser user = SecurityUtils.currentUser();
        TestRun run = runRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Run not found"));
        // Verify ownership via config → target
        TestConfig config = configRepo.findById(run.getTestConfigId()).orElse(null);
        if (config == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found", "Run not found");
        }
        ApiTarget target = targetRepo.findById(config.getApiTargetId()).orElse(null);
        if (target == null || !target.getUserId().equals(user.userId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found", "Run not found");
        }
        return ResponseEntity.ok(toResponse(run));
    }

    private RunResponse toResponse(TestRun r) {
        return new RunResponse(r.getId(), r.getTestConfigId(), r.getStatus(),
                r.getStartedAt(), r.getEndedAt());
    }
}
