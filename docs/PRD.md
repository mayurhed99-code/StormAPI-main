# StormAPI — Product Requirements Document (PRD)

## 1. What This Is

StormAPI is a self-hosted API load-testing and performance-monitoring platform.
A user registers an API endpoint they own or control, configures a concurrent
load test (concurrency level, total requests), runs it, watches live metrics
stream in over WebSocket, and reviews a persisted report afterward.

This is a **portfolio / interview project**, not a commercial product. The
primary goal is to demonstrate backend engineering competence — specifically
**concurrent request handling under load** — through a real, working system.

## 2. Explicit Non-Goals

StormAPI is **not**:
- A penetration testing or fuzzing tool
- A DDoS / stress tool for arbitrary third-party URLs
- A multi-tenant SaaS product
- Feature-complete load testing software (it does not compete with k6/JMeter)

## 3. Target User

A single developer (you) testing APIs they own, running locally or on a
single EC2 instance. Not designed for public multi-user traffic.

## 4. Core User Flow

1. Register → Login (JWT issued)
2. Register an API target (name, base URL, method, headers, body template)
   - StormAPI accepts HTTP/HTTPS URLs. The platform is intended for APIs the
     user owns or is authorized to test. To prevent abuse, the MVP enforces
     maximum concurrency, maximum requests per run, maximum duration,
     authentication, audit logging, and server-side validation (see
     Rules.md, Security section, and the MVP Limits table in Architecture.md).
3. Create a load test configuration: concurrency, total requests, timeout
4. Run the test
5. Watch live metrics update via WebSocket: progress, running avg latency,
   success/failure counts
6. View the final report: avg/min/max latency, P95, success rate, RPS
7. Browse historical reports

## 5. Must-Have Features (MVP)

- [ ] JWT-based registration/login (single service)
- [ ] Register an API target (any HTTP/HTTPS URL), guarded by enforced
      MVP limits (concurrency, requests, duration, auth, audit logging —
      see Architecture.md MVP Limits table)
- [ ] Create a load test config (concurrency, total requests, per-request timeout)
- [ ] Execute the test using Java 21 virtual threads, concurrency genuinely
      bounded by a semaphore (not just a UI label)
- [ ] Live progress via WebSocket (polling Redis is acceptable — no pub/sub required)
- [ ] Final report persisted in MySQL: avg/min/max latency, P95, success %, RPS
- [ ] Historical report list + detail view
- [ ] A bundled dummy target API in Docker Compose so the whole system is
      demoable with one command, no external dependencies

## 6. Explicitly Out of Scope for MVP

- Auto-ramping / stress-mode (auto-increasing concurrency to find breakpoint)
- Stateful request sequencing (e.g. POST then DELETE using the returned ID)
- OpenAPI/Swagger spec parsing and auto-generation of test cases
- Complex schema support (nested objects, `$ref`, `oneOf`)
- Auth-on-target (target APIs requiring their own bearer tokens)
- Workspaces / multi-user teams (single-owner model only)
- Kafka, RabbitMQ, Elasticsearch, Prometheus, Grafana, Kubernetes, CI/CD

If time runs short, cut in this order: workspaces concept → historical
report polish → P95 calculation (fall back to avg/min/max only). Never cut
concurrency control or live WebSocket updates — that is the point of the project.

## 7. Success Criteria

The MVP is "done" when, from a clean `docker compose up`:
1. You can register, log in, register the bundled dummy target
2. Configure a run at concurrency=100, total requests=2000
3. Watch live metrics stream in the dashboard
4. See a final report with accurate latency percentiles
5. All of the above survives a fresh `docker compose up` with no manual steps

## 8. Interview Narrative

The one sentence to be able to say out loud:

> "StormAPI lets you load-test an API you own with real concurrency control
> using Java virtual threads, with live metrics streamed over WebSocket and
> a three-service architecture behind Nginx."

Everything in this PRD exists to make that sentence true and demoable.
