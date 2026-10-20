# StormAPI — Architecture

## 1. Tech Stack (final)

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.x |
| Security | Spring Security + JWT |
| Database | **MySQL** (not Postgres) |
| Cache / live state | Redis |
| Concurrency | Java 21 Virtual Threads (`Executors.newVirtualThreadPerTaskExecutor()`) |
| Realtime | Spring WebSocket (STOMP) |
| Frontend | React + Vite |
| Gateway | Nginx (reverse proxy only) |
| Containers | Docker + Docker Compose |
| Build | Maven |
| Deploy target | Single Ubuntu EC2, Docker Compose — identical to local |

No Kubernetes, no Spring Cloud Gateway, no message broker, no service mesh.

## 2. Services (three, not more)

> **Repository naming note (implementation):** the repo directories predate the
> service renames in this document. Mapping:
> `gateway-service/` = **Auth Service**, `execution-service/` = **Test Service**,
> `report-service/` = **Metrics Service**, `target-api/` = **dummy-target**.
> A shared `common-security/` library module holds the JWT filter/validation
> code. A root aggregator `pom.xml` builds all modules
> (`mvn -DskipTests package`); each service still ships its own Dockerfile
> (built from the repo root context so `common-security` is included).
> All services share the single `stormapi` MySQL schema; each service runs its
> own Flyway migrations against its own history table
> (`flyway_history_auth` / `flyway_history_execution` / `flyway_history_report`)
> with `baseline-on-migrate=true, baseline-version=0`.

### Auth Service
- Register, login, JWT issuing, JWT validation, user profile
- Owns the `users` table in MySQL
- Nothing else touches user credentials

### Test Service
*(renamed from "Execution Service")*
- Register API targets (any HTTP/HTTPS URL — the platform is intended for
  APIs the user owns or is authorized to test; abuse is mitigated via the
  MVP Limits below and the validation/audit rules in Rules.md, not by
  restricting targets to private IPs)
- Create test configurations
- Execute the load test using virtual threads
- Write live counters to Redis (`test:{id}:completed`, `test:{id}:failures`,
  running latency sum, etc.)
- Uses the shared `common-security` module to validate JWTs. Does not
  manage users or issue tokens — that's Auth Service's job. Does **not**
  persist final reports.

### Metrics Service
*(renamed from "Report Service")*
- Polls Redis for the running test's counters (poll every 1s — no pub/sub for MVP)
- Streams progress to the frontend via WebSocket
- On test completion, computes final aggregates (avg/min/max/P95/RPS) and
  persists the report to MySQL
- Serves historical report queries

## 3. Auth Model Across Services (resolves the biggest gap in the draft)

Decision: **gateway-trusted headers**, not per-service JWT validation.

- Nginx routes all `/api/*` traffic to the appropriate service
- Auth Service validates the JWT on any authenticated request path and
  forwards it; **or**, simpler for MVP: every service validates the JWT
  itself using a shared `JWT_SECRET` environment variable (same secret,
  injected into all three services via Compose)
- **Chosen for MVP: shared-secret validation in each service.** A shared
  `common-security` module contains the JWT parsing and validation
  utilities; all three services depend on this module rather than each
  carrying its own copy-pasted filter class. This avoids a fragile
  trust-header setup, keeps the filter logic in one place, and still lets
  you say "each service independently authorizes requests" in an interview.

## 4. Data Flow — Running a Test

```
User (React) → Nginx → Test Service
                            │
                            ├─ validates target URL format + enforces
                            │  MVP limits (concurrency/requests/timeout)
                            ├─ creates job row (status=RUNNING) in MySQL
                            ├─ spawns virtual-thread pool bounded by
                            │  a Semaphore(concurrency)
                            ├─ fires requests, each result written to
                            │  Redis counters (INCR / atomic ops)
                            │
                            ▼
                         Redis (live counters only, no permanent data)
                            ▲
                            │  polled every 1s
                            │
Metrics Service ───────────┘
     │
     ├─ pushes progress over WebSocket to React dashboard
     └─ on completion: reads final counters, computes P95 from stored
        latency samples, writes final report row to MySQL, marks job DONE
```

## 5. Database Schema (MySQL)

```
users
  id, email, password_hash, created_at

api_targets
  id, user_id, name, base_url, method, headers_json, body_template, created_at

test_configs
  id, api_target_id, concurrency, total_requests, timeout_ms, created_at

test_runs
  id, test_config_id, status, started_at, ended_at

test_reports
  id, test_run_id, avg_latency_ms, min_latency_ms, max_latency_ms,
  p95_latency_ms, success_count, failure_count, rps, created_at
```

Redis keys (all ephemeral, TTL'd or cleared on job completion):
```
test:{run_id}:completed        (counter)
test:{run_id}:failures         (counter)
test:{run_id}:latencies        (list, capped — see Rules.md)
test:{run_id}:status           (string)
```

## 6. Docker Compose Topology

```
nginx           → routes to frontend, auth-service, test-service, metrics-service
frontend        → React/Vite build
auth-service    → Spring Boot
test-service    → Spring Boot
metrics-service → Spring Boot
mysql           → single instance, all services connect (separate schemas
                   per service is a v2 nicety, not MVP-critical)
redis           → single instance
dummy-target    → trivial bundled API for demoing load tests against
```

One command: `docker compose up`. All 8 containers, no external dependencies.

## 7. Concurrency Model Detail

- `Semaphore(concurrency)` gates how many requests are in flight at once —
  this is what actually enforces "concurrency=100," not just how many
  virtual threads exist
- Each request submitted to `Executors.newVirtualThreadPerTaskExecutor()`
  acquires the semaphore, sends the request with a hard timeout
  (`HttpClient` request timeout, default 5s, configurable per test), releases
  the semaphore, records the result
- A timed-out or connection-refused request counts as a failure, not a
  crash — this must not throw uncaught exceptions inside worker threads

## 8. MVP Limits (hard caps — enforced server-side)

| Limit | Value |
|---|---|
| Concurrency per run | ≤ 250 |
| Maximum requests per run | ≤ 10,000 |
| Maximum timeout | ≤ 30s |
| Maximum simultaneous runs | 2 |
| Authentication | JWT only |
| Roles | USER only |
| Deployment | Single EC2 |
| Microservices | Exactly 3 |

These caps exist so any HTTP/HTTPS target can be accepted without the
platform doubling as a stress/DDoS tool. They are the actual abuse
mitigation for the MVP now that targets are no longer restricted to
private/local IP ranges — do not raise them without updating this table.

## 9. What Was Deliberately Rejected (and why)

| Rejected | Why |
|---|---|
| Redis pub/sub for live updates | Polling is simpler, ships in 3 days, still demonstrates Redis usage |
| Per-service JWT via gateway header trust | Shared-secret validation is one filter, less to debug |
| Kafka/RabbitMQ between services | No queueing need at this scale; adds infra with no payoff |
| Kubernetes | Wrong tool for a single EC2 instance |
| Workspaces / multi-tenancy | Adds a data model layer with no interview value at this scope |
| Auto-ramp stress mode | Real complexity (breakpoint detection) for marginal demo value |
