# Contributing

Jevegis is small on purpose. The whole detection engine is one file: `src/lib/engine.ts`.

## Adding or improving a guardrail

1. Add a check to the `CHECKS` array in `src/lib/engine.ts`. Give it a phrasing for each target it applies to (`input`, `output`, `document`, `content`) and explicit `true` / `false` criteria. Criteria are what stop false positives; write the `false` side carefully (fiction, security research, a user's own data, refusals).
2. Add labeled cases to `evals/cases.json`: at least one that must trigger the flag and one look-alike that must not.
3. Run `npm run eval`. Do not open a PR that lowers the pass rate.

## Running locally

```bash
cp .env.example .env.local   # fill in TypeSafe + Supabase
npm install
npm run dev -- --port 4950
```

Apply `supabase/schema.sql` to your Supabase project first.

## Ground rules

- No em dashes in user-facing copy.
- Never log the text being scanned; log scores only.
- The free playground endpoints spend real inference credits; keep their rate limits.
