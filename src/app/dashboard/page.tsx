import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PLAN_LIMITS } from "@/lib/rateLimit";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { KeyManager, type KeyRow } from "@/components/KeyManager";

export const dynamic = "force-dynamic";

type ScanRow = {
  api_key_id: string;
  product: "security" | "moderation";
  direction: string;
  verdict: "allow" | "review" | "block";
  reasons: string[] | null;
  latency_ms: number;
  created_at: string;
};

const VERDICT_COLOR: Record<string, string> = { allow: "var(--safe)", review: "var(--flag)", block: "var(--block)" };

type Loaded = Awaited<ReturnType<typeof loadDashboard>>;

async function loadDashboard(email: string) {
  const { data: keys } = await supabaseAdmin
    .from("api_keys")
    .select("id, key_prefix, plan, created_at, last_used_at, revoked_at")
    .eq("owner_email", email)
    .order("created_at", { ascending: false });

  const keyIds = (keys ?? []).map((k) => k.id);
  const now = Date.now();
  const since = new Date(now - 30 * 86_400_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();

  const [{ data: recent }, { count: last24h }] = keyIds.length
    ? await Promise.all([
        supabaseAdmin
          .from("scans")
          .select("api_key_id, product, direction, verdict, reasons, latency_ms, created_at")
          .in("api_key_id", keyIds)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(50),
        supabaseAdmin.from("scans").select("id", { count: "exact", head: true }).in("api_key_id", keyIds).gte("created_at", dayAgo),
      ])
    : [{ data: [] as ScanRow[] }, { count: 0 }];

  return { keys: (keys ?? []) as KeyRow[], scans: (recent ?? []) as ScanRow[], last24h: last24h ?? 0 };
}



export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const email = user.email.toLowerCase();

  const { keys, scans, last24h }: Loaded = await loadDashboard(email);
  const blocked = scans.filter((s) => s.verdict === "block").length;
  const reviewed = scans.filter((s) => s.verdict === "review").length;
  const plan = keys[0]?.plan ?? "free";
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const prefixById = Object.fromEntries(keys.map((k) => [k.id, k.key_prefix]));

  return (
    <div className="min-h-full flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-10 py-14 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)] font-mono">{email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm px-4 py-2 rounded-lg border border-[var(--border-strong)] hover:bg-[var(--bg-raised)] transition">
              Sign out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            ["Last 24h", `${last24h} / ${limits.perDay}`],
            ["Plan", plan],
            ["Blocked (30d)", String(blocked)],
            ["Sent to review (30d)", String(reviewed)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[var(--border)] p-4">
              <div className="text-[10px] font-mono uppercase text-[var(--text-faint)] mb-1">{label}</div>
              <div className="font-mono text-lg capitalize">{value}</div>
            </div>
          ))}
        </div>

        <section className="mb-12">
          <h2 className="text-sm font-semibold mb-3">API keys</h2>
          <KeyManager initialKeys={keys} />
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3">Recent scans</h2>
          {scans.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)]">No scans yet. Make your first call from the docs.</p>
          ) : (
            <div className="rounded-xl border border-[var(--border)] overflow-x-auto text-sm">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.7fr_2fr_0.6fr] bg-[var(--bg-raised)] font-mono text-[10px] uppercase tracking-wide text-[var(--text-faint)] px-4 py-2.5">
                  <span>Time</span><span>Key</span><span>Endpoint</span><span>Verdict</span><span>Reasons</span><span>Latency</span>
                </div>
                {scans.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.7fr_2fr_0.6fr] px-4 py-2.5 border-t border-[var(--border)] font-mono text-[11.5px] items-center">
                    <span className="text-[var(--text-faint)]">{new Date(s.created_at).toLocaleString()}</span>
                    <span className="text-[var(--text-faint)] truncate">{prefixById[s.api_key_id]?.slice(-6) ?? "?"}</span>
                    <span>{s.product === "security" ? `scan/${s.direction}` : "moderate"}</span>
                    <span className="font-semibold uppercase" style={{ color: VERDICT_COLOR[s.verdict] }}>{s.verdict}</span>
                    <span className="text-[var(--text-muted)] truncate">{(s.reasons ?? []).join(", ") || "none"}</span>
                    <span className="text-[var(--text-faint)]">{s.latency_ms}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
