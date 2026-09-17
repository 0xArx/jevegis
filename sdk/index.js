const DEFAULT_BASE_URL = "https://jevegis.vercel.app";

export class JevegisError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "JevegisError";
    this.status = status;
    this.body = body;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Jevegis {
  constructor({ apiKey = process.env.JEVEGIS_API_KEY, baseUrl = process.env.JEVEGIS_BASE_URL || DEFAULT_BASE_URL, timeoutMs = 15000, retries = 2, fetch: f = globalThis.fetch } = {}) {
    if (!apiKey) throw new JevegisError("Missing API key. Pass { apiKey } or set JEVEGIS_API_KEY.", 0);
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.fetch = f;
  }

  /**
   * Security scan. `input` is a string (with optional opts.direction), or an
   * OpenAI-style messages array (last message judged, rest = context).
   */
  scan(input, opts = {}) {
    const body = Array.isArray(input) ? { messages: input, ...opts } : { text: input, ...opts };
    return this.#post("/api/v1/scan", body);
  }

  /** Trust & safety check for a single piece of user-generated content. */
  moderate(text, opts = {}) {
    return this.#post("/api/v1/moderate", { text, ...opts });
  }

  async #post(path, body) {
    let attempt = 0;
    for (;;) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      let res;
      try {
        res = await this.fetch(this.baseUrl + path, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        if (attempt++ < this.retries) { await sleep(300 * 2 ** attempt); continue; }
        throw new JevegisError(`Network error: ${err.message}`, 0);
      }
      clearTimeout(timer);

      const data = await res.json().catch(() => ({}));
      if (res.ok) return data;

      const retryable = res.status === 429 || res.status === 502 || res.status === 503;
      if (retryable && attempt++ < this.retries) {
        const after = Number(res.headers.get("retry-after"));
        await sleep(after && after < 30 ? after * 1000 : 300 * 2 ** attempt);
        continue;
      }
      throw new JevegisError(data.error || `Request failed with ${res.status}`, res.status, data);
    }
  }
}

export default Jevegis;
