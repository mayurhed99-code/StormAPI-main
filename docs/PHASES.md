# StormAPI — Implementation Phases (3-Day Plan)

Work through these in order. Do not start a phase until the previous one's
"Definition of Done" is met. Update Memory.md at the end of every phase.

---

## Phase 0 — Skeleton & Infra (Day 1, morning)

**Goal:** All containers start and talk to each other. No business logic yet.

- [ ] Repo structure: `auth-service/`, `test-service/`, `metrics-service/`,
      `frontend/`, `dummy-target/`, `docker-compose.yml`, `nginx/`
- [ ] Each Spring Boot service boots with a `/actuator/health` endpoint
- [ ] MySQL + Redis containers running with healthchecks
- [ ] Nginx routes `/api/auth/*`, `/api/test/*`, `/api/metrics/*` to the
      three services, and `/` to the frontend
- [ ] `docker compose up` brings up all 8 containers cleanly

**Definition of Done:** `curl localhost/api/auth/actuator/health` (and the
other two) return 200 through Nginx, from a fresh `docker compose up`.

---

## Phase 1 — Auth (Day 1, midday)

- [ ] `users` table + Flyway migration
- [ ] `POST /register`, `POST /login` → JWT issued
- [ ] Shared `JWT_SECRET` env var wired into all three services
- [ ] Auth filter (validates JWT, rejects with 401) reusable across services
- [ ] Frontend: login/register page, stores JWT, attaches to requests

**Definition of Done:** Can register + log in through the actual UI and get
a valid JWT that's accepted by a protected endpoint on Test Service.

---

## Phase 2 — API Targets & Test Config (Day 1, afternoon)

- [ ] `api_targets`, `test_configs` tables + migrations
- [ ] `POST /targets` accepting any HTTP/HTTPS URL, with **MVP limits
      (concurrency/requests/timeout/simultaneous runs) enforced
      server-side** per Architecture.md's MVP Limits table
- [ ] `POST /test-configs` with concurrency/total-requests bounds enforced
- [ ] Bundled `dummy-target` service: a trivial endpoint with a small
      artificial delay, so load tests have something realistic to hit
- [ ] Frontend: form to register a target, form to configure a test

**Definition of Done:** Can register the bundled dummy target and create a
test config through the UI, rejected correctly if concurrency/requests/
timeout exceed the MVP Limits table in Architecture.md.

---

## Phase 3 — Execution Engine (Day 2, morning — the core of the project)

- [ ] `test_runs` table + migration
- [ ] Virtual-thread executor, `Semaphore`-bounded concurrency
- [ ] Per-request timeout enforced, failures recorded not thrown
- [ ] Live counters written to Redis during the run
      (`completed`, `failures`, latency samples)
- [ ] `POST /test-runs/{configId}/start` kicks off execution async, returns
      immediately with a `run_id`

**Definition of Done:** Firing a test at concurrency=100 against the dummy
target completes, and Redis shows accurate live counters mid-run
(verifiable with `redis-cli` while it runs).

---

## Phase 4 — Live Metrics & WebSocket (Day 2, afternoon)

- [ ] Metrics Service polls Redis every 1s for the active run
- [ ] WebSocket topic per run_id, pushes `{completed, total, avgLatency,
      failures}` to subscribed clients
- [ ] Frontend: live dashboard, progress bar, running numbers updating
      without refresh

**Definition of Done:** Start a run from the UI, watch numbers update live
without polling/refreshing the page, run completes and the WebSocket stops
pushing.

---

## Phase 5 — Report Persistence & History (Day 2, evening / Day 3, morning)

- [ ] On run completion, Metrics Service computes avg/min/max/P95/RPS from
      final Redis data, writes `test_reports` row, marks run DONE
- [ ] `GET /reports` (list, per user) and `GET /reports/{id}` (detail)
- [ ] Frontend: history list page, detail view with the final numbers

**Definition of Done:** After a run finishes, its report appears in history
with correct numbers matching what was observed live.

---

## Phase 6 — Polish & Deploy Rehearsal (Day 3, afternoon)

- [ ] Full `docker compose up` from a clean checkout, no manual steps,
      demo run works end-to-end
- [ ] Basic frontend styling pass (see Design.md) — not pixel-perfect, just
      not embarrassing
- [ ] README with setup instructions and an architecture diagram
- [ ] (If time remains) rehearse the same Compose file on an EC2 instance

**Definition of Done:** You can do the full demo flow (register → configure
→ run at concurrency 100+ → live metrics → report → history) on a machine
that has never seen this project before, using only `docker compose up`.

---

## If You Fall Behind

Cut in this order, latest-cut-first is highest priority to protect:
1. History/report polish (fine to be ugly)
2. Frontend styling (functional > pretty)
3. P95 calculation (fall back to avg/min/max)
4. Historical report list (skip if truly out of time)

**Never cut:** the Semaphore-bounded concurrency, the WebSocket live
updates, or the bundled dummy target. Those three are what make the demo
real instead of a screenshot.
