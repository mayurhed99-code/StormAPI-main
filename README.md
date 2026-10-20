# StormAPI

Self-hosted API load-testing and performance-monitoring platform.
See `docs/` for the full PRD, architecture, rules, and phase plan.

## Services

| Directory | Role (docs name) |
|---|---|
| `gateway-service` | Auth Service — register, login, JWT issuing |
| `execution-service` | Test Service — targets, configs, virtual-thread load execution |
| `report-service` | Metrics Service — Redis polling, WebSocket live metrics, reports |
| `common-security` | Shared JWT validation library (not a runnable app) |
| `target-api` | Bundled dummy target API (pending) |

## Build

Requires Java 21 + Maven:

```bash
mvn -DskipTests package
```

## Run

```bash
cp .env.example .env   # optional — compose ships dev-only defaults
docker compose up --build
```

Nginx listens on port 80 and routes `/api/auth/*`, `/api/test/*`,
`/api/metrics/*`, and `/ws` to the three services.
