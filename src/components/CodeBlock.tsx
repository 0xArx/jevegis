export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] overflow-hidden">
      {label && (
        <div className="px-4 py-2 border-b border-[var(--border)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
          {label}
        </div>
      )}
      <pre className="px-4 py-4 text-[12.5px] leading-relaxed overflow-x-auto font-mono text-[var(--text)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
