import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateApiKey } from "@/lib/apiKeys";
import { MAX_KEYS_PER_EMAIL } from "@/lib/limits";
import { validateTypesafeKey } from "@/lib/typesafe";
import { seal } from "@/lib/secretBox";

export const runtime = "nodejs";

async function requireEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() ?? null;
}

async function readTypesafeKey(request: Request): Promise<{ key: string } | { error: NextResponse }> {
  let body: { typesafeApiKey?: string };
  try {
    body = await request.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }
  const key = body.typesafeApiKey?.trim();
  if (!key) return { error: NextResponse.json({ error: "Your TypeSafe API key is required." }, { status: 400 }) };
  const valid = await validateTypesafeKey(key);
  if (!valid.ok) return { error: NextResponse.json({ error: valid.reason }, { status: 400 }) };
  return { key };
}

// Create a new Jevegis key for the signed-in account, linked to their TypeSafe key.
export async function POST(request: Request) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const ts = await readTypesafeKey(request);
  if ("error" in ts) return ts.error;

  const { count } = await supabaseAdmin
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("owner_email", email)
    .is("revoked_at", null);
  if ((count ?? 0) >= MAX_KEYS_PER_EMAIL) {
    return NextResponse.json({ error: `You already have ${MAX_KEYS_PER_EMAIL} active keys. Revoke one first.` }, { status: 409 });
  }

  const { plaintext, hash, prefix } = generateApiKey();
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .insert({ key_hash: hash, key_prefix: prefix, owner_email: email, plan: "free", typesafe_key_enc: seal(ts.key), typesafe_linked_at: new Date().toISOString() })
    .select("id, key_prefix, plan, created_at, last_used_at, revoked_at, typesafe_linked_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "Could not create key" }, { status: 500 });
  return NextResponse.json({ apiKey: plaintext, key: data });
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

// Re-link a different TypeSafe key to one of the account's Jevegis keys.
export async function PATCH(request: Request) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const clone = request.clone();
  const ts = await readTypesafeKey(request);
  if ("error" in ts) return ts.error;
  const { id } = (await clone.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: '"id" is required' }, { status: 400 });

  const linkedAt = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .update({ typesafe_key_enc: seal(ts.key), typesafe_linked_at: linkedAt })
    .eq("id", id)
    .eq("owner_email", email)
    .is("revoked_at", null)
    .select("id");
  if (error) return NextResponse.json({ error: "Could not update key" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Key not found" }, { status: 404 });
  return NextResponse.json({ ok: true, typesafe_linked_at: linkedAt });
}
