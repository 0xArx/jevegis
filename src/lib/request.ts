import { NextResponse } from "next/server";
import { evaluate, EngineInputError, type EvaluateInput, type Message, type Target } from "./engine";
import { MAX_TEXT_LENGTH } from "./limits";

type Parsed = { input: EvaluateInput } | { error: NextResponse };

const bad = (message: string): Parsed => ({ error: NextResponse.json({ error: message }, { status: 400 }) });

/**
 * Accepts either { text, direction } or an OpenAI-style { messages } array.
 * With messages, the last one is judged and the rest become history; its role
 * decides the direction, so callers can pass the same array they send their LLM.
 */
export async function parseEvaluateRequest(request: Request, product: "security" | "moderation"): Promise<Parsed> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON body");
  }

  let text = typeof body.text === "string" ? body.text.trim() : "";
  let history: Message[] | undefined;
  let target: Target = product === "moderation" ? "content" : "input";

  if (product === "security") {
    const direction = body.direction;
    if (direction !== undefined && direction !== "input" && direction !== "output" && direction !== "document") {
      return bad('"direction" must be "input", "output", or "document"');
    }
    if (direction) target = direction;

    if (Array.isArray(body.messages)) {
      const messages = body.messages.filter(
        (m): m is Message =>
          !!m && typeof m === "object" && typeof (m as Message).content === "string" &&
          ["user", "assistant", "system"].includes((m as Message).role)
      );
      if (!messages.length) return bad('"messages" must contain at least one { role, content } entry');
      const last = messages[messages.length - 1];
      text = last.content.trim();
      history = messages.slice(0, -1);
      if (!direction) target = last.role === "assistant" ? "output" : "input";
    }

    const preceding = body.preceding_input ?? body.precedingInput;
    if (!history && typeof preceding === "string" && preceding.trim()) {
      history = [{ role: "user", content: preceding.trim() }];
    }
  }

  if (!text) return bad('Provide "text"' + (product === "security" ? ' or "messages"' : ""));
  if (text.length > MAX_TEXT_LENGTH) return bad(`Text must be under ${MAX_TEXT_LENGTH} characters`);

  const thresholds = body.thresholds;
  if (thresholds !== undefined && (typeof thresholds !== "object" || thresholds === null || Array.isArray(thresholds))) {
    return bad('"thresholds" must be an object like { "prompt_injection": 0.4 }');
  }
  const checks = body.checks;
  if (checks !== undefined && (!Array.isArray(checks) || checks.some((c) => typeof c !== "string"))) {
    return bad('"checks" must be an array of check ids');
  }

  return {
    input: {
      target,
      text,
      context: typeof body.context === "string" ? body.context.slice(0, 500) : undefined,
      history,
      thresholds: thresholds as Record<string, number> | undefined,
      checks: checks as string[] | undefined,
    },
  };
}

export async function runEvaluate(input: EvaluateInput) {
  try {
    return { result: await evaluate(input) };
  } catch (err) {
    if (err instanceof EngineInputError) {
      return { error: NextResponse.json({ error: err.message }, { status: 400 }) };
    }
    console.error(err);
    return { error: NextResponse.json({ error: "Upstream judgment failed. Safe to retry." }, { status: 502 }) };
  }
}
