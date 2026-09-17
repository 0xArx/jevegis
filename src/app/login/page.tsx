"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/browser";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") === "link" ? "That link expired or was already used. Request a new one." : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-inset)] p-6 text-sm">
        <div className="font-semibold mb-2">Check your inbox</div>
        <p className="text-[var(--text-muted)] leading-relaxed">
          We sent a sign-in link to <span className="font-mono text-[var(--text)]">{email}</span>. It works once and
          expires in an hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs font-mono text-[var(--text-faint)] mb-2">
          EMAIL
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition"
        />
      </div>
      {error && (
        <div role="alert" className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--block)", background: "var(--block-bg)", color: "var(--block)" }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-5 py-3 rounded-lg font-semibold text-sm transition disabled:opacity-50"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {loading ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-full flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-10 py-16 max-w-md mx-auto w-full">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">Sign in</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
          No password. We email you a link. Use the same email you created your API keys with and they will be
          waiting in your dashboard.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
