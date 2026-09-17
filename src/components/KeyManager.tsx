"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type KeyRow = {
  id: string;
  key_prefix: string;
  plan: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export function KeyManager({ initialKeys }: { initialKeys: KeyRow[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    setBusy("create");
    setError(null);
    const res = await fetch("/api/dashboard/keys", { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return setError(data.error || "Could not create key");
    setFresh(data.apiKey);
    router.refresh();
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Any integration using it will start getting 401s immediately.")) return;
    setBusy(id);
    setError(null);
    const res = await fetch("/api/dashboard/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return setError(data.error || "Could not revoke key");
    setKeys((ks) => ks.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)));
  }

  async function copy() {
    if (!fresh) return;
    try {
      await navigator.clipboard.writeText(fresh);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the key is selectable
    }
  }

  const active = keys.filter((k) => !k.revoked_at).length;

  return (
    <div>
      {fresh && (
        <div className="rounded-xl border p-4 mb-4" style={{ borderColor: "var(--flag)", background: "var(--flag-bg)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--flag)" }}>
            New key. Copy it now; we only store a hash and cannot show it again.
          </div>
          <div className="flex gap-2 flex-wrap">
            <code className="flex-1 min-w-0 break-all rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm">{fresh}</code>
            <button onClick={copy} className="px-4 py-2 rounded-lg text-sm font-semibold border border-[var(--border-strong)] hover:bg-[var(--bg-raised)] transition">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border px-4 py-3 text-sm mb-4" style={{ borderColor: "var(--block)", background: "var(--block-bg)", color: "var(--block)" }}>
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] overflow-hidden text-sm">
        {keys.length === 0 ? (
          <p className="px-4 py-6 text-[var(--text-faint)]">No keys yet.</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-b-0 font-mono text-[12px]">
              <span className={k.revoked_at ? "line-through text-[var(--text-faint)]" : ""}>{k.key_prefix}…</span>
              <span className="text-[var(--text-faint)] hidden sm:inline">created {new Date(k.created_at).toLocaleDateString()}</span>
              <span className="text-[var(--text-faint)] hidden md:inline">
                {k.last_used_at ? `last used ${new Date(k.last_used_at).toLocaleString()}` : "never used"}
              </span>
              <span className="ml-auto">
                {k.revoked_at ? (
                  <span className="text-[var(--text-faint)]">revoked</span>
                ) : (
                  <button
                    onClick={() => revoke(k.id)}
                    disabled={busy === k.id}
                    className="text-[var(--block)] hover:underline disabled:opacity-50"
                  >
                    {busy === k.id ? "revoking…" : "revoke"}
                  </button>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      <button
        onClick={create}
        disabled={busy === "create" || active >= 3}
        className="mt-4 px-4 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {busy === "create" ? "Creating…" : active >= 3 ? "3 active keys (limit)" : "Create new key"}
      </button>
    </div>
  );
}
