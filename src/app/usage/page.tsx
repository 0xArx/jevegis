"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";

type UsageResponse = {
  key: { prefix: string; email: string; plan: string; createdAt: string; lastUsedAt: string | null; revoked: boolean };
  limits: { perMinute: number; perDay: number };
  last24hCount: number;
  recentScans: {
    product: "security" | "moderation";
    direction: "input" | "output";
    verdict: "allow" | "review" | "block";
    latency_ms: number;
    input_tokens: number;
    created_at: string;
  }[];
};

const VERDICT_COLOR: Record<string, string> = {
  allow: "var(--safe)",
  review: "var(--flag)",
  block: "var(--block)",
};

export default function UsagePage() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageResponse | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not look up usage");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not look up usage");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-10 py-16 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">Usage</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
          Paste your API key to see your recent activity. Nothing is stored server-side about you beyond the key
          itself and the scans it made.
        </p>

        <form onSubmit={lookup} className="flex gap-3 mb-10">
          <input
            type="password"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="jevegis_live_…"
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-2.5 text-sm font-mono outline-none focus:border-[var(--accent)] transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50 shrink-0"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {loading ? "Looking up…" : "Look up"}
          </button>
        </form>

        {error && (
          <div
            className="rounded-lg border px-4 py-3 text-sm mb-8"
            style={{ borderColor: "var(--block)", background: "var(--block-bg)", color: "var(--block)" }}
          >
            {error}
          </div>
        )}

        {data && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="text-[10px] font-mono uppercase text-[var(--text-faint)] mb-1">Key</div>
                <div className="font-mono text-sm">{data.key.prefix}…</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="text-[10px] font-mono uppercase text-[var(--text-faint)] mb-1">Plan</div>
                <div className="font-mono text-sm capitalize">{data.key.plan}</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="text-[10px] font-mono uppercase text-[var(--text-faint)] mb-1">Last 24h</div>
                <div className="font-mono text-sm">
                  {data.last24hCount} / {data.limits.perDay}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="text-[10px] font-mono uppercase text-[var(--text-faint)] mb-1">Status</div>
                <div className="font-mono text-sm" style={{ color: data.key.revoked ? "var(--block)" : "var(--safe)" }}>
                  {data.key.revoked ? "Revoked" : "Active"}
                </div>
              </div>
            </div>

            <h2 className="text-sm font-semibold mb-3">Recent scans (last 30 days)</h2>
            {data.recentScans.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)]">No scans yet.</p>
            ) : (
              <div className="rounded-xl border border-[var(--border)] overflow-hidden text-sm">
                <div className="grid grid-cols-5 bg-[var(--bg-raised)] font-mono text-[10px] uppercase tracking-wide text-[var(--text-faint)] px-4 py-2.5">
                  <span>Time</span>
                  <span>Product</span>
                  <span>Direction</span>
                  <span>Verdict</span>
                  <span>Latency</span>
                </div>
                {data.recentScans.map((s, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 px-4 py-2.5 border-t border-[var(--border)] font-mono text-[11.5px]"
                  >
                    <span className="text-[var(--text-faint)]">{new Date(s.created_at).toLocaleString()}</span>
                    <span>{s.product}</span>
                    <span>{s.direction}</span>
                    <span style={{ color: VERDICT_COLOR[s.verdict] }} className="font-semibold uppercase">
                      {s.verdict}
                    </span>
                    <span className="text-[var(--text-faint)]">{s.latency_ms}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
