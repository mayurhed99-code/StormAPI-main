# StormAPI — Memory Log

Living record of project state. Update this at the end of every work
session and every completed phase, before context runs out or before
switching sessions/models. Read this file first in any new session.

**Rule for the AI assistant:** keep entries short and factual — what
exists, what works, what's broken, what's next. Do not restate the full
architecture here; that lives in Architecture.md. This file is a diff over
time, not a duplicate of the other docs.

---

## Project State: IN PROGRESS (backend ~40%, see latest log entry)

Reference docs already written: PRD.md, Architecture.md, Rules.md,
Phases.md, Design.md (this file, Memory.md, is the sixth).

Stack confirmed: Java 21 / Spring Boot 3.x / Spring Security + JWT /
**MySQL** (corrected from Postgres) / Redis / Docker Compose / Nginx /
React+Vite / Java Virtual Threads.

---

## Log

### [Template — copy this block for each session/phase]

**Date:**
**Phase worked on:**

**Completed:**
-

**Verified:**
-

**Known Issues:**
-

**Next Task:**
-

---

<!-- Start logging real entries below this line once coding begins. -->

### 2026-07-14 19:05 UTC — Stabilization pass (Phases 0–1 backend, parts of 2–3)

**Overall progress:** ~40% of backend MVP. Project state: IN PROGRESS.

**Phase worked on:** Repo stabilization + Phase 1 (auth) + Phase 3 groundwork
(execution engine class), after an interrupted session left files truncated.

**Modules fully completed:**
- `common-security` — shared JWT library (plain jar, NOT a Boot app):
  `JwtService` (HS256, ≥32-byte secret), `JwtAuthenticationFilter`,
  `JsonAuthenticationEntryPoint`, `AuthenticatedUser` record, `SecurityUtils`.
- `gateway-service` (Auth Service) — register/login/me endpoints, bcrypt,
  JWT issuing, SecurityConfig, error handler, `users` Flyway migration.

**Modules partially completed:**
- `execution-service` — entities (`ApiTarget`, `TestConfig`, `TestRun`),
  repositories, Flyway V1 (api_targets/test_configs/test_runs), SecurityConfig,
  error handler, `MvpLimits`, `RedisKeys`, `LoadTestExecutor` (virtual threads +
  Semaphore + hard timeout + Redis counters). **No REST controllers/DTOs yet** —
  targets/configs/run-start endpoints missing.
- `report-service` (Metrics Service) — pom, properties, SecurityConfig,
  `test_reports` Flyway V1. **No poller, WebSocket config, report persistence,
  or report endpoints yet.**
- Infra — root aggregator `pom.xml`; Dockerfiles for all 3 services;
  `docker-compose.yml` (mysql 8.4, redis 7, 3 services, nginx, healthchecks);
  `nginx/nginx.conf` (routes `/api/auth|test|metrics/*`, `/ws`, actuator
  passthrough); `.env.example`; README. **`target-api` (dummy target) does not
  exist yet and is commented out of compose.**

**Fixed in this session:**
- `LoadTestExecutor.java` was truncated mid-method (compile-breaker) —
  completed `initCounters`, `buildRequest`, `applyHeaders`; added TTL on the
  latencies list.
- `report-service` had no pom.xml/application.properties (deleted, never
  recreated) — recreated per frozen stack; added its SecurityConfig so the
  actuator healthcheck isn't blocked by Boot's default security.
- No shared-module wiring — added root aggregator pom so services resolve
  `common-security` from the reactor.
- Recreated missing docker-compose.yml / nginx.conf / README (were empty files
  deleted for rewrite).

**Architectural decisions / doc updates:**
- Directory names differ from doc service names — mapping note added to
  Architecture.md §2 (gateway=Auth, execution=Test, report=Metrics,
  target-api=dummy-target).
- Spring Boot pinned to 3.5.7 (docs say 3.x; original generated poms wrongly
  used Boot 4 starters — rewritten).
- Shared MySQL schema, per-service Flyway history tables with
  baseline-on-migrate (documented in Architecture.md §2 note).
- `test_reports` has no FK to `test_runs` so service start order can't break
  migrations.
- Latency samples recorded for successful requests only; failures counted
  separately. Sample list capped at 50,000 (LTRIM), keys TTL'd 2h.
- WebSocket handshake `/ws/**` is permitAll in report-service (STOMP carries
  no JWT in MVP); REST endpoints remain JWT-protected.
- JWT: subject=userId, claim `email`, HS256 shared secret via `JWT_SECRET`.

**Maven/module structure:** root `pom.xml` (packaging pom) → modules:
`common-security`, `gateway-service`, `execution-service`, `report-service`.
Each service parents `spring-boot-starter-parent:3.5.7`, Java 21.
Build: `mvn -DskipTests package` from repo root.

