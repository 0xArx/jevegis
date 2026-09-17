export type Verdict = "allow" | "review" | "block";
export type Direction = "input" | "output" | "document";
export interface Message { role: "user" | "assistant" | "system"; content: string }
export interface FlagResult { score: number; triggered: boolean; threshold: number; level?: string }
export interface EvaluateResult {
  id: string;
  verdict: Verdict;
  reasons: string[];
  flags: Record<string, FlagResult>;
  category: { label: string; confidence: number };
  severity: { score: number; level: "none" | "low" | "medium" | "high"; confidence: number };
  target: Direction | "content";
  policy_version: string;
  model: string;
  latency_ms: number;
  usage: { input_tokens: number; output_tokens: number };
}
export interface CommonOptions { context?: string; checks?: string[]; thresholds?: Record<string, number> }
export interface ScanOptions extends CommonOptions { direction?: Direction; precedingInput?: string }
export interface ClientOptions { apiKey?: string; baseUrl?: string; timeoutMs?: number; retries?: number; fetch?: typeof fetch }

export class JevegisError extends Error { status: number; body?: unknown }
export class Jevegis {
  constructor(options?: ClientOptions);
  scan(input: string | Message[], options?: ScanOptions): Promise<EvaluateResult>;
  moderate(text: string, options?: CommonOptions): Promise<EvaluateResult>;
}
export default Jevegis;
