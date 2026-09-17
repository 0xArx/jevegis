import Link from "next/link";
import { Nav } from "@/components/Nav";

export default function NotFound() {
  return (
    <div className="min-h-full flex flex-col">
      <Nav />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="font-mono text-[var(--accent)] text-sm mb-3">404</div>
        <h1 className="text-2xl font-bold mb-3">This page slipped through the firewall.</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">It does not exist, or never did.</p>
        <Link href="/" className="px-5 py-2.5 rounded-lg font-semibold text-sm" style={{ background: "var(--accent)", color: "#fff" }}>
          Back to home
        </Link>
      </main>
    </div>
  );
}