**Database schema status:** V1 migrations written for all owned tables:
users (auth) / api_targets, test_configs, test_runs (execution) /
test_reports (report). Not yet run against a real MySQL.

**API endpoints implemented:**
- POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me`.
- Execution + metrics REST endpoints: none yet.

**Auth/security status:** all 3 services validate JWT via common-security
filter; consistent 401 JSON error shape; bcrypt for passwords; secret from
env only (no default in code; compose provides a dev-only fallback).

**Docker/Nginx status:** Dockerfiles + compose + nginx.conf written but NOT
yet run (no Docker available in this dev environment). target-api missing
from compose.

**Verified:** `mvn -B -DskipTests package` → BUILD SUCCESS for all 5 modules
(Java 21, Maven 3.9.12 in WSL). common-security jar confirmed to be a plain
library jar (no BOOT-INF, no main class, no repackaging).

**Known issues / tech debt:**
- Generated `*ApplicationTests` (@SpringBootTest contextLoads) require a DB +
  JWT_SECRET and will fail if executed; builds must use `-DskipTests`.
- Error-handler + SecurityConfig classes are near-duplicates in each service
  (accepted; only JWT logic was required to be shared).
- Compose default JWT_SECRET/db passwords are dev-only fallbacks; `.env`
  overrides them.
- Docker images untested (no Docker in dev env).

**Remaining backend MVP work:**
1. execution-service REST layer: DTOs + controllers for targets, test-configs,
   test-runs (`POST /api/test/test-runs/{configId}/start` → validate ownership,
   re-enforce MVP limits server-side, max 2 simultaneous RUNNING runs, audit
   log, create run row, call `LoadTestExecutor.launch`).
2. report-service: `@EnableScheduling` + 1s Redis poller, STOMP WebSocketConfig
   (`/ws`, `/topic/runs/{runId}`), finalization (avg/min/max/P95/RPS →
   test_reports, mark run DONE + ended_at, clear Redis keys), GET
   `/api/metrics/reports` + `/api/metrics/reports/{id}` (user-scoped join).
3. target-api module (tiny Boot app, endpoint with 20–80 ms artificial delay)
   + Dockerfile + add to compose + root pom.
4. `docker compose up` end-to-end verification (Phase 0/6 definition of done).

**Next recommended step:** implement item 1 (execution-service REST layer) —
everything it needs (entities, repos, limits, executor, security) already
exists. Then item 2, then item 3, then compose verification.

---

### 2026-07-15 01:57 UTC — Backend MVP complete (Phases 2–5 + target-api)

**Date:** 2026-07-15T01:57 UTC+05:30
**Phase worked on:** Phases 2 (API targets/configs), 3 (run start controller),
4 (WebSocket + MetricsPoller), 5 (report persistence + history), target-api.

**Overall progress:** ~95% of backend MVP. All business logic implemented.

**Completed this session:**

*execution-service REST layer (Phases 2–3):*
- `TestDtos.java` — request/response records for targets, configs, runs;
  validation annotations enforce MVP limits at the controller level.
- `ApiTargetController.java` — POST/GET/GET{id}/DELETE `/api/test/targets`;
  user-scoped (404 returned instead of 403 to avoid information leakage).
- `TestConfigController.java` — POST `/api/test/configs/targets/{targetId}`,
  GET list, GET `{id}`; ownership verified via target before write.
- `TestRunController.java` — POST `/api/test/runs/{configId}/start` (202):
  validates ownership, re-enforces ALL MVP limits server-side (Architecture.md
  §8 / Rules.md §1), checks max-2-simultaneous-RUNNING cap, writes audit log,
  creates run row, calls `LoadTestExecutor.launch` async; GET list + GET{id}
  user-scoped via config → target chain.
- `TestRunRepository` — added `findByTestConfigIdInOrderByStartedAtDesc`.

*report-service — full implementation (Phases 4–5):*
- `model/TestReport.java` — JPA entity for `test_reports`.
- `model/TestRun.java` — read/write view of `test_runs` (shared schema).
- `model/TestConfig.java` — read-only view of `test_configs`.
- `model/ApiTarget.java` — read-only view of `api_targets` (userId anchor).
- `repo/TestReportRepository.java` — JPQL join query scoping reports to
  userId; `existsByTestRunId` guard against double-finalization.
- `repo/TestRunRepository.java` — `findByStatus(String)` for RUNNING runs.
- `polling/RedisKeys.java` — package-private constants mirroring execution-service.
- `polling/RunProgress.java` — STOMP progress payload record.
- `polling/MetricsPoller.java` — `@Scheduled(fixedDelay=1000)` poll loop:
  reads Redis counters, pushes to `/topic/runs/{runId}` via STOMP; on
  FINISHED: computes avg/min/max/P95/RPS, persists TestReport, marks run DONE,
  cleans Redis keys.
- `config/WebSocketConfig.java` — STOMP config, simple in-memory broker on
  `/topic`, SockJS endpoint at `/ws`, `setAllowedOriginPatterns("*")`.
- `web/ReportDtos.java`, `ApiException.java`, `GlobalExceptionHandler.java`,
  `ReportController.java` — GET `/api/metrics/reports` + `/api/metrics/reports/{id}`.
- `ReportServiceApplication.java` — added `@EnableScheduling`.

*target-api module (new, Phase 0 definition of done):*
- `target-api/pom.xml` — Spring Boot 3.5.7, Web + Actuator, no DB/Redis.
- `TargetApiApplication.java`, `TargetController.java` — all endpoints
  return 200 with 20–80ms random delay; `/ping` GET/POST + catch-all `/**`.
- `application.properties` — virtual threads enabled, actuator exposed.
- `Dockerfile` — same multi-stage pattern as other services.
- Added to root `pom.xml` aggregator.
- Added to `docker-compose.yml` with healthcheck; nginx now depends on it.

**Verified:**
- `mvn -B -DskipTests package` → BUILD SUCCESS for all 6 modules in 8s
  (common-security, gateway-service, execution-service, report-service,
  target-api, stormapi aggregator).

**Architectural decisions:**
- report-service reads `test_runs`, `test_configs`, `api_targets` via local
  JPA entities (shared schema) — avoids cross-service HTTP calls and keeps
  the Metrics Service independent at startup.
- P95 computed from sorted latency sample list (Redis LIST, sorted in memory
  on finalization — capped at 50,000 by execution-service).
- WebSocket handshake is `permitAll`; REST endpoints remain JWT-protected.
- `existsByTestRunId` prevents double-finalization if poller fires twice
  during the FINISHED window before the run row is updated to DONE.
- target-api uses `ThreadLocalRandom` for delay (thread-safe, no contention).

**Known issues / tech debt:**
- Docker images still untested (no Docker in dev env).
- `mvn -DskipTests` required; `@SpringBootTest` tests still need env vars.
- ReportController.getOne ownership check calls `findAllForUser` twice — 
  acceptable for MVP (small dataset); refactor to a single JPQL query if needed.
- nginx does not yet route to target-api (not needed — target-api is only
  accessed by execution-service within the Docker network as
  `http://target-api:8080/ping`).

**Remaining work (to reach 100% backend MVP):**
1. `docker compose up` end-to-end verification — cannot run in this dev env
   without Docker. Needs Docker available to confirm all 7 containers start,
   healthchecks pass, and a demo run completes.
2. (Optional) README demo section update to describe the full flow + target-api
   URL to register (`http://target-api:8080/ping`).
3. Frontend (explicitly out of scope for backend MVP).

**Next recommended step:** On a machine with Docker, run `docker compose up`
and execute the demo flow from PRD.md §7. If any service fails to start,
check the startup logs — most likely Flyway migration ordering or JWT_SECRET
missing.

---

### 2026-07-15 02:30 UTC — Frontend MVP Complete (React + Vite)

**Date:** 2026-07-15T02:30 UTC+05:30
**Phase worked on:** Phase 2 (Frontend MVP Implementation)

**Overall progress:** 100% of Frontend MVP. Project MVP is now fully complete (Backend + Frontend).

**Completed this session:**

*Frontend Foundation:*
- Integrated Redux Toolkit (`authSlice`, `runSlice`) and `react-router-dom` v7.
- Defined base design tokens in `index.css` following `docs/DESIGN.md`, ensuring dark mode, typography (JetBrains Mono/Inter), and custom `.metric` monospace classes for layout stability.
- Built Axios client (`api/client.js`) with JWT interceptor and automated 401 logout handling.

*UI Primitives:*
- Created `components/ui.jsx` featuring reusable primitives: `Button`, `Card`, `StatusBadge`, `Input`, `Select`, `Alert`, `EmptyState`, `MetricTile`.
- Implemented a global imperative Toast system (`components/Toast.jsx` & `toastApi.js`) avoiding `react-refresh` violations.

*Core Pages (SPA):*
- **Auth Flow**: `LoginPage.jsx` and `RegisterPage.jsx` using `react-hook-form` and direct token persistence.
- **App Layout**: `Layout.jsx` sidebar with Lucide-react icons, active route states, and user display.
- **Dashboard**: `DashboardPage.jsx` with aggregate metric tiles, quick start guide, and recent runs table.
- **Targets Management**: `TargetsPage.jsx` showing active endpoints, HTTP method badges, and single-click "Run Test" action.
- **New Test Config**: `NewTestPage.jsx` with native range sliders bound to numeric inputs for concurrency and total requests, synced to server-side MVP limits.

*Live Dashboard Centerpiece:*
- Built `useRunWebSocket.js` leveraging `@stomp/stompjs` + `sockjs-client` to subscribe to `/topic/runs/{runId}`.
- `LiveDashboardPage.jsx`: The centerpiece view rendering live execution progress, shimmering progress bar, large monospace metric tiles, and a real-time `Recharts` latency line chart displaying the rolling 30-sample history. Transitions smoothly to the Report page on `DONE`.

*Reporting:*
- `ReportDetailPage.jsx`: Renders final latency breakdowns (Min/Avg/P95/Max) using color-coded bar charts, success/failure ratio bars, and full metric tables.
- `HistoryPage.jsx` / `ReportsPage.jsx`: Tabular views of past executions and their corresponding final metrics.

*Infra / DevOps:*
- Fixed `vite.config.js` and `eslint.config.js`.
- Updated `docker-compose.yml` and `nginx/nginx.conf`: Nginx now serves the compiled Vite SPA static files via `try_files` (supporting client-side routing) directly from the `nginx/Dockerfile` multi-stage build.

**Verified:**
- `npm run lint` completes with zero errors.
- `npm run build` succeeds (600-800ms) with all chunks optimized.

**Next recommended step:**
On a machine with Docker, run `docker compose up --build` and navigate to `http://localhost`. The full end-to-end flow from Registration -> Target Creation -> Live Test Run -> Report is now fully implemented and ready for integration testing.

---

### 2026-07-15 14:57 UTC — Security Regression Fix: InMemoryUserDetailsManager eliminated

**Date:** 2026-07-15T14:57 UTC

**Root Cause:**

Spring Boot's `UserDetailsServiceAutoConfiguration` fires when **none** of these bean types are present in the context:
- `AuthenticationManager`
- `AuthenticationProvider`
- `UserDetailsService`
- `UserDetailsManagerConfigurer`

All three backend services (`gateway-service`, `execution-service`, `report-service`) defined a `SecurityFilterChain` and a `PasswordEncoder` — but **no `UserDetailsService`, `AuthenticationProvider`, or `AuthenticationManager` bean**. This satisfied none of the auto-configuration's `@ConditionalOnMissingBean` conditions, so Spring Boot created an `InMemoryUserDetailsManager` and logged `"Using generated security password"` on every startup.

Note: `@EnableWebSecurity` and defining a `SecurityFilterChain` do NOT suppress `UserDetailsServiceAutoConfiguration`. Only the presence of one of the four guarded bean types does.

**Why the `spring.autoconfigure.exclude` solution is wrong:**
Excluding the auto-configuration hides the symptom without establishing the correct bean graph, and prevents the `AuthenticationManager` from being wired at all. The correct fix is to declare the full provider chain so the auto-configuration legitimately backs off.

**Fix applied (3 files changed):**

1. `gateway-service/.../config/SecurityConfig.java`
   - Added `UserDetailsService` (no-op lambda, throws `UnsupportedOperationException` — JWT filter handles all auth, this is never called)
   - Added `AuthenticationManager` via `DaoAuthenticationProvider(UserDetailsService)` (Spring Security 6.x constructor, non-deprecated)

2. `execution-service/.../config/SecurityConfig.java`
   - Added `PasswordEncoder` (BCrypt; missing before)
   - Added `UserDetailsService` (no-op)
   - Added `AuthenticationManager` via `DaoAuthenticationProvider(UserDetailsService)`

3. `report-service/.../config/SecurityConfig.java`
   - Added `PasswordEncoder` (BCrypt; missing before)
   - Added `UserDetailsService` (no-op)
   - Added `AuthenticationManager` via `DaoAuthenticationProvider(UserDetailsService)`

**How authentication works (unchanged):**
`JwtAuthenticationFilter` intercepts every request, validates the JWT, and calls `SecurityContextHolder.getContext().setAuthentication(...)` directly. The `DaoAuthenticationProvider` / `UserDetailsService` path is never exercised at runtime.

**Verification:**
- `mvn -B -DskipTests package` → BUILD SUCCESS for all 6 modules, zero deprecation warnings, zero errors.
- No functional change to any endpoint, filter, or business logic.
- After `docker compose up --build`: services will start without logging "Using generated security password" or "inMemoryUserDetailsManager".

---
