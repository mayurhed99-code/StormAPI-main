# StormAPI — Design Guidelines

This is a developer tool, not a consumer product. Optimize for "looks like
a real internal dashboard," not "looks like a marketing site." Function
over decoration — the concurrency numbers updating live are the visual
centerpiece, not layout flourishes.

## 1. Palette

Dark, technical, dashboard-style — this suits a "load testing / infra tool"
identity and hides the fact that you didn't spend time on visual polish.

- Background: `#0B0F14` (near-black, slight blue)
- Surface / cards: `#131922`
- Border: `#1F2A37`
- Text primary: `#E6EDF3`
- Text secondary: `#8B98A5`
- Accent (primary actions, active states): `#3B82F6` (blue)
- Success: `#22C55E`
- Failure: `#EF4444`
- Warning (approaching limits): `#F59E0B`

## 2. Typography

- UI font: system stack — `-apple-system, "Segoe UI", Roboto, sans-serif`
- Numeric/metric display font: a monospace face —
  `"JetBrains Mono", "SF Mono", Consolas, monospace`
  Use monospace specifically for the live numbers (latency, RPS, counts) —
  it reads as "technical/precise" and prevents digits from jittering the
  layout as they update.
- Scale: 24px page titles, 16px body, 13px secondary/labels, 32px for the
  hero metric numbers on the live dashboard

## 3. Core Screens (only these — nothing else needed for MVP)

1. **Login / Register** — single card, centered, minimal
2. **Targets list** — table: name, base URL, method, "New Test" button
3. **New Test Config** — form: target dropdown, concurrency (number input,
   consider a slider capped at the server-enforced max), total requests,
   timeout, "Run" button
4. **Live Run Dashboard** — the centerpiece screen:
   - Large progress bar (completed / total)
   - 4 large monospace stat tiles: avg latency, success rate, RPS, failures
   - A simple live-updating line or bar chart of latency over time
     (Chart.js or Recharts — whichever is already in the stack)
   - Status badge: RUNNING / DONE, color-coded
5. **Report Detail** — same stat tiles, static, plus P95/min/max
6. **History List** — table: target name, date, concurrency, avg latency,
   success rate, link to detail

## 4. Interaction Notes

- No polling anywhere in the UI except the deliberate WebSocket connection
  for live runs — the point of this project is proving you don't need to poll
- Numbers on the live dashboard should update in place (no layout shift) —
  reserve fixed-width space for digits
- Disable the "Run" button and show a spinner state while a run is active;
  don't allow starting a second run against the same target concurrently
  in the UI (even though the backend could technically handle it — keep the
  demo simple)
- Failure states (target unreachable, validation rejected) shown as a clear
  inline error, not a silent failure

## 5. Explicitly Skip

- No dark/light theme toggle — pick dark, ship it
- No animations beyond basic transitions (progress bar fill, number
  count-up is optional nice-to-have, not required)
- No custom icon set — use a single icon library already available
  (e.g. lucide-react) sparingly
- No responsive/mobile layout effort — this is a desktop dev-tool demo
