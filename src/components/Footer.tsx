import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-6 md:px-10 py-8 text-[11px] font-mono text-[var(--text-faint)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>Jevegis is a judgment layer. Keep your own auth and input validation underneath it.</span>
        <div className="flex gap-5">
          <Link href="/docs" className="hover:text-[var(--text)] transition">Docs</Link>
          <Link href="/get-started" className="hover:text-[var(--text)] transition">Get API key</Link>
          <Link href="/dashboard" className="hover:text-[var(--text)] transition">Dashboard</Link>
          <Link href="/terms" className="hover:text-[var(--text)] transition">Terms</Link>
          <Link href="/privacy" className="hover:text-[var(--text)] transition">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
