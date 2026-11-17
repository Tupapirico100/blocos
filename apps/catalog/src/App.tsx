import * as React from "react";
import { Blocks, Layers, Sparkles } from "lucide-react";
import { ThemeProvider, Segmented, Badge, useTheme } from "@blocos/ui";
import { THEMES, DENSITIES, type ThemeName, type Density } from "@blocos/ui";
import type { BlockState } from "@blocos/core";
import { BLOCO_CATALOG } from "@blocos/blocks";
import { Sidebar } from "./Sidebar.js";
import { BlockStage } from "./BlockStage.js";
import { RecipePanel } from "./RecipePanel.js";

export function App() {
  return (
    <ThemeProvider theme="aurora" density="comfortable">
      <CatalogApp />
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

  const entry = BLOCO_CATALOG.find((e) => e.id === activeId) ?? BLOCO_CATALOG[0];

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="bloco-body">Nenhum bloco registrado.</p>
      </div>
    );
  }

  const variant = variants[entry.id] ?? entry.recipe.variants[0]?.id ?? "";
  const state = states[entry.id] ?? "success";
  const isConnected = connected[entry.id] ?? true;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar entries={BLOCO_CATALOG} activeId={entry.id} onSelect={setActiveId} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar global */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] bg-accent text-accent-fg shadow-[0_6px_18px_-8px_var(--accent)]">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="bloco-headline leading-tight">Blocos</p>
              <p className="bloco-caption text-fg-faint">
                Biblioteca de blocos reutilizaveis · design system Aurora · beta
              </p>
            </div>
            <Badge tone="accent" icon={<Sparkles className="h-3 w-3" />}>
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
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
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
          <RecipePanel entry={entry} />
        </div>

        {/* Barra de acoes disparadas */}
        <footer className="flex items-center gap-2 border-t border-border px-6 py-2">
          <Blocks className="h-3.5 w-3.5 text-fg-faint" />
          <span className="bloco-caption text-fg-faint">Acao mais recente:</span>
          <code className="bloco-mono text-[11px] text-fg-muted">
            {lastAction ?? "—"}
          </code>
        </footer>
      </div>
    </div>
  );
}
