package com.ravitej.stormapi.target;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Dummy HTTP target for load-test demos (Rules.md §6).
 *
 * All endpoints introduce an artificial delay of 20–80 ms to simulate a
 * realistic API under load. They accept any method/body and always return
 * 200 so that StormAPI's success-rate metric shows 100% under normal
 * conditions.
 *
 * Expose at docker-compose hostname "target-api:8080".
 * Register in StormAPI as: http://target-api:8080/ping
 */
@RestController
public class TargetController {

    private static final int DELAY_MIN_MS = 20;
    private static final int DELAY_MAX_MS = 80;

    /** Primary endpoint — used in the README demo. */
    @GetMapping("/ping")
    public Map<String, Object> ping() throws InterruptedException {
        delay();
        return Map.of("status", "ok", "timestamp", Instant.now().toString());
    }

    /** POST variant so users can demo body-carrying requests. */
    @PostMapping("/ping")
    public Map<String, Object> pingPost(@RequestBody(required = false) String body)
            throws InterruptedException {
        delay();
        return Map.of("status", "ok", "echo", body != null ? body : "", "timestamp", Instant.now().toString());
    }

    /** Catch-all for any other method/path — always 200. */
    @RequestMapping("/**")
    public Map<String, Object> catchAll() throws InterruptedException {
        delay();
        return Map.of("status", "ok", "timestamp", Instant.now().toString());
    }

    private void delay() throws InterruptedException {
        int ms = ThreadLocalRandom.current().nextInt(DELAY_MIN_MS, DELAY_MAX_MS + 1);
        Thread.sleep(ms);
    }
}
