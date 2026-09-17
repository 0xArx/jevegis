import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashApiKey } from "@/lib/apiKeys";
import { PLAN_LIMITS } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: '"apiKey" is required' }, { status: 400 });
  }

  const hash = hashApiKey(apiKey);
  const { data: keyRow } = await supabaseAdmin
    .from("api_keys")
    .select("id, key_prefix, owner_email, plan, created_at, last_used_at, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();

  if (!keyRow) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: recentScans } = await supabaseAdmin
    .from("scans")
    .select("product, direction, verdict, eval_id, reasons, latency_ms, input_tokens, created_at")
    .eq("api_key_id", keyRow.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const { count: last24h } = await supabaseAdmin
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", keyRow.id)
    .gte("created_at", dayAgo);

  return NextResponse.json({
    key: {
      prefix: keyRow.key_prefix,
      email: keyRow.owner_email,
      plan: keyRow.plan,
      createdAt: keyRow.created_at,
      lastUsedAt: keyRow.last_used_at,
      revoked: !!keyRow.revoked_at,
    },
    limits: PLAN_LIMITS[keyRow.plan] ?? PLAN_LIMITS.free,
    last24hCount: last24h ?? 0,
    recentScans: recentScans ?? [],
  });
}
