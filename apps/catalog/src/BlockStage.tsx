import * as React from "react";
import { Cable, Eye, PlugZap } from "lucide-react";
import { Segmented, Button, Badge } from "@blocos/ui";
import type { BlockState } from "@blocos/core";
import type { CatalogEntry } from "./types.js";

const STATE_OPTIONS: Array<{ value: BlockState; label: string }> = [
  { value: "success", label: "Normal" },
  { value: "loading", label: "Carregando" },
  { value: "empty", label: "Vazio" },
  { value: "error", label: "Erro" },
  { value: "forbidden", label: "Sem permissao" },
];

export function BlockStage({
  entry,
  variant,
  onVariantChange,
  state,
  onStateChange,
  connected,
  onToggleConnected,
  onAction,
}: {
  entry: CatalogEntry;
  variant: string;
  onVariantChange: (v: string) => void;
  state: BlockState;
  onStateChange: (s: BlockState) => void;
  connected: boolean;
  onToggleConnected: (v: boolean) => void;
  onAction?: (action: string, payload?: unknown) => void;
}) {
  const recipe = entry.recipe;
  const requires = entry.requires ?? recipe.connectors.map((c) => c.id);

  const connectorState = React.useMemo(
    () =>
      requires.map((id) => ({
        id,
        status: connected ? ("provisioned" as const) : ("missing" as const),
        message: connected ? undefined : "Conector nao provisionado pelo dono da plataforma",
      })),
    [requires, connected],
  );

  const VariantCmp = entry.Component;

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      {/* Barra de controle */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/50 px-6 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            size="sm"
            value={variant}
            onChange={onVariantChange}
            options={recipe.variants.map((v) => ({
              value: v.id,
              label: v.label,
              hint: v.intent + (v.tradeoff ? ` — ${v.tradeoff}` : ""),
            }))}
          />
          <Segmented
            size="sm"
            value={state}
            onChange={(v) => onStateChange(v as BlockState)}
            options={STATE_OPTIONS.map((s) => ({ value: s.value as string, label: s.label }))}
          />
        </div>

        <div className="flex items-center gap-2">
          {requires.length > 0 ? (
            <Button
              size="sm"
              variant={connected ? "secondary" : "outline"}
              icon={connected ? <Cable className="h-3.5 w-3.5" /> : <PlugZap className="h-3.5 w-3.5" />}
              onClick={() => onToggleConnected(!connected)}
              title="Simula o conector provisionado pelo dono da plataforma"
            >
              {connected ? "Conectado" : "Desconectado"}
            </Button>
          ) : null}
          <Badge tone="outline" icon={<Eye className="h-3 w-3" />}>
            {recipe.variants.find((v) => v.id === variant)?.label ?? variant}
          </Badge>
        </div>
      </div>

      {/* Palco */}
      <div className="bloco-scroll flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6">
            <h2 className="bloco-title2">{recipe.name}</h2>
            <p className="bloco-body mt-1.5 max-w-prose">{recipe.summary}</p>
            <p className="bloco-caption mt-2 text-fg-faint">{recipe.id}</p>
          </div>

          <div
            className="rounded-[var(--r-xl)] border border-border bg-surface/30 p-5 backdrop-blur-sm sm:p-8"
            key={`${entry.id}-${variant}-${state}-${connected}`}
          >
            {React.createElement(VariantCmp, {
              data: entry.mockData,
              variant,
              state,
              connectors: connectorState,
              onRequestConnector: () => onToggleConnected(true),
              onAction: (action: string, payload: unknown) => onAction?.(action, payload),
              className: "w-full",
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
