# Jevegis

Guardrails for LLM apps in one API call. Security (prompt injection, jailbreaks,
credential/PII leaks, unauthorized actions, malicious code, indirect injection in
retrieved documents) and Trust & Safety moderation, both powered by TypeSafe's Jev
typed-judgment model — calibrated probabilities, no generated text, ~1s per call.

## Architecture

- **`src/lib/engine.ts`** — the whole detection engine. One declarative `CHECKS`
  array (each check knows how to phrase itself per target: input / output /
  document / content). `evaluate()` builds one Jev request, applies thresholds,
  and returns `{ verdict, reasons, flags, category, severity }`.
- **`src/lib/request.ts`** — parses `{ text }`, `{ direction }`, `{ messages }`
  (OpenAI-style; last message judged, rest = context), `thresholds`, `checks`.
- **`src/lib/apiAuth.ts`** — bearer-key auth (SHA-256 hashed), Postgres rate limit,
  usage logging (best-effort, never fails a scan).
- **Routes**: `/api/v1/{scan,moderate}` (authenticated, logged),
  `/api/{scan,moderate}` (unauthenticated playground for the landing demo),
  `/api/keys` (self-serve key issuance), `/api/usage` (per-key dashboard data).
- **Pages**: `/` landing, `/docs`, `/get-started`, `/usage`.

## Supabase

Project `jevegis` (ref `tqjlsexokfnyqoklyqzt`). Tables: `api_keys`, `scans`.
Schema in `supabase/schema.sql`. Keys/URL in `.env.local`.

## Run

```bash
node node_modules/next/dist/bin/next dev --port 4950
```

Env: `TYPESAFE_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
optional `NEXT_PUBLIC_SITE_URL`.

## Positioning

The 2025 acquisitions (Lakera→Check Point, Robust Intelligence→Cisco, Prompt
Security→SentinelOne, Protect AI→Palo Alto) left the standalone guardrail market
enterprise-only and demo-gated. Jevegis is the self-serve, published-price,
probabilities-not-booleans alternative for developers shipping an LLM feature today.
