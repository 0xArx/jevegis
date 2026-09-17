#!/usr/bin/env node
import { Jevegis, JevegisError } from "./index.js";

const HELP = `jevegis — guardrails for LLM apps in one call

Usage:
  jevegis scan [options] "<text>"          check user input (default)
  jevegis scan --output "<model reply>"    check a model's draft reply
  jevegis scan --document "<text>"         check a retrieved doc / tool result
  jevegis moderate "<text>"                trust & safety check for UGC
  echo "text" | jevegis scan               read text from stdin

Options:
  --context "<what your app does>"   sharpens judgments
  --json                             raw JSON response
  -h, --help

Env:
  JEVEGIS_API_KEY   required. Get one: https://jevegis.vercel.app/get-started
  JEVEGIS_BASE_URL  optional override`;

const args = process.argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  console.log(HELP);
  process.exit(0);
}

const cmd = args.shift();
const opts = {};
let json = false;
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--output") opts.direction = "output";
  else if (a === "--document") opts.direction = "document";
  else if (a === "--json") json = true;
  else if (a === "--context") opts.context = args[++i];
  else positional.push(a);
}

async function readStdin() {
  if (process.stdin.isTTY) return "";
  let s = "";
  for await (const chunk of process.stdin) s += chunk;
  return s.trim();
}

const text = positional.join(" ") || (await readStdin());
if (!text) {
  console.error("No text given.\n");
  console.log(HELP);
  process.exit(2);
}

const color = (c, s) => (process.stdout.isTTY ? `\x1b[${c}m${s}\x1b[0m` : s);
const VERDICT = { allow: ["32", "ALLOW"], review: ["33", "REVIEW"], block: ["31", "BLOCK"] };

try {
  const client = new Jevegis();
  const result = cmd === "moderate" ? await client.moderate(text, opts) : await client.scan(text, opts);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const [c, label] = VERDICT[result.verdict];
    console.log(`${color(c, label)}  ${result.latency_ms}ms  severity:${result.severity.level}  category:${result.category.label}`);
    if (result.reasons.length) console.log(`reasons: ${result.reasons.join(", ")}`);
    const flags = Object.entries(result.flags).sort((a, b) => b[1].score - a[1].score);
    for (const [id, f] of flags) {
      const bar = "█".repeat(Math.round(f.score * 20)).padEnd(20, "·");
      console.log(`  ${id.padEnd(30)} ${f.triggered ? color("31", bar) : bar} ${f.score.toFixed(2)}${f.level ? `  ${f.level}` : ""}`);
    }
  }
  process.exit(result.verdict === "block" ? 1 : 0);
} catch (err) {
  if (err instanceof JevegisError) {
    console.error(`error${err.status ? ` (${err.status})` : ""}: ${err.message}`);
    process.exit(3);
  }
  throw err;
}
