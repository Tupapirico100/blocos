import * as React from "react";
import { Blocks, Layers, Sparkles, BookOpen, X } from "lucide-react";
import { ThemeProvider, Segmented, Badge, Button, Drawer, MotionProvider, useTheme } from "@blocos/ui";
import { THEMES, DENSITIES, type ThemeName, type Density } from "@blocos/ui";
import type { BlockState } from "@blocos/core";
import { BLOCO_CATALOG } from "@blocos/blocks";
import { Sidebar } from "./Sidebar.js";
import { BlockStage } from "./BlockStage.js";
import { RecipePanel, RecipeContent } from "./RecipePanel.js";

export function App() {
  return (
    <ThemeProvider theme="aurora" density="comfortable">
      <MotionProvider>
        <CatalogApp />
      </MotionProvider>
    </ThemeProvider>
  );
}

function CatalogApp() {
  const { theme, setTheme, density, setDensity } = useTheme();
  const [activeId, setActiveId] = React.useState(BLOCO_CATALOG[0]?.id ?? "");
  const [variants, setVariants] = React.useState<Record<string, string>>({});
  const [states, setStates] = React.useState<Record<string, BlockState>>({});
  const [connected, setConnected] = React.useState<Record<string, boolean>>({});
  const [lastAction, setLastAction] = React.useState<string | null>(null);
  const [receitaAberta, setReceitaAberta] = React.useState(false);

  const entry = BLOCO_CATALOG.find((e) => e.id === activeId) ?? BLOCO_CATALOG[0];

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="bloco-body">Nenhum bloco registrado.</p>
      </div>
    );
  }

  // a variacao ESCOLHIDA pelo dono e o padrao; as demais ficam na biblioteca
  const variant =
    variants[entry.id] ?? entry.recipe.defaultVariant ?? entry.recipe.variants[0]?.id ?? "";
  const state = states[entry.id] ?? "success";
  const isConnected = connected[entry.id] ?? true;

  const catalogo = (
    <BlockStage
      entry={entry}
      variant={variant}
      onVariantChange={(v) => setVariants((s) => ({ ...s, [entry.id]: v }))}
      state={state}
      onStateChange={(v) => setStates((s) => ({ ...s, [entry.id]: v }))}
      connected={isConnected}
      onToggleConnected={(v) => setConnected((s) => ({ ...s, [entry.id]: v }))}
      onAction={(action, payload) =>
        setLastAction(`${action}${payload ? ` ${JSON.stringify(payload).slice(0, 80)}` : ""}`)
      }
    />
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar entries={BLOCO_CATALOG} activeId={entry.id} onSelect={setActiveId} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar global */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-accent text-accent-fg shadow-[0_6px_18px_-8px_var(--accent)]">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <h1 className="bloco-headline leading-tight">Blocos</h1>
              <p className="bloco-caption truncate text-fg-faint" title="Biblioteca de blocos reutilizaveis · design system Aurora · beta">
                Biblioteca de blocos reutilizaveis · design system Aurora · beta
              </p>
            </div>
            <Badge tone="accent" icon={<Sparkles className="h-3 w-3" />} className="hidden sm:inline-flex">
              {BLOCO_CATALOG.length} blocos
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              value={theme}
              onChange={(v) => setTheme(v as ThemeName)}
              options={THEMES.map((t) => ({ value: t.value, label: t.label, hint: t.hint }))}
            />
            <Segmented
              size="sm"
              value={density}
              onChange={(v) => setDensity(v as Density)}
              options={DENSITIES.map((d) => ({ value: d.value, label: d.label, hint: d.hint }))}
            />
            <Button
              size="sm"
              variant="outline"
              icon={<BookOpen className="h-3.5 w-3.5" />}
              onClick={() => setReceitaAberta(true)}
              className="xl:hidden"
            >
              Receita
            </Button>
          </div>
        </header>

        {/* Navegacao no mobile (a sidebar some abaixo de md) */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
          <Blocks className="h-4 w-4 shrink-0 text-fg-faint" />
          <select
            value={entry.id}
            onChange={(e) => setActiveId(e.target.value)}
            aria-label="Escolher bloco"
            className="h-9 min-w-0 flex-1 rounded-[var(--r-md)] border border-border bg-surface-strong/70 px-2 text-[13px] text-fg focus:border-accent focus:outline-none"
          >
            {BLOCO_CATALOG.map((e) => (
              <option key={e.id} value={e.id}>
                {e.recipe.name}
              </option>
            ))}
          </select>
        </div>

        <main className="flex min-h-0 flex-1">
          {catalogo}
          <div className="hidden xl:flex">
            <RecipePanel entry={entry} />
          </div>
        </main>

        {/* Barra de acoes disparadas */}
        <footer className="flex items-center gap-2 border-t border-border px-4 py-2 sm:px-6">
          <Blocks className="h-3.5 w-3.5 shrink-0 text-fg-faint" />
          <span className="bloco-caption shrink-0 text-fg-faint">Acao mais recente:</span>
          <code aria-live="polite" className="bloco-mono truncate text-[11px] text-fg-muted">
            {lastAction ?? "—"}
          </code>
        </footer>
      </div>

      {/* Receita em drawer no mobile/tablet */}
      <Drawer open={receitaAberta} onOpenChange={setReceitaAberta} title="A receita do bloco">
        <RecipeContent entry={entry} />
      </Drawer>
    </div>
  );
}
