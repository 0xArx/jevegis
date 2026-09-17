export const MAX_TEXT_LENGTH = 8000;
export const MAX_KEYS_PER_EMAIL = 3;

const hits = new Map<string, number[]>();

// In-memory, so per-instance only. Enough to stop casual abuse of the free
// playground; the authenticated API is limited in Postgres instead.
export function demoRateLimit(request: Request, max = 10, windowMs = 60_000): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}
