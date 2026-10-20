package com.ravitej.stormapi.report.polling;

import com.ravitej.stormapi.report.model.TestReport;
import com.ravitej.stormapi.report.model.TestRun;
import com.ravitej.stormapi.report.repo.TestReportRepository;
import com.ravitej.stormapi.report.repo.TestRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Polls Redis every 1 second for all RUNNING test runs (Architecture.md §4).
 *
 * On each tick:
 *   1. Finds all DB rows with status=RUNNING
 *   2. Reads live counters from Redis
 *   3. Pushes a progress message to the STOMP topic /topic/runs/{runId}
 *   4. If Redis status = FINISHED and no report yet → finalizes:
 *      computes avg/min/max/P95/RPS, persists test_report, marks run DONE
 */
@Component
public class MetricsPoller {

    private static final Logger log = LoggerFactory.getLogger(MetricsPoller.class);

    private final TestRunRepository runRepo;
    private final TestReportRepository reportRepo;
    private final StringRedisTemplate redis;
    private final SimpMessagingTemplate ws;

    public MetricsPoller(TestRunRepository runRepo,
                         TestReportRepository reportRepo,
                         StringRedisTemplate redis,
                         SimpMessagingTemplate ws) {
        this.runRepo = runRepo;
        this.reportRepo = reportRepo;
        this.redis = redis;
        this.ws = ws;
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void poll() {
        List<TestRun> runningRuns = runRepo.findByStatus(TestRun.STATUS_RUNNING);
        for (TestRun run : runningRuns) {
            try {
                processRun(run);
            } catch (Exception e) {
                log.warn("MetricsPoller: error processing run {}: {}", run.getId(), e.getMessage(), e);
            }
        }
    }

    private void processRun(TestRun run) {
        long runId = run.getId();
        String redisStatus = redis.opsForValue().get(RedisKeys.status(runId));

        long completed = parseLong(redis.opsForValue().get(RedisKeys.completed(runId)));
        long total = parseLong(redis.opsForValue().get(RedisKeys.total(runId)));
        long failures = parseLong(redis.opsForValue().get(RedisKeys.failures(runId)));
        long latencySum = parseLong(redis.opsForValue().get(RedisKeys.latencySum(runId)));

        double avgLatencyMs = (completed - failures) > 0
                ? (double) latencySum / (completed - failures)
                : 0.0;

        // Push live progress over WebSocket
        RunProgress progress = new RunProgress(runId, completed, total, failures, avgLatencyMs,
                redisStatus != null ? redisStatus : RedisKeys.STATUS_RUNNING);
        ws.convertAndSend("/topic/runs/" + runId, progress);

        // Finalize if executor has finished
        if (RedisKeys.STATUS_FINISHED.equals(redisStatus)) {
            if (!reportRepo.existsByTestRunId(runId)) {
                finalizeRun(run, completed, failures, latencySum);
            }
        }
    }

    private void finalizeRun(TestRun run, long completed, long failures, long latencySum) {
        long runId = run.getId();
        log.info("Finalizing run {}", runId);

        long durationMs = parseLong(redis.opsForValue().get(RedisKeys.durationMs(runId)));
        long successCount = Math.max(0, completed - failures);

        // Compute min/max/P95 from stored latency samples
        List<String> rawSamples = redis.opsForList().range(RedisKeys.latencies(runId), 0, -1);
        List<Long> samples = new ArrayList<>();
        if (rawSamples != null) {
            for (String s : rawSamples) {
                try {
                    samples.add(Long.parseLong(s));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        Collections.sort(samples);

        long minLatency = samples.isEmpty() ? 0L : samples.get(0);
        long maxLatency = samples.isEmpty() ? 0L : samples.get(samples.size() - 1);
        long p95Latency = computeP95(samples);
        double avgLatency = successCount > 0 ? (double) latencySum / successCount : 0.0;
        double rps = durationMs > 0 ? (double) completed / (durationMs / 1000.0) : 0.0;

        // Persist the report
        TestReport report = new TestReport();
        report.setTestRunId(runId);
        report.setAvgLatencyMs(avgLatency);
        report.setMinLatencyMs(minLatency);
        report.setMaxLatencyMs(maxLatency);
        report.setP95LatencyMs(p95Latency);
        report.setSuccessCount((int) successCount);
        report.setFailureCount((int) failures);
        report.setRps(rps);
        report.setCreatedAt(Instant.now());
        reportRepo.save(report);

        // Mark the run as DONE
        run.setStatus(TestRun.STATUS_DONE);
        run.setEndedAt(Instant.now());
        runRepo.save(run);

        // Clean up Redis keys (optional — they have a 2h TTL anyway)
        redis.delete(RedisKeys.status(runId));
        redis.delete(RedisKeys.completed(runId));
        redis.delete(RedisKeys.failures(runId));
        redis.delete(RedisKeys.latencySum(runId));
        redis.delete(RedisKeys.latencies(runId));
        redis.delete(RedisKeys.total(runId));
        redis.delete(RedisKeys.durationMs(runId));

        log.info("Run {} finalized: success={}, failures={}, avgMs={}, p95Ms={}, rps={}",
                runId, successCount, failures, String.format("%.2f", avgLatency), p95Latency,
                String.format("%.2f", rps));
    }

    /**
     * Computes the 95th percentile from a sorted list of latency samples.
     * Returns 0 if the list is empty.
     */
    private long computeP95(List<Long> sorted) {
        if (sorted.isEmpty()) {
            return 0L;
        }
        int idx = (int) Math.ceil(0.95 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(idx, sorted.size() - 1)));
    }

    private long parseLong(String value) {
        if (value == null || value.isBlank()) {
            return 0L;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
