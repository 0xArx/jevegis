import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";
import { hashApiKey } from "./apiKeys";
import { checkRateLimit } from "./rateLimit";
import type { EvaluateResult } from "./engine";

export interface AuthedKey {
  id: string;
  plan: string;
}

export async function authenticate(request: Request): Promise<{ key: AuthedKey } | { error: NextResponse }> {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { error: NextResponse.json({ error: "Missing Authorization: Bearer <api_key> header" }, { status: 401 }) };
  }

  const hash = hashApiKey(match[1].trim());
  const { data: keyRow, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, plan, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();

  if (error || !keyRow || keyRow.revoked_at) {
    return { error: NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 }) };
  }

  const rate = await checkRateLimit(keyRow.id, keyRow.plan);
  if (!rate.ok) {
    return {
      error: NextResponse.json(
        { error: rate.reason },
        { status: 429, headers: rate.retryAfterSeconds ? { "Retry-After": String(rate.retryAfterSeconds) } : undefined }
      ),
    };
  }

  return { key: { id: keyRow.id, plan: keyRow.plan } };
}

export async function logScan(apiKeyId: string, product: "security" | "moderation", result: EvaluateResult) {
  // Logging must never fail a scan that already succeeded.
  const results = await Promise.allSettled([
    supabaseAdmin.from("scans").insert({
      api_key_id: apiKeyId,
      product,
      eval_id: result.id,
      direction: result.target,
      verdict: result.verdict,
      reasons: result.reasons,
      signals: result.flags,
      latency_ms: result.latency_ms,
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
    }),
    supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKeyId),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("scan log failed", r.reason);
    else if (r.value.error) console.error("scan log failed", r.value.error);
  }
}
