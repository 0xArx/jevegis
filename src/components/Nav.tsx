import Link from "next/link";

const LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Nav() {
  return (
    <header className="border-b border-[var(--border)] px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur">
      <Link href="/" className="flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 3 6v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V6l-9-4z"
            stroke="var(--accent)"
            strokeWidth="1.8"
            fill="rgba(109,91,255,0.15)"
          />
        </svg>
        <span className="font-semibold tracking-tight text-lg">Jevegis</span>
      </Link>
      <nav className="hidden sm:flex items-center gap-6 text-sm text-[var(--text-muted)]">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-[var(--text)] transition">
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-xs font-mono text-[var(--text-faint)] border border-[var(--border)] rounded-full px-3 py-1">
          powered by jev-latest
        </span>
        <Link
          href="/get-started"
          className="px-4 py-2 rounded-lg font-semibold text-sm transition"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Get API key
        </Link>
      </div>
    </header>
  );
}
