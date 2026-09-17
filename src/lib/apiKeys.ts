import { randomBytes, createHash } from "crypto";

const KEY_PREFIX = "jevegis_live_";

export function generateApiKey() {
  const raw = randomBytes(24).toString("base64url");
  const plaintext = `${KEY_PREFIX}${raw}`;
  const hash = hashApiKey(plaintext);
  const prefix = plaintext.slice(0, KEY_PREFIX.length + 6);
  return { plaintext, hash, prefix };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
