package com.ravitej.stormapi.execution.exec;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ravitej.stormapi.execution.model.ApiTarget;
import com.ravitej.stormapi.execution.model.TestConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

/**
 * The core of the project (Phases.md, Phase 3).
 *
 * - Virtual-thread-per-task executor fires the requests
 * - A Semaphore(concurrency) genuinely bounds in-flight requests
 * - Every request has a hard timeout; failures are recorded, never thrown
 * - Live counters are written to Redis for the Metrics Service to poll
 */
@Component
public class LoadTestExecutor {

    private static final Logger log = LoggerFactory.getLogger(LoadTestExecutor.class);
    private static final Set<String> BODY_METHODS = Set.of("POST", "PUT", "PATCH");
    private static final Duration KEY_TTL = Duration.ofHours(2);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public LoadTestExecutor(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    /**
     * Kicks off the load test asynchronously on a virtual thread and returns
     * immediately. Completion is signalled to the Metrics Service by setting
     * the Redis status key to FINISHED.
     */
    public void launch(long runId, ApiTarget target, TestConfig config) {
        Thread.ofVirtual().name("load-run-" + runId).start(() -> {
            try {
                runLoadTest(runId, target, config);
            } catch (Throwable t) {
                // Never let the run die silently mid-flight: mark it finished so
                // the Metrics Service can finalize whatever was recorded.
                log.error("Load test run {} aborted unexpectedly", runId, t);
                redis.opsForValue().set(RedisKeys.status(runId), RedisKeys.STATUS_FINISHED, KEY_TTL);
            }
        });
    }

    private void runLoadTest(long runId, ApiTarget target, TestConfig config) {
        int totalRequests = config.getTotalRequests();
        int timeoutMs = config.getTimeoutMs() != null ? config.getTimeoutMs() : MvpLimits.DEFAULT_TIMEOUT_MS;

        initCounters(runId, totalRequests);

        HttpRequest request;
        try {
            request = buildRequest(target, timeoutMs);
        } catch (Exception e) {
            log.warn("Run {}: could not build request for target {}: {}", runId, target.getId(), e.getMessage());
            // Every request counts as a failure; the run still finishes cleanly.
            redis.opsForValue().set(RedisKeys.completed(runId), String.valueOf(totalRequests), KEY_TTL);
            redis.opsForValue().set(RedisKeys.failures(runId), String.valueOf(totalRequests), KEY_TTL);
            redis.opsForValue().set(RedisKeys.durationMs(runId), "0", KEY_TTL);
            redis.opsForValue().set(RedisKeys.status(runId), RedisKeys.STATUS_FINISHED, KEY_TTL);
            return;
        }

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(timeoutMs))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        Semaphore semaphore = new Semaphore(config.getConcurrency());
        long startNanos = System.nanoTime();

        // try-with-resources: close() waits until all submitted tasks finish.
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < totalRequests; i++) {
                executor.submit(() -> {
                    try {
                        semaphore.acquire();
                        try {
                            fireOne(runId, client, request);
                        } finally {
                            semaphore.release();
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        recordFailure(runId);
                    } catch (Throwable t) {
                        // A worker must never kill the run (Rules.md, section 2).
                        recordFailure(runId);
                    }
                });
            }
        }

        long durationMs = Math.max(1, (System.nanoTime() - startNanos) / 1_000_000);
        redis.opsForValue().set(RedisKeys.durationMs(runId), String.valueOf(durationMs), KEY_TTL);
        redis.expire(RedisKeys.latencies(runId), KEY_TTL);
        redis.opsForValue().set(RedisKeys.status(runId), RedisKeys.STATUS_FINISHED, KEY_TTL);
        log.info("Load test run {} finished firing {} requests in {} ms", runId, totalRequests, durationMs);
    }

    private void fireOne(long runId, HttpClient client, HttpRequest request) {
        long t0 = System.nanoTime();
        boolean success;
        long latencyMs = 0;
        try {
            HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
            latencyMs = (System.nanoTime() - t0) / 1_000_000;
            success = response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            success = false;
        } catch (Exception e) {
            // Timeout / connection refused / non-HTTP garbage: data, not an exception.
            success = false;
        }

        redis.opsForValue().increment(RedisKeys.completed(runId));
        if (success) {
            redis.opsForValue().increment(RedisKeys.latencySum(runId), latencyMs);
            redis.opsForList().rightPush(RedisKeys.latencies(runId), String.valueOf(latencyMs));
            // Cap stored samples so the list can never grow unbounded (Rules.md, section 2).
            redis.opsForList().trim(RedisKeys.latencies(runId), -MvpLimits.MAX_LATENCY_SAMPLES, -1);
        } else {
            redis.opsForValue().increment(RedisKeys.failures(runId));
        }
    }

    private void recordFailure(long runId) {
        redis.opsForValue().increment(RedisKeys.completed(runId));
        redis.opsForValue().increment(RedisKeys.failures(runId));
    }

    private void initCounters(long runId, int totalRequests) {
        redis.opsForValue().set(RedisKeys.status(runId), RedisKeys.STATUS_RUNNING, KEY_TTL);
        redis.opsForValue().set(RedisKeys.total(runId), String.valueOf(totalRequests), KEY_TTL);
        redis.opsForValue().set(RedisKeys.completed(runId), "0", KEY_TTL);
        redis.opsForValue().set(RedisKeys.failures(runId), "0", KEY_TTL);
        redis.opsForValue().set(RedisKeys.latencySum(runId), "0", KEY_TTL);
        redis.delete(RedisKeys.latencies(runId));
    }

    private HttpRequest buildRequest(ApiTarget target, int timeoutMs) throws Exception {
        URI uri = URI.create(target.getBaseUrl());
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofMillis(timeoutMs));
        applyHeaders(builder, target.getHeadersJson());

        String method = target.getMethod().toUpperCase();
        HttpRequest.BodyPublisher body =
                BODY_METHODS.contains(method) && target.getBodyTemplate() != null && !target.getBodyTemplate().isBlank()
                        ? HttpRequest.BodyPublishers.ofString(target.getBodyTemplate())
                        : HttpRequest.BodyPublishers.noBody();
        return builder.method(method, body).build();
    }

    private void applyHeaders(HttpRequest.Builder builder, String headersJson) throws Exception {
        if (headersJson == null || headersJson.isBlank()) {
            return;
        }
        Map<String, String> headers = objectMapper.readValue(headersJson, new TypeReference<Map<String, String>>() {
        });
        headers.forEach((name, value) -> {
            try {
                builder.header(name, value);
            } catch (IllegalArgumentException e) {
                // Restricted header (Host, Connection, ...) — skip it rather than fail the run.
                log.debug("Skipping restricted header {}", name);
            }
        });
    }
}