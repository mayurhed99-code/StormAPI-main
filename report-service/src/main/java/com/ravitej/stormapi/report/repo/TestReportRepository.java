package com.ravitej.stormapi.report.repo;

import com.ravitej.stormapi.report.model.TestReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TestReportRepository extends JpaRepository<TestReport, Long> {

    /**
     * Returns all reports whose test_run belongs to a config owned by the
     * given userId, ordered newest first.
     *
     * Join chain: test_reports → test_runs → test_configs → api_targets (userId).
     */
    @Query("""
            select r from TestReport r
            join TestRun run on run.id = r.testRunId
            join TestConfig cfg on cfg.id = run.testConfigId
            join ApiTarget t on t.id = cfg.apiTargetId
            where t.userId = :userId
            order by r.createdAt desc
            """)
    List<TestReport> findAllForUser(@Param("userId") Long userId);

    /**
     * Checks whether a report already exists for a given run (prevents
     * duplicate finalization by the poller).
     */
    boolean existsByTestRunId(Long testRunId);
}
