// Production URL, in order of preference:
// 1. explicit NEXT_PUBLIC_SITE_URL (set once we have the real domain)
// 2. Vercel's per-deployment URL
// 3. localhost for dev
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "") ||
  "http://localhost:4950";
