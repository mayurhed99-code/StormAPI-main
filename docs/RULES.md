# StormAPI — Rules for the AI Coding Assistant

Read this before writing any code. These are hard constraints, not suggestions.

## 1. Security Rules (non-negotiable)

- **Targets may be any HTTP/HTTPS URL** — StormAPI is intended for APIs the
  user owns or is authorized to test, and is not restricted to
  private/local IP ranges. Abuse is mitigated instead by hard, server-side
  enforcement of the MVP Limits table in Architecture.md (concurrency,
  total requests, timeout, max simultaneous runs), mandatory JWT
  authentication on every run, and audit logging of who ran what against
  which target and when. These enforcement checks happen in Test Service
  on every run request — not just at target registration time.
- **Never fetch or follow a Swagger/OpenAPI URL from user input in this
  MVP.** There is no OpenAPI import feature in scope — do not add one, even
  if it seems easy, without re-checking Rules.md for SSRF handling first.
- **All outbound requests must have a hard timeout.** No exceptions. Default
  5000ms, configurable per test, capped at 30000ms max.
- Passwords: bcrypt only, never store or log plaintext.
- JWT secret comes from an environment variable, never hardcoded, never
  committed. `.env` is gitignored.
- Concurrency and total-requests inputs must have a server-side max
  (e.g. concurrency ≤ 500, total requests ≤ 50,000) regardless of what the
  UI sends — never trust client-provided limits alone.

## 2. Concurrency Rules

- Use `Executors.newVirtualThreadPerTaskExecutor()`. Never `new Thread()`,
  never a fixed platform-thread pool for request execution.
- Enforce the configured concurrency with a `Semaphore`, acquired before
  each request and released in a `finally` block. If this isn't in the
  code, the concurrency number is fake — check for it explicitly.
- Every worker task must catch its own exceptions and record a failure
  result. An uncaught exception in one virtual thread must never kill the
  test run.
- Latency samples for P95 calculation: cap the stored list size (e.g. keep
  at most 50,000 samples, or reservoir-sample beyond that) — do not let an
  unbounded list grow in Redis or memory during a large run.

## 3. Library / Version Rules

- Java 21, Spring Boot 3.x — use records for DTOs where reasonable
- Lombok is fine for entities (reduces boilerplate) — do not use it to hide
  business logic
- Do not introduce a new dependency (library, driver, tool) without it
  being traceable to a line item in Architecture.md. If something seems
  necessary and isn't listed there, stop and flag it instead of adding it.
- MySQL — use Spring Data JPA. Flyway is preferred for schema migrations,
  so schema state stays reproducible. If Flyway becomes a blocker during
  MVP implementation, manual schema creation is an acceptable fallback —
  don't burn hours fighting migrations this week.
- No deprecated Spring Security config style (no `WebSecurityConfigurerAdapter`
  — use the `SecurityFilterChain` bean approach for Spring Boot 3.x)

## 4. Error Handling Rules

- Every REST endpoint returns a consistent error shape:
  `{ "error": "string code", "message": "human readable" }` with the
  correct HTTP status — no raw stack traces returned to the client, ever
- Failed outbound test requests (timeout, connection refused, non-2xx) are
  **data**, not exceptions — they get recorded in the report as failures,
  not surfaced as 500s to the StormAPI user
- Validate all config inputs (concurrency > 0, total_requests > 0, valid
  URL format, method is one of GET/POST/PUT/DELETE/PATCH) before creating a
  test run — reject with 400, don't let bad input reach the executor

## 5. Scope Discipline Rules

- If a feature isn't in PRD.md's "Must-Have" list, don't build it without
  being asked, even if it seems like a natural addition
- Do not add OpenAPI parsing, stateful sequencing, auto-ramp stress mode,
  or workspaces unless the PRD is explicitly updated first
- When in doubt about whether something is in scope, stop and ask rather
  than guessing and building it

## 6. Testing Rules

- The bundled dummy target API must work out of the box with
  `docker compose up` — no manual seeding required for a basic demo run
- Every service needs at minimum a health-check endpoint (`/actuator/health`
  or equivalent) wired into Docker Compose `healthcheck` — Nginx and
  dependent services should not start routing before dependencies are healthy

## 7. What "Done" Means for Any Given Task

A task is not done when the code compiles. It's done when:
1. It runs via `docker compose up` with no manual steps
2. It's covered by the relevant row in PRD.md's success criteria
3. Memory.md has been updated to reflect what changed

## 8. Architecture Freeze

After Phase 0 begins:

- No additional technologies.
- No additional microservices.
- No new infrastructure.
- No architectural redesign.

Only bug fixes and implementation corrections are allowed unless a blocker
makes implementation impossible.
