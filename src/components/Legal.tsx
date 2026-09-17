import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string][] }) {
  return (
    <div className="min-h-full flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-10 py-14 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">{title}</h1>
        <p className="text-xs font-mono text-[var(--text-faint)] mb-10">Last updated {updated}</p>
        {sections.map(([h, body]) => (
          <section key={h} className="mb-8">
            <h2 className="font-semibold mb-2">{h}</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-line">{body}</p>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
