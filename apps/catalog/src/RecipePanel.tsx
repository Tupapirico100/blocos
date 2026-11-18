import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Tabs, TabPanel, Badge, cn } from "@blocos/ui";
import type { CatalogEntry } from "./types.js";

export function RecipePanel({ entry }: { entry: CatalogEntry }) {
  return (
    <aside className="bloco-scroll flex w-[340px] shrink-0 flex-col overflow-y-auto border-l border-border bg-surface/30">
      <RecipeContent entry={entry} />
    </aside>
  );
}

/** Conteudo da receita, sem o invólucro de painel (para uso dentro de Drawer). */
export function RecipeContent({ entry }: { entry: CatalogEntry }) {
  const recipe = entry.recipe;
  const [copied, setCopied] = React.useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="border-b border-border px-4 py-4">
        <p className="bloco-micro">A receita do bloco</p>
        <p className="bloco-headline mt-1.5">Como montar em um programa novo</p>
        {recipe.defaultVariant ? (
          <div className="mt-3 rounded-[var(--r-md)] border border-accent/25 bg-accent-soft px-3 py-2.5">
            <p className="bloco-micro text-accent-ink">Variacao escolhida</p>
            <p className="bloco-headline mt-1 text-fg">
              {recipe.variants.find((v) => v.id === recipe.defaultVariant)?.label ?? recipe.defaultVariant}
            </p>
            <p className="bloco-caption mt-1 text-fg-secondary">
              {recipe.variants.find((v) => v.id === recipe.defaultVariant)?.intent}
            </p>
            {recipe.variants.length > 1 ? (
              <p className="bloco-caption mt-1.5 text-fg-muted">
                Alternativas na biblioteca: {recipe.variants.filter((v) => v.id !== recipe.defaultVariant).map((v) => v.label).join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Tabs
        className="gap-0"
        value="acoes"
        onChange={() => {}}
        items={[
          { value: "acoes", label: "Acoes" },
          { value: "portas", label: "Portas" },
          { value: "conectores", label: "Conectores" },
          { value: "regras", label: "Regras" },
          { value: "origem", label: "Origem" },
        ]}
      >
        <TabPanel value="acoes" className="px-4 py-4">
          <p className="bloco-caption mb-3">
            A mesma acao serve para a UI, para HTTP e para o agente. O schema fica no core, nunca no componente.
          </p>
          <ul className="space-y-2.5">
            {recipe.actions.map((a) => (
              <li key={a.id} className="rounded-[var(--r-md)] border border-border bg-surface/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <code className="bloco-mono text-[12px] font-medium text-accent-ink">{a.id}</code>
                  {a.readOnly ? <Badge tone="info">leitura</Badge> : null}
                </div>
                <p className="bloco-callout mt-1.5 font-medium text-fg">{a.title}</p>
                <p className="bloco-caption mt-1">{a.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.http ? (
                    <Badge tone="neutral">
                      {a.http.method} {a.http.path}
                    </Badge>
                  ) : null}
                  {a.permissions?.map((p) => (
                    <Badge key={p} tone="outline">
                      {p}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </TabPanel>

        <TabPanel value="portas" className="px-4 py-4">
          <p className="bloco-caption mb-3">
            Onde a logica entra. Troque a implementacao, o bloco nao muda.
          </p>
          <ul className="space-y-2.5">
            {recipe.ports.map((p) => (
              <li key={p.id} className="rounded-[var(--r-md)] border border-border bg-surface/60 p-3">
                <code className="bloco-mono text-[12px] font-medium text-accent-ink">{p.id}</code>
                <p className="bloco-callout mt-1.5 font-medium text-fg">{p.label}</p>
                <p className="bloco-caption mt-1">{p.contract}</p>
                <ul className="mt-2 space-y-0.5">
                  {p.methods.map((m) => (
                    <li key={m} className="bloco-mono text-[11px] text-fg-muted">
                      {m}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </TabPanel>

        <TabPanel value="conectores" className="px-4 py-4">
          <p className="bloco-caption mb-3">
            Somente o dono da plataforma provisiona. O bloco so enxerga o slot.
          </p>
          <ul className="space-y-2.5">
            {recipe.connectors.map((c) => (
              <li key={c.id} className="rounded-[var(--r-md)] border border-border bg-surface/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="bloco-mono text-[12px] font-medium text-accent-ink">{c.id}</code>
                  <Badge tone={c.ownerOnly === false ? "neutral" : "warn"}>
                    {c.ownerOnly === false ? "livre" : "somente dono"}
                  </Badge>
                </div>
                <p className="bloco-callout mt-1.5 font-medium text-fg">{c.label}</p>
                <p className="bloco-caption mt-1">{c.description}</p>
                {c.env?.length ? (
                  <ul className="mt-2 space-y-0.5">
                    {c.env.map((env) => (
                      <li key={env} className="bloco-mono text-[11px] text-fg-muted">
                        {env}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </TabPanel>

        <TabPanel value="regras" className="px-4 py-4">
          <ul className="space-y-2">
            {recipe.rules.map((r, i) => (
              <li key={i} className="flex gap-2.5 rounded-[var(--r-md)] bg-surface/60 p-3">
                <span className="mt-0.5 text-[13px] text-fg-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="bloco-callout text-fg-secondary">{r}</span>
              </li>
            ))}
          </ul>
        </TabPanel>

        <TabPanel value="origem" className="px-4 py-4">
          <p className="bloco-caption mb-3">De onde o bloco foi extraido.</p>
          <ul className="space-y-1.5">
            {recipe.origins.map((o) => (
              <li key={o} className="bloco-mono rounded-[var(--r-sm)] bg-surface/60 px-2.5 py-2 text-[11px] text-fg-secondary">
                {o}
              </li>
            ))}
          </ul>
          <button
            onClick={() => copy(JSON.stringify(recipe, null, 2))}
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border px-2.5 py-1.5 text-[12px]",
              "text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg",
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Receita copiada" : "Copiar receita (JSON)"}
          </button>
        </TabPanel>
      </Tabs>
    </>
  );
}
