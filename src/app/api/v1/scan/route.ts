import { NextResponse } from "next/server";
import { authenticate, logScan } from "@/lib/apiAuth";
import { parseEvaluateRequest, runEvaluate } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;
  const parsed = await parseEvaluateRequest(request, "security");
  if ("error" in parsed) return parsed.error;
  const out = await runEvaluate(parsed.input);
  if ("error" in out) return out.error;
  await logScan(auth.key.id, "security", out.result);
  return NextResponse.json(out.result);
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
