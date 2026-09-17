import { NextResponse } from "next/server";
import { demoRateLimit } from "@/lib/limits";
import { parseEvaluateRequest, runEvaluate } from "@/lib/request";

export const runtime = "nodejs";

// Unauthenticated playground endpoint for the landing page demo.
export async function POST(request: Request) {
  if (!(await demoRateLimit(request, "demo", 10))) {
    return NextResponse.json({ error: "Demo limit reached. Get a free API key for more." }, { status: 429 });
  }
  const parsed = await parseEvaluateRequest(request, "moderation");
  if ("error" in parsed) return parsed.error;
  const out = await runEvaluate(parsed.input);
  return "error" in out ? out.error : NextResponse.json(out.result);
}
