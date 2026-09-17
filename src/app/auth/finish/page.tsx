"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AuthFinish() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      router.replace("/login?error=link");
      return;
    }
    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) setFailed(true);
        else router.replace("/dashboard");
      });
  }, [router]);

  return (
    <main className="min-h-full flex items-center justify-center p-10 text-sm text-[var(--text-muted)] font-mono">
      {failed ? "That link expired. Request a new one from /login." : "Signing you in…"}
    </main>
  );
}
