package com.ravitej.stormapi.report.web;

import com.ravitej.stormapi.common.security.AuthenticatedUser;
import com.ravitej.stormapi.common.security.SecurityUtils;
import com.ravitej.stormapi.report.model.TestReport;
import com.ravitej.stormapi.report.repo.TestReportRepository;
import com.ravitej.stormapi.report.web.ReportDtos.ReportResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Historical report endpoints (Phase 5).
 *
 * GET /api/metrics/reports        — list all reports for the authenticated user
 * GET /api/metrics/reports/{id}   — detail view for a single report
 *
 * Reports are scoped by traversing: test_reports → test_runs →
 * test_configs → api_targets (userId).
 */
@RestController
@RequestMapping("/api/metrics/reports")
public class ReportController {

    private final TestReportRepository reportRepo;

    public ReportController(TestReportRepository reportRepo) {
        this.reportRepo = reportRepo;
    }

    @GetMapping
    public ResponseEntity<List<ReportResponse>> list() {
        AuthenticatedUser user = SecurityUtils.currentUser();
        List<ReportResponse> responses = reportRepo.findAllForUser(user.userId())
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportResponse> getOne(@PathVariable Long id) {
        AuthenticatedUser user = SecurityUtils.currentUser();
        TestReport report = reportRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "Report not found"));

        // Verify ownership — re-use the user-scoped query and check membership
        boolean owned = reportRepo.findAllForUser(user.userId())
                .stream()
                .anyMatch(r -> r.getId().equals(id));
        if (!owned) {
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found", "Report not found");
        }
        return ResponseEntity.ok(toResponse(report));
    }

    private ReportResponse toResponse(TestReport r) {
        return new ReportResponse(
                r.getId(), r.getTestRunId(), r.getAvgLatencyMs(),
                r.getMinLatencyMs(), r.getMaxLatencyMs(), r.getP95LatencyMs(),
                r.getSuccessCount(), r.getFailureCount(), r.getRps(), r.getCreatedAt());
    }
}
