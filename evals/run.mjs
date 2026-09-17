// Runs every labeled case in cases.json against the live engine and reports
// verdict accuracy plus per-flag precision. Usage:
//   node --env-file=.env.local evals/run.mjs [--only <substring>] [--json]
import { readFileSync, writeFileSync } from "node:fs";
import { evaluate } from "../src/lib/engine.ts";

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const asJson = args.includes("--json");

const cases = JSON.parse(readFileSync(new URL("./cases.json", import.meta.url), "utf8")).filter(
  (c) => !only || c.name.includes(only)
);

const CONCURRENCY = 4;
const results = [];
let i = 0;
async function worker() {
  while (i < cases.length) {
    const c = cases[i++];
    const started = Date.now();
    try {
      const r = await evaluate({ target: c.target, text: c.text, context: c.context, history: c.history });
      const verdictOk = c.expect.includes(r.verdict);
      const missing = (c.must ?? []).filter((f) => !r.flags[f]?.triggered);
      const spurious = (c.mustNot ?? []).filter((f) => r.flags[f]?.triggered);
      results.push({ c, r, verdictOk, missing, spurious, ms: Date.now() - started, pass: verdictOk && !missing.length && !spurious.length });
    } catch (err) {
      results.push({ c, error: String(err), pass: false, verdictOk: false, missing: [], spurious: [], ms: Date.now() - started });
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

results.sort((a, b) => cases.indexOf(a.c) - cases.indexOf(b.c));
const passed = results.filter((x) => x.pass).length;
const verdictRight = results.filter((x) => x.verdictOk).length;
const latencies = results.filter((x) => x.r).map((x) => x.r.latency_ms).sort((a, b) => a - b);
const p50 = latencies[Math.floor(latencies.length / 2)];
const p95 = latencies[Math.floor(latencies.length * 0.95)];
const tokens = results.reduce((s, x) => s + (x.r?.usage.input_tokens ?? 0), 0);

for (const x of results) {
  const tag = x.pass ? "PASS" : "FAIL";
  const detail = x.error
    ? `error: ${x.error}`
    : `${x.r.verdict.padEnd(6)} ${String(x.r.latency_ms).padStart(5)}ms  reasons=[${x.r.reasons.join(",")}]` +
      (x.missing.length ? `  MISSING=[${x.missing}]` : "") +
      (x.spurious.length ? `  SPURIOUS=[${x.spurious}]` : "");
  console.log(`${tag}  ${x.c.name.padEnd(46)} ${detail}`);
}

const summary = {
  cases: results.length,
  passed,
  verdict_accuracy: +(verdictRight / results.length).toFixed(3),
  full_pass_rate: +(passed / results.length).toFixed(3),
  latency_p50_ms: p50,
  latency_p95_ms: p95,
  total_input_tokens: tokens,
  est_cost_usd: +((tokens / 1e6) * 0.042).toFixed(4),
  ran_at: new Date().toISOString(),
};
console.log("\n" + JSON.stringify(summary, null, 2));
if (asJson) writeFileSync(new URL("./last-run.json", import.meta.url), JSON.stringify({ summary, results: results.map((x) => ({ name: x.c.name, pass: x.pass, verdict: x.r?.verdict, reasons: x.r?.reasons, missing: x.missing, spurious: x.spurious })) }, null, 2));
process.exit(passed === results.length ? 0 : 1);
