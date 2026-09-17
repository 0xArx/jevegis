import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-6 md:px-10 py-8 text-[11px] font-mono text-[var(--text-faint)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>Open source, MIT. Jevegis is a judgment layer; keep your own auth and validation underneath it.</span>
        <div className="flex gap-5">
          <Link href="/docs" className="hover:text-[var(--text)] transition">Docs</Link>
          <Link href="/get-started" className="hover:text-[var(--text)] transition">Get API key</Link>
          <Link href="/dashboard" className="hover:text-[var(--text)] transition">Dashboard</Link>
          <Link href="/terms" className="hover:text-[var(--text)] transition">Terms</Link>
          <Link href="/privacy" className="hover:text-[var(--text)] transition">Privacy</Link>
          <a href="https://github.com/0xArx/jevegis" className="hover:text-[var(--text)] transition">Source</a>
        </div>
      </div>
    </footer>
  );
}
