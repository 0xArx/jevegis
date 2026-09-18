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
  typesafe_linked_at: string | null;
};

const TS_URL = "https://console.typesafe.ai/settings/keys";

function TypesafeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-mono text-[var(--text-faint)] mb-1.5">
        YOUR TYPESAFE API KEY{" "}
        <a href={TS_URL} target="_blank" rel="noreferrer" className="underline" style={{ color: "var(--accent)" }}>
          get one
        </a>
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="apikey_…"
        autoComplete="off"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--accent)] transition"
      />
      <p className="text-[11px] text-[var(--text-faint)] mt-1.5">
        Your scans run on your TypeSafe account. We encrypt this at rest and never show it again.
      </p>
    </div>
  );
}

export function KeyManager({ initialKeys }: { initialKeys: KeyRow[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tsKey, setTsKey] = useState("");
  const [relinkId, setRelinkId] = useState<string | null>(null);
  const [relinkKey, setRelinkKey] = useState("");

  async function create() {
    setBusy("create");
    setError(null);
    const res = await fetch("/api/dashboard/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typesafeApiKey: tsKey }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return setError(data.error || "Could not create key");
    setFresh(data.apiKey);
    setKeys((ks) => [data.key as KeyRow, ...ks]);
    setCreating(false);
    setTsKey("");
    router.refresh();
  }

  async function relink(id: string) {
    setBusy(id);
    setError(null);
    const res = await fetch("/api/dashboard/keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, typesafeApiKey: relinkKey }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return setError(data.error || "Could not update key");
    setKeys((ks) => ks.map((k) => (k.id === id ? { ...k, typesafe_linked_at: data.typesafe_linked_at } : k)));
    setRelinkId(null);
    setRelinkKey("");
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
            <div key={k.id} className="border-b border-[var(--border)] last:border-b-0">
              <div className="flex items-center gap-4 px-4 py-3 font-mono text-[12px] flex-wrap">
                <span className={k.revoked_at ? "line-through text-[var(--text-faint)]" : ""}>{k.key_prefix}…</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={
                    k.typesafe_linked_at
                      ? { background: "var(--safe-bg)", color: "var(--safe)" }
                      : { background: "var(--block-bg)", color: "var(--block)" }
                  }
                >
                  {k.typesafe_linked_at ? "TypeSafe linked" : "no TypeSafe key"}
                </span>
                <span className="text-[var(--text-faint)] hidden md:inline">
                  {k.last_used_at ? `last used ${new Date(k.last_used_at).toLocaleString()}` : "never used"}
                </span>
                <span className="ml-auto flex gap-4">
                  {k.revoked_at ? (
                    <span className="text-[var(--text-faint)]">revoked</span>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setRelinkId(relinkId === k.id ? null : k.id);
                          setRelinkKey("");
                        }}
                        className="text-[var(--accent)] hover:underline"
                      >
                        {k.typesafe_linked_at ? "relink" : "link TypeSafe key"}
                      </button>
                      <button onClick={() => revoke(k.id)} disabled={busy === k.id} className="text-[var(--block)] hover:underline disabled:opacity-50">
                        {busy === k.id ? "…" : "revoke"}
                      </button>
                    </>
                  )}
                </span>
              </div>
              {relinkId === k.id && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                  <TypesafeField value={relinkKey} onChange={setRelinkKey} />
                  <button
                    onClick={() => relink(k.id)}
                    disabled={busy === k.id || !relinkKey.trim()}
                    className="self-start px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {busy === k.id ? "Verifying…" : "Save"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {creating ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-inset)] p-4 flex flex-col gap-3">
          <TypesafeField value={tsKey} onChange={setTsKey} />
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={busy === "create" || !tsKey.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {busy === "create" ? "Verifying with TypeSafe…" : "Create key"}
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg text-sm border border-[var(--border-strong)]">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          disabled={active >= 3}
          className="mt-4 px-4 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {active >= 3 ? "3 active keys (limit)" : "Create new key"}
        </button>
      )}
    </div>
  );
}
