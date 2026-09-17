import { createHash } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";

export const MAX_TEXT_LENGTH = 8000;
export const MAX_KEYS_PER_EMAIL = 3;

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

/**
 * Durable per-IP throttle for the unauthenticated playground and key issuance.
 * Stored in Postgres so it survives serverless cold starts. IPs are hashed.
 * Fails open on a database error: a broken throttle should not take the demo down.
 */
export async function demoRateLimit(request: Request, scope: string, max: number, windowSeconds = 60): Promise<boolean> {
  const ipHash = createHash("sha256").update(`${scope}:${clientIp(request)}`).digest("hex").slice(0, 32);
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  try {
    const { count, error } = await supabaseAdmin
      .from("demo_hits")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (error) throw error;
    if ((count ?? 0) >= max) return false;
    await supabaseAdmin.from("demo_hits").insert({ ip_hash: ipHash });
    return true;
  } catch (err) {
    console.error("demo rate limit unavailable", err);
    return true;
  }
}
