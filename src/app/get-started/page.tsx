"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";

export default function GetStarted() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create API key");
      setApiKey(data.apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create API key");
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; user can still select the text manually
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-10 py-16 max-w-lg mx-auto w-full">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">Get your API key</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
          Free tier: 500 scans a day across both the Security and Moderation APIs, no card required. Your email is
          your account: sign in with it any time to see usage, revoke this key, or create another.
        </p>

        {!apiKey ? (
          <form onSubmit={createKey} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-mono text-[var(--text-faint)] mb-2">
                EMAIL
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            {error && (
              <div
                className="rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: "var(--block)", background: "var(--block-bg)", color: "var(--block)" }}
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-3 rounded-lg font-semibold text-sm transition disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {loading ? "Generating…" : "Generate API key"}
            </button>
          </form>
        ) : (
          <div>
            <div
              className="rounded-lg border px-4 py-3 text-xs mb-4"
              style={{ borderColor: "var(--flag)", background: "var(--flag-bg)", color: "var(--flag)" }}
            >
              Save this now. We only store a hash, so we can&apos;t show it again. If you lose it, sign in and create a
              new one.
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 mb-3 font-mono text-sm break-all">
              {apiKey}
            </div>
            <button
              onClick={copyKey}
              className="w-full px-5 py-2.5 rounded-lg font-semibold text-sm border border-[var(--border-strong)] hover:bg-[var(--bg-raised)] transition mb-6"
            >
              {copied ? "Copied" : "Copy to clipboard"}
            </button>
            <div className="flex gap-3">
              <Link
                href="/docs"
                className="flex-1 text-center px-4 py-2.5 rounded-lg font-semibold text-sm transition"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Read the docs
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 text-center px-4 py-2.5 rounded-lg font-semibold text-sm border border-[var(--border-strong)] hover:bg-[var(--bg-raised)] transition"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
