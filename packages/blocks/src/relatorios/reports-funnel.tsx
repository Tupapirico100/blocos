import * as React from "react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Panel,
  SectionHeader,
  Stat,
  type BadgeTone,
  type Column,
} from "@blocos/ui";
import { Download, Filter, MousePointerClick, Users } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { reportsFunnelRecipe } from "./reports-funnel.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type FunnelStageId = "new" | "qualified" | "customer";
export type ReportsFunnelVariant = "funnel" | "cards" | "table";

export interface FunnelStage {
  id: FunnelStageId;
  label: string;
  /** Numero de PESSOAS (nao de cliques). */
  peopleCount: number;
}

export interface FunnelSourceRow {
  source: string;
  /** Numero de PESSOAS vindas da origem. */
  peopleCount: number;
  /** Numero de CLIQUES do anuncio (opcional). */
  clicks?: number;
}

export interface ReportsFunnelData {
  stages: FunnelStage[];
  period: { from: string; to: string };
  bySource?: FunnelSourceRow[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const STAGE_TONE: Record<FunnelStageId, BadgeTone> = {
  new: "info",
  qualified: "accent",
  customer: "success",
};

function periodLabel(period: { from: string; to: string }): string {
  const [fromY = "", fromM = "", fromD = ""] = period.from.split("-");
  const [toY = "", toM = "", toD = ""] = period.to.split("-");
  return `${fromD}/${fromM}/${fromY} a ${toD}/${toM}/${toY}`;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function ReportsFunnel(props: BlockProps<ReportsFunnelData, ReportsFunnelVariant>) {
  const {
    data,
    onAction,
    variant = "funnel",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const stages = data.stages ?? [];
  const bySource = data.bySource ?? [];

  const effectiveState = state === "success" && stages.length === 0 ? "empty" : state;

  const first = stages[0];
  const last = stages[stages.length - 1];
  const topCount = stages.reduce((acc, stage) => Math.max(acc, stage.peopleCount), 0);
  const conversion =
    first && last && first.peopleCount > 0 ? last.peopleCount / first.peopleCount : 0;

  const totalClicks = bySource.reduce((acc, row) => acc + (row.clicks ?? 0), 0);

  return (
    <BlockFrame
      state={effectiveState}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      className={className}
        recipe={reportsFunnelRecipe}
        onAction={onAction}
        empty={
          <EmptyState
            icon={<Users className="h-5 w-5" aria-hidden />}
            title="Funil sem etapas"
            description="As etapas do funil entram sozinhas conforme os leads passam de new para customer."
          />
        }
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Relatorios"
          title="Funil de conversao"
          description={`Pessoas por etapa em ${periodLabel(data.period)}. Relatorio por origem conta PESSOAS; por anuncio conta CLIQUES.`}
          actions={
            <Button
              size="sm"
              variant="secondary"
              icon={<Download size={14} aria-hidden />}
              onClick={() =>
                onAction?.("report.export", {
                  report: "funnel",
                  from: data.period.from,
                  to: data.period.to,
                  format: "csv",
                  unit: "people",
                })
              }
            >
              Exportar
            </Button>
          }
        />

        {variant === "funnel" ? (
          <FunnelView stages={stages} topCount={topCount} />
        ) : null}

        {variant === "cards" ? (
          <div className="grid gap-3 md:grid-cols-3">
            {stages.map((stage) => (
              <Stat
                key={stage.id}
                label={stage.label}
                value={String(stage.peopleCount)}
                hint="pessoas"
                icon={<Users size={14} aria-hidden />}
              />
            ))}
          </div>
        ) : null}

        {variant === "table" ? (
          <Panel tone="outline" padding="none">
            <DataTable columns={stageColumns} rows={stages} rowKey={(row) => row.id} />
          </Panel>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <Stat
            label="Pessoas no topo do funil"
            value={String(first?.peopleCount ?? 0)}
            hint="etapa new"
          />
          <Stat
            label="Conversao total"
            value={`${(conversion * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
            hint="new -> customer"
          />
          <Stat
            label="Cliques de anuncios"
            value={String(totalClicks)}
            hint="cliques sao cliques, nao pessoas"
            icon={<MousePointerClick size={14} aria-hidden />}
          />
        </div>

        {bySource.length > 0 ? (
          <Panel tone="outline" padding="none">
            <div className="flex items-center gap-2 px-4 py-3">
              <Filter size={14} className="text-fg-faint" aria-hidden />
              <p className="bloco-headline">Origem</p>
              <span className="bloco-caption text-fg-muted">
                Atribuicao pelo primeiro toque: a origem e a do primeiro contato.
              </span>
            </div>
            <DataTable columns={sourceColumns} rows={bySource} rowKey={(row) => row.source} />
          </Panel>
        ) : null}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "funnel" (barras em CSS puro)                               */
/* ------------------------------------------------------------------ */

function FunnelView({ stages, topCount }: { stages: FunnelStage[]; topCount: number }) {
  return (
    <Panel tone="outline" className="flex flex-col gap-3">
      <p className="bloco-headline">Etapas do funil</p>

      {stages.length === 0 ? (
        <p className="bloco-caption text-fg-muted">Sem etapas para exibir.</p>
      ) : (
        stages.map((stage) => {
          const width = topCount > 0 ? Math.max((stage.peopleCount / topCount) * 100, 4) : 0;
          return (
            <div key={stage.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="bloco-caption flex items-center gap-2 font-medium text-fg">
                  {stage.label}
                  <Badge tone={STAGE_TONE[stage.id]} size="sm">
                    {stage.id}
                  </Badge>
                </span>
                <span className="bloco-caption tabular-nums text-fg">
                  {stage.peopleCount} {stage.peopleCount === 1 ? "pessoa" : "pessoas"}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-[var(--r-pill)] bg-surface-active">
                <div
                  className="h-full rounded-[var(--r-pill)] bg-accent transition-[width] duration-[var(--dur-4)] ease-[var(--ease-apple)]"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })
      )}

      <p className="bloco-micro border-t border-border pt-3">
        Contagem de pessoas: um lead e uma pessoa, mesmo com varios toques.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Colunas                                                              */
/* ------------------------------------------------------------------ */

const stageColumns: Array<Column<FunnelStage>> = [
  {
    key: "stage",
    header: "Etapa",
    render: (row) => (
      <span className="flex items-center gap-2 font-medium text-fg">
        {row.label}
        <Badge tone={STAGE_TONE[row.id]} size="sm">
          {row.id}
        </Badge>
      </span>
    ),
  },
  {
    key: "people",
    header: "Pessoas",
    align: "right",
    render: (row) => <span className="tabular-nums text-fg">{row.peopleCount}</span>,
  },
];

const sourceColumns: Array<Column<FunnelSourceRow>> = [
  {
    key: "source",
    header: "Origem",
    render: (row) => <span className="font-medium text-fg">{row.source}</span>,
  },
  {
    key: "people",
    header: "Pessoas",
    align: "right",
    render: (row) => <span className="tabular-nums text-fg">{row.peopleCount}</span>,
  },
  {
    key: "clicks",
    header: "Cliques",
    align: "right",
    render: (row) => <span className="tabular-nums text-fg-muted">{row.clicks ?? "—"}</span>,
  },
];
