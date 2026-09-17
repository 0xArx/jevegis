import { supabaseAdmin } from "./supabaseAdmin";

const PLAN_LIMITS: Record<string, { perMinute: number; perDay: number }> = {
  free: { perMinute: 20, perDay: 500 },
  pro: { perMinute: 120, perDay: 50_000 },
};

export interface RateLimitResult {
  ok: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

export async function checkRateLimit(apiKeyId: string, plan: string): Promise<RateLimitResult> {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const now = Date.now();
  const minuteAgo = new Date(now - 60_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();

  const [minuteResult, dayResult] = await Promise.all([
    supabaseAdmin.from("scans").select("id", { count: "exact", head: true }).eq("api_key_id", apiKeyId).gte("created_at", minuteAgo),
    supabaseAdmin.from("scans").select("id", { count: "exact", head: true }).eq("api_key_id", apiKeyId).gte("created_at", dayAgo),
  ]);

  if ((minuteResult.count ?? 0) >= limits.perMinute) {
    return { ok: false, reason: `Rate limit exceeded: ${limits.perMinute} requests/minute on the ${plan} plan`, retryAfterSeconds: 60 };
  }
  if ((dayResult.count ?? 0) >= limits.perDay) {
    return { ok: false, reason: `Daily quota exceeded: ${limits.perDay} requests/day on the ${plan} plan`, retryAfterSeconds: 86_400 };
  }
  return { ok: true };
}

export { PLAN_LIMITS };
