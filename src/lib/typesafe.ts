import { TypeSafeClient } from "@typesafe-ai/sdk";
import { createHash } from "crypto";

const clients = new Map<string, TypeSafeClient>();

/** One client per distinct customer key, cached by hash so keys never sit in map keys. */
export function typesafeClient(apiKey: string): TypeSafeClient {
  const id = createHash("sha256").update(apiKey).digest("hex");
  let c = clients.get(id);
  if (!c) {
    if (clients.size > 500) clients.clear();
    c = new TypeSafeClient({ apiKey });
    clients.set(id, c);
  }
  return c;
}

export const TYPESAFE_KEYS_URL = "https://console.typesafe.ai/settings/keys";

/** Cheapest possible real call to prove a key works before we store it. */
export async function validateTypesafeKey(apiKey: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!/^apikey_[A-Za-z0-9_]{20,}$/.test(apiKey.trim())) {
    return { ok: false, reason: "That does not look like a TypeSafe key. They start with apikey_." };
  }
  try {
    await new TypeSafeClient({ apiKey: apiKey.trim() }).systemOne({
      state: "ok",
      questions: { nonempty: { type: "noul", instructions: "Is `state` non-empty?" } },
    });
    return { ok: true };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401 || status === 403) return { ok: false, reason: "TypeSafe rejected this key. Check it at console.typesafe.ai/settings/keys." };
    return { ok: false, reason: "Could not reach TypeSafe to verify the key. Try again in a moment." };
  }
}
