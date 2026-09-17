import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PKCE links arrive as ?code=...; implicit links arrive as #access_token=...
// The fragment never reaches the server, so those fall through to /auth/finish,
// which reads the hash in the browser. Fragments survive the redirect.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/dashboard", url.origin));
    return NextResponse.redirect(new URL("/login?error=link", url.origin));
  }
  return NextResponse.redirect(new URL("/auth/finish", url.origin));
}
