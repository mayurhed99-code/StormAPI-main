package com.ravitej.stormapi.execution.web;

import com.ravitej.stormapi.common.security.AuthenticatedUser;
import com.ravitej.stormapi.common.security.SecurityUtils;
import com.ravitej.stormapi.execution.model.ApiTarget;
import com.ravitej.stormapi.execution.model.TestConfig;
import com.ravitej.stormapi.execution.repo.ApiTargetRepository;
import com.ravitej.stormapi.execution.repo.TestConfigRepository;
import com.ravitej.stormapi.execution.web.TestDtos.ConfigResponse;
import com.ravitej.stormapi.execution.web.TestDtos.CreateConfigRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * CRUD for test configurations (Phase 2).
 * A config is linked to an ApiTarget; only the target's owner may
 * create configs against it.
 */
@RestController
@RequestMapping("/api/test/configs")
public class TestConfigController {

    private final TestConfigRepository configRepo;
    private final ApiTargetRepository targetRepo;

    public TestConfigController(TestConfigRepository configRepo, ApiTargetRepository targetRepo) {
        this.configRepo = configRepo;
        this.targetRepo = targetRepo;
    }

    @PostMapping("/targets/{targetId}")
    public ResponseEntity<ConfigResponse> create(
            @PathVariable Long targetId,
            @Valid @RequestBody CreateConfigRequest req) {

        AuthenticatedUser user = SecurityUtils.currentUser();
        ApiTarget target = targetRepo.findById(targetId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Target not found"));
        if (!target.getUserId().equals(user.userId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found", "Target not found");
        }

        TestConfig cfg = new TestConfig();
        cfg.setApiTargetId(targetId);
        cfg.setConcurrency(req.concurrency());
        cfg.setTotalRequests(req.totalRequests());
        cfg.setTimeoutMs(req.timeoutMs());
        cfg.setCreatedAt(Instant.now());
        TestConfig saved = configRepo.save(cfg);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @GetMapping
    public ResponseEntity<List<ConfigResponse>> list() {
        AuthenticatedUser user = SecurityUtils.currentUser();
        List<ConfigResponse> responses = configRepo.findAllForUser(user.userId())
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConfigResponse> getOne(@PathVariable Long id) {
        AuthenticatedUser user = SecurityUtils.currentUser();
        TestConfig cfg = configRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Config not found"));
        // Verify ownership via the target
        ApiTarget target = targetRepo.findById(cfg.getApiTargetId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Config not found"));
        if (!target.getUserId().equals(user.userId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found", "Config not found");
        }
        return ResponseEntity.ok(toResponse(cfg));
    }

    private ConfigResponse toResponse(TestConfig c) {
        return new ConfigResponse(
                c.getId(), c.getApiTargetId(), c.getConcurrency(),
                c.getTotalRequests(), c.getTimeoutMs(), c.getCreatedAt());
    }
}
