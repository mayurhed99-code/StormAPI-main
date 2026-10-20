package com.ravitej.stormapi.execution.web;

import com.ravitej.stormapi.common.security.AuthenticatedUser;
import com.ravitej.stormapi.common.security.SecurityUtils;
import com.ravitej.stormapi.execution.model.ApiTarget;
import com.ravitej.stormapi.execution.repo.ApiTargetRepository;
import com.ravitej.stormapi.execution.web.TestDtos.CreateTargetRequest;
import com.ravitej.stormapi.execution.web.TestDtos.TargetResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * CRUD for API targets (Phase 2).
 * All targets are owned by the authenticated user; other users cannot
 * see or modify them.
 */
@RestController
@RequestMapping("/api/test/targets")
public class ApiTargetController {

    private final ApiTargetRepository targetRepo;

    public ApiTargetController(ApiTargetRepository targetRepo) {
        this.targetRepo = targetRepo;
    }

    @PostMapping
    public ResponseEntity<TargetResponse> create(@Valid @RequestBody CreateTargetRequest req) {
        AuthenticatedUser user = SecurityUtils.currentUser();
        ApiTarget t = new ApiTarget();
        t.setUserId(user.userId());
        t.setName(req.name());
        t.setBaseUrl(req.baseUrl());
        t.setMethod(req.method().toUpperCase());
        t.setHeadersJson(req.headersJson());
        t.setBodyTemplate(req.bodyTemplate());
        t.setCreatedAt(Instant.now());
        ApiTarget saved = targetRepo.save(t);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @GetMapping
    public ResponseEntity<List<TargetResponse>> list() {
        AuthenticatedUser user = SecurityUtils.currentUser();
        List<TargetResponse> responses = targetRepo
                .findByUserIdOrderByCreatedAtDesc(user.userId())
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TargetResponse> getOne(@PathVariable Long id) {
        AuthenticatedUser user = SecurityUtils.currentUser();
        ApiTarget t = targetRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Target not found"));
        if (!t.getUserId().equals(user.userId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found", "Target not found");
        }
        return ResponseEntity.ok(toResponse(t));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        AuthenticatedUser user = SecurityUtils.currentUser();
        ApiTarget t = targetRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Target not found"));
        if (!t.getUserId().equals(user.userId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found", "Target not found");
        }
        targetRepo.delete(t);
        return ResponseEntity.noContent().build();
    }

    private TargetResponse toResponse(ApiTarget t) {
        return new TargetResponse(
                t.getId(), t.getUserId(), t.getName(), t.getBaseUrl(),
                t.getMethod(), t.getHeadersJson(), t.getBodyTemplate(), t.getCreatedAt());
    }
}
