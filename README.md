# StormAPI

StormAPI is a self-hosted API load-testing and monitoring demo app built with Java 21, Spring Boot, React, MySQL, Redis, and Docker Compose. It lets a user register/login, define API targets, build test configurations, run concurrent HTTP load tests, watch live progress over WebSocket, and review the final report with latency and throughput metrics.

This project is designed as a portfolio/interview-grade implementation rather than a production SaaS platform. The goal is to demonstrate real backend engineering work: JWT auth, server-side validation, concurrency control, Redis-backed metrics, and a multi-service architecture behind a single Nginx gateway.

## What the app does

- Register and log in with JWT-based auth
- Store and manage API targets owned by the authenticated user
- Create a test configuration with concurrency, request count, and timeout
- Run realistic concurrent HTTP requests using Java 21 virtual threads
- Enforce server-side limits such as max concurrency, request count, timeout, and simultaneous runs
- Poll Redis for live counters during execution
- Stream live progress to the dashboard over WebSocket
- Persist final results to MySQL as a historical report
- Serve a React frontend for login, dashboard, history, targets, and live run view

## Architecture

The system is split into a few services:

- `gateway-service` — authentication and user management
- `execution-service` — API target management, test configs, and load-test execution
- `report-service` — Redis polling, WebSocket live metrics, and report persistence
- `common-security` — shared JWT validation utilities used across services
- `target-api` — bundled dummy API for demonstration/testing
- `frontend` — React + Vite UI
- `nginx` — reverse proxy + SPA hosting
- `mysql` — main data store
- `redis` — live metrics counter state

High-level flow:

```text
Browser
  ↓
Nginx (port 80)
  ├─ /api/auth/*  → gateway-service
  ├─ /api/test/*  → execution-service
  ├─ /api/metrics/* → report-service
  └─ /ws          → report-service WebSocket

execution-service → MySQL + Redis
report-service    → Redis + MySQL + WebSocket
```

## Tech stack

- Java 21
- Spring Boot 3.x
- Spring Security + JWT
- MySQL 8.4
- Redis 7
- React 19 + Vite
- Nginx
- Docker + Docker Compose
- Maven multi-module build

## Project structure

```text
StormAPI-main/
├── README.md
├── pom.xml                  # root Maven aggregator
├── docker-compose.yml       # full local stack
├── .env.example             # env template
├── common-security/         # shared JWT/security library
├── gateway-service/         # auth + user service
├── execution-service/       # targets/configs/runs/execution
├── report-service/          # metrics/reporting service
├── target-api/              # dummy target API used by demos
├── frontend/                # React application
├── nginx/                  # reverse proxy config
├── docs/                   # PRD, architecture, design, rules, phases
├── scripts/
└── LICENSE
```

## Prerequisites

For the default Docker-based setup:

- Docker
- Docker Compose
- Java 21 + Maven only if you want to build outside Docker or troubleshoot services locally

## Quick start

From the repository root:

```bash
cp .env.example .env

docker compose up --build
```

Then open:

- http://localhost/

The app will start these services:

- MySQL
- Redis
- gateway-service
- execution-service
- report-service
- target-api
- nginx
- frontend static bundle served via nginx

## Typical user flow

1. Open the app and register a user
2. Log in
3. Add an API target
4. Create a test configuration with concurrency and request count
5. Start a load test
6. Watch live metrics in the dashboard over WebSocket
7. Open the final report to review latency, percentile, and throughput results

## Core endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Test targets and configs

- `POST /api/test/targets`
- `GET /api/test/targets`
- `GET /api/test/targets/{id}`
- `DELETE /api/test/targets/{id}`
- `POST /api/test/configs/targets/{targetId}`
- `GET /api/test/configs`
- `GET /api/test/configs/{id}`

### Runs and execution

- `POST /api/test/runs/{configId}/start`
- `GET /api/test/runs`
- `GET /api/test/runs/{id}`

### Reports and metrics

- `GET /api/metrics/reports`
- `GET /api/metrics/reports/{id}`
- WebSocket endpoint: `/ws`

## Environment variables

From `.env.example`:

```env
JWT_SECRET=change-me-to-a-long-random-string-at-least-32-bytes
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=stormapi
MYSQL_USER=stormapi
MYSQL_PASSWORD=stormapi
```

The JWT secret is shared across services so they can validate the same tokens.

## Build and run without Docker

Root aggregator build:

```bash
mvn -DskipTests package
```

This builds the shared library and the backend modules. Each service also contains its own Spring Boot app and can be run individually with Maven or IDE support, but the project is intended to be launched using the Docker Compose setup for the full experience.

## Project constraints and intent

This implementation is intentionally scoped to a single-user, self-hosted demo environment:

- JWT-only auth
- one MySQL instance shared across services
- one Redis instance for live metrics
- max concurrency and total requests enforced server-side
- max two simultaneous runs
- demo target is bundled locally

It is not designed for public multi-tenant SaaS deployment or large-scale production load generation.

## Documentation

The repo also includes deeper design and planning docs:

- `docs/PRD.md` — product requirements and goals
- `docs/ARCHITECTURE.md` — service design and data flow
- `docs/DESIGN.md` — UI and product structure
- `docs/RULES.md` — constraints and behavior rules
- `docs/PHASES.md` — milestone plan for the implementation

## Notes

- There is no seed user created automatically; create an account from the UI.
- The app expects the target API to be one you control or are authorized to test.
- The app is a portfolio project for demonstrating load-test logic and service architecture, not a commercial load-testing platform.
