import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateApiKey } from "@/lib/apiKeys";
import { demoRateLimit, MAX_KEYS_PER_EMAIL } from "@/lib/limits";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!(await demoRateLimit(request, "keys", 5))) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const { count } = await supabaseAdmin
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("owner_email", email)
    .is("revoked_at", null);
  if ((count ?? 0) >= MAX_KEYS_PER_EMAIL) {
    return NextResponse.json({ error: `This email already has ${MAX_KEYS_PER_EMAIL} active keys` }, { status: 409 });
  }

  const { plaintext, hash, prefix } = generateApiKey();

  const { error } = await supabaseAdmin.from("api_keys").insert({
    key_hash: hash,
    key_prefix: prefix,
    owner_email: email,
    plan: "free",
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create API key" }, { status: 500 });
  }

  return NextResponse.json({ apiKey: plaintext, prefix, plan: "free" });
}
