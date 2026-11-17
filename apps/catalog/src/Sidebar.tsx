import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@blocos/ui";
import type { CatalogEntry } from "./types.js";

const DOMAIN_LABEL: Record<string, string> = {
  identidade: "Identidade",
  administracao: "Administracao",
  atendimento: "Atendimento",
  clinico: "Clinico",
  agenda: "Agenda",
  financeiro: "Financeiro",
  relatorios: "Relatorios",
  social: "Social",
  operacao: "Operacao",
};

export function Sidebar({
  entries,
  activeId,
  onSelect,
}: {
  entries: CatalogEntry[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = entries.filter((e) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      e.recipe.name.toLowerCase().includes(q) ||
      e.recipe.id.includes(q) ||
      e.recipe.summary.toLowerCase().includes(q) ||
      e.recipe.domain.includes(q)
    );
  });

  const grouped = React.useMemo(() => {
    const map = new Map<string, CatalogEntry[]>();
    for (const entry of filtered) {
      const list = map.get(entry.recipe.domain) ?? [];
      list.push(entry);
      map.set(entry.recipe.domain, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <aside className="bloco-scroll hidden w-[264px] shrink-0 flex-col overflow-y-auto border-r border-border bg-surface/30 md:flex">
      <div className="sticky top-0 z-10 border-b border-border bg-surface/70 px-4 py-3 backdrop-blur-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <input
            type="search"
            aria-label="Buscar bloco pelo nome ou id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar bloco..."
            className={cn(
              "h-9 w-full rounded-[var(--r-md)] border border-border bg-surface-strong/70 pl-8 pr-3 text-[13px]",
              "text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/15",
            )}
          />
        </div>
      </div>

      <nav className="flex-1 px-2 py-3">
        {grouped.length === 0 ? (
          <p className="bloco-caption px-3 py-6 text-center text-fg-faint">Nenhum bloco encontrado.</p>
        ) : null}
        {grouped.map(([domain, list]) => (
          <div key={domain} className="mb-4">
            <p className="bloco-micro px-3 pb-1.5">{DOMAIN_LABEL[domain] ?? domain}</p>
            <ul className="space-y-0.5">
              {list.map((entry) => {
                const active = entry.id === activeId;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(entry.id)}
                      className={cn(
                        "flex min-h-8 w-full flex-col items-start justify-center gap-0.5 rounded-[var(--r-sm)] px-3 py-1.5 text-left transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        active
                          ? "bg-accent-soft font-medium text-accent-ink"
                          : "text-fg-secondary hover:bg-surface-hover hover:text-fg",
                      )}
                    >
                      <span className="block truncate">{entry.recipe.name}</span>
                      <span className="bloco-caption block truncate text-[11px] text-fg-faint">
                        {entry.id}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
