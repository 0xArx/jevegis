import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateApiKey } from "@/lib/apiKeys";
import { MAX_KEYS_PER_EMAIL } from "@/lib/limits";

export const runtime = "nodejs";

async function requireEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() ?? null;
}

// Create a new key for the signed-in account.
export async function POST() {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { count } = await supabaseAdmin
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("owner_email", email)
    .is("revoked_at", null);
  if ((count ?? 0) >= MAX_KEYS_PER_EMAIL) {
    return NextResponse.json({ error: `You already have ${MAX_KEYS_PER_EMAIL} active keys. Revoke one first.` }, { status: 409 });
  }

  const { plaintext, hash, prefix } = generateApiKey();
  const { error } = await supabaseAdmin.from("api_keys").insert({ key_hash: hash, key_prefix: prefix, owner_email: email, plan: "free" });
  if (error) return NextResponse.json({ error: "Could not create key" }, { status: 500 });
  return NextResponse.json({ apiKey: plaintext, prefix });
}

// Revoke one of the signed-in account's keys.
export async function DELETE(request: Request) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: '"id" is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("owner_email", email)
    .is("revoked_at", null)
    .select("id");
  if (error) return NextResponse.json({ error: "Could not revoke key" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Key not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
