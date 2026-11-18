import * as React from "react";
import { motion } from "motion/react";
import {
  Activity,
  CircleAlert,
  FileText,
  History,
  NotebookPen,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { formatBRL } from "@blocos/core";
import { Avatar, Badge, KeyValue, Panel, Skeleton } from "@blocos/ui";
import type { BadgeTone } from "@blocos/ui";
import { BlockFrame, requiresOf, rolesOf } from "../shared/index.js";
import type { BlockProps } from "../shared/index.js";
import { formatDate, formatDateTime, formatPhone } from "./format.js";
import { patientChartRecipe } from "./patient-chart.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type ChartEntryKind = "consulta" | "medida" | "plano" | "evolucao";

export interface ChartConsultation {
  id: string;
  /** ISO. */
  at: string;
  kind: ChartEntryKind;
  professional: string;
  summary: string;
}

export interface ChartMeasure {
  id: string;
  /** ISO. */
  at: string;
  weightKg: number;
  bodyFatPct?: number;
  waistCm?: number;
}

/** Planos alimentares sao versionados: a versao ativa e a que vale. */
export interface MealPlanVersion {
  version: string;
  /** ISO. */
  updatedAt: string;
  author: string;
  summary: string;
  active: boolean;
}

export interface PatientChartData {
  patient: { id: string; name: string; phone: string; birthDate?: string };
  /** Consentimento de tratamento vigente. Ausente = gravacao bloqueada. */
  treatmentConsent: { grantedAt: string; textVersion: string } | null;
  consultations: ChartConsultation[];
  measures: ChartMeasure[];
  mealPlan?: MealPlanVersion | null;
  financial?: { totalCents: number; paidCents: number; pendingCents: number } | null;
}

const KIND_LABEL: Record<ChartEntryKind, string> = {
  consulta: "Consulta",
  medida: "Medida",
  plano: "Plano",
  evolucao: "Evolucao",
};

const KIND_TONE: Record<ChartEntryKind, BadgeTone> = {
  consulta: "accent",
  medida: "info",
  plano: "success",
  evolucao: "neutral",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function PatientChart(props: BlockProps<PatientChartData, "timeline" | "sections" | "tabs">) {
  const { data, onAction, variant = "sections", state = "success", className, connectors, onRequestConnector } = props;

  const hasConsent = Boolean(data.treatmentConsent);
  const activePlan = data.mealPlan?.active ? data.mealPlan : (data.mealPlan ?? null);

  const openChart = () => {
    void onAction?.("patient.chart.open", { patientId: data.patient.id });
  };

  return (
    <BlockFrame
      state={state}
      className={className}
      loading={
        <div className="flex flex-col gap-4"
      >
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      }
      empty={
        <div className="rounded-[var(--r-lg)] border border-dashed border-border p-6 text-center">
          <p className="bloco-headline">Prontuario vazio</p>
          <p className="bloco-callout mt-1 text-fg-muted">
            As consultas, medidas e o plano alimentar do paciente aparecem aqui.
          </p>
        </div>
      }
        recipe={patientChartRecipe}
        
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <Panel tone="solid" padding="md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={data.patient.name} size={42} />
              <div className="min-w-0">
                <h2 className="bloco-title3 truncate" title={data.patient.name}>
                  {data.patient.name}
                </h2>
                <p className="bloco-caption min-w-0 break-words text-fg-muted">
                  {formatPhone(data.patient.phone)}
                  {data.patient.birthDate ? ` · nasc. em ${formatDate(data.patient.birthDate)}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasConsent ? (
                <Badge tone="success" icon={<ShieldCheck size={11} aria-hidden />}>
                  Consentimento de tratamento vigente
                </Badge>
              ) : (
                <Badge tone="danger" icon={<CircleAlert size={11} aria-hidden />}>
                  Sem consentimento de tratamento
                </Badge>
              )}
              {activePlan ? (
                <Badge tone="info" icon={<FileText size={11} aria-hidden />}>
                  Plano {activePlan.version}
                </Badge>
              ) : null}
            </div>
          </div>
        </Panel>

        {!hasConsent ? (
          <div className="rounded-[var(--r-md)] border border-danger/25 bg-danger-soft px-4 py-3">
            <p className="bloco-headline flex items-center gap-2 text-danger">
              <CircleAlert size={15} aria-hidden /> Gravacao bloqueada
            </p>
            <p className="bloco-caption mt-1 text-fg-secondary">
              Sem consentimento de tratamento vigente, o prontuario nao aceita gravar consultas nem
              medidas. Registre o consentimento com o texto vigente do consultorio antes de continuar.
            </p>
          </div>
        ) : null}

        {variant === "timeline" ? (
          <ChartTimeline data={data} />
        ) : variant === "tabs" ? (
          <ChartTabs data={data} onOpen={openChart} />
        ) : (
          <ChartSections data={data} onOpen={openChart} />
        )}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: timeline de evolucao                                       */
/* ------------------------------------------------------------------ */

function ChartTimeline({ data }: { data: PatientChartData }) {
  const entries = [
    ...data.consultations.map((entry) => ({
      id: entry.id,
      at: entry.at,
      kind: entry.kind,
      title: entry.professional,
      description: entry.summary,
    })),
    ...data.measures.map((measure) => ({
      id: measure.id,
      at: measure.at,
      kind: "medida" as ChartEntryKind,
      title: "Serie de medidas",
      description: describeMeasure(measure),
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Panel tone="solid" padding="md">
      <p className="bloco-micro mb-3 flex items-center gap-1.5 text-fg-faint">
        <History size={12} aria-hidden /> Evolucao do paciente
      </p>
      <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
        {entries.map((entry) => (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="relative"
          >
            <span className="absolute -left-[26px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-surface-strong text-fg-muted">
              <Activity size={10} aria-hidden />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={KIND_TONE[entry.kind]}>{KIND_LABEL[entry.kind]}</Badge>
              <span className="bloco-caption text-fg-muted">{formatDateTime(entry.at)}</span>
            </div>
            <p className="bloco-headline mt-1 text-fg">{entry.title}</p>
            <p className="bloco-caption mt-0.5 text-fg-secondary">{entry.description}</p>
          </motion.li>
        ))}
      </ol>
      <PlanBlock plan={data.mealPlan ?? null} />
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: blocos (consultas / medidas / plano / financeiro)           */
/* ------------------------------------------------------------------ */

function ChartSections({
  data,
  onOpen,
}: {
  data: PatientChartData;
  onOpen: () => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ConsultationsBlock data={data} />
      <MeasuresBlock data={data} />
      <PlanBlock plan={data.mealPlan ?? null} />
      <FinancialBlock data={data} onOpen={onOpen} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: abas                                                       */
/* ------------------------------------------------------------------ */

type ChartTab = "consultas" | "medidas" | "plano" | "financeiro";

function ChartTabs({ data, onOpen }: { data: PatientChartData; onOpen: () => void }) {
  const [tab, setTab] = React.useState<ChartTab>("consultas");

  const tabs: Array<{ id: ChartTab; label: string }> = [
    { id: "consultas", label: "Consultas" },
    { id: "medidas", label: "Medidas" },
    { id: "plano", label: "Plano" },
    { id: "financeiro", label: "Financeiro" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Secoes do prontuario" className="flex flex-wrap gap-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`inline-flex min-h-8 items-center rounded-[var(--r-md)] px-3 py-1.5 bloco-control-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              tab === item.id
                ? "bg-surface-strong text-fg"
                : "text-fg-muted hover:bg-surface-hover hover:text-fg-secondary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "consultas" ? <ConsultationsBlock data={data} /> : null}
      {tab === "medidas" ? <MeasuresBlock data={data} /> : null}
      {tab === "plano" ? <PlanBlock plan={data.mealPlan ?? null} /> : null}
      {tab === "financeiro" ? <FinancialBlock data={data} onOpen={onOpen} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blocos internos                                                      */
/* ------------------------------------------------------------------ */

function ConsultationsBlock({ data }: { data: PatientChartData }) {
  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-3">
      <p className="bloco-micro flex items-center gap-1.5 text-fg-faint">
        <NotebookPen size={12} aria-hidden /> Consultas
      </p>
      {data.consultations.length === 0 ? (
        <p className="bloco-callout text-fg-muted">Nenhuma consulta registrada.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.consultations.map((entry) => (
            <li key={entry.id} className="rounded-[var(--r-md)] border border-border bg-surface/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={KIND_TONE[entry.kind]}>{KIND_LABEL[entry.kind]}</Badge>
                <span className="bloco-caption text-fg-muted">{formatDateTime(entry.at)}</span>
              </div>
              <p className="bloco-headline mt-1.5 text-fg">{entry.professional}</p>
              <p className="bloco-caption mt-0.5 text-fg-secondary">{entry.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function MeasuresBlock({ data }: { data: PatientChartData }) {
  const measures = [...data.measures].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-3">
      <p className="bloco-micro flex items-center gap-1.5 text-fg-faint">
        <Scale size={12} aria-hidden /> Serie de medidas
      </p>
      {measures.length === 0 ? (
        <p className="bloco-callout text-fg-muted">Nenhuma medida registrada.</p>
      ) : (
        <>
          <WeightChart measures={measures} />
          <ul className="flex flex-col gap-2">
            {measures.map((measure) => (
              <li
                key={measure.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--r-sm)] border border-border/60 bg-surface/50 px-3 py-2"
              >
                <span className="bloco-caption text-fg-secondary">{formatDate(measure.at)}</span>
                <span className="bloco-body tabular-nums text-fg">{describeMeasure(measure)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

function WeightChart({ measures }: { measures: ChartMeasure[] }) {
  const weights = measures.map((measure) => measure.weightKg);
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const span = max - min || 1;

  return (
    <div
      role="img"
      aria-label={`Serie de peso com ${measures.length} medicao(oes), de ${min} a ${max} quilos`}
      className="flex h-24 items-end gap-1.5 rounded-[var(--r-md)] border border-border bg-surface/50 px-3 py-2"
    >
      {measures.map((measure) => {
        const height = 20 + ((measure.weightKg - min) / span) * 70;
        return (
          <div
            key={measure.id}
            title={`${formatDate(measure.at)}: ${measure.weightKg.toFixed(1)} kg`}
            className="flex-1 rounded-t-[var(--r-xs)] bg-accent/70"
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

function PlanBlock({ plan }: { plan: MealPlanVersion | null }) {
  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="bloco-micro flex items-center gap-1.5 text-fg-faint">
          <FileText size={12} aria-hidden /> Plano alimentar
        </p>
        {plan ? (
          <Badge tone={plan.active ? "success" : "neutral"}>
            {plan.active ? "Versao vigente" : "Versao antiga"}
          </Badge>
        ) : null}
      </div>

      {plan ? (
        <>
          <KeyValue
            columns={2}
            items={[
              { label: <span className="break-words">Versao</span>, value: <span className="break-words">{plan.version}</span> },
              {
                label: <span className="break-words">Atualizado em</span>,
                value: <span className="break-words">{formatDateTime(plan.updatedAt)}</span>,
              },
              {
                label: <span className="break-words">Responsavel</span>,
                value: <span className="break-words">{plan.author}</span>,
              },
              {
                label: <span className="break-words">Planos sao versionados</span>,
                value: <span className="break-words">A versao ativa e a que vale</span>,
              },
            ]}
          />
          <p className="bloco-caption rounded-[var(--r-md)] border border-border bg-surface/60 p-3 text-fg-secondary">
            {plan.summary}
          </p>
        </>
      ) : (
        <p className="bloco-callout text-fg-muted">Nenhum plano alimentar publicado.</p>
      )}
    </Panel>
  );
}

function FinancialBlock({ data, onOpen }: { data: PatientChartData; onOpen: () => void }) {
  const financial = data.financial;

  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-3">
      <p className="bloco-micro flex items-center gap-1.5 text-fg-faint">
        <Wallet size={12} aria-hidden /> Financeiro
      </p>
      {financial ? (
        <KeyValue
          columns={3}
          items={[
            { label: <span className="break-words">Total</span>, value: <span className="break-words">{formatBRL(financial.totalCents)}</span> },
            { label: <span className="break-words">Pago</span>, value: <span className="break-words">{formatBRL(financial.paidCents)}</span> },
            { label: <span className="break-words">Em aberto</span>, value: <span className="break-words">{formatBRL(financial.pendingCents)}</span> },
          ]}
        />
      ) : (
        <p className="bloco-callout text-fg-muted">Nenhum lancamento financeiro.</p>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex min-h-8 self-start items-center rounded-[var(--r-sm)] bloco-control-sm font-medium text-accent-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Abrir financeiro do paciente
      </button>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function describeMeasure(measure: ChartMeasure): string {
  const parts = [`${measure.weightKg.toFixed(1)} kg`];
  if (measure.bodyFatPct !== undefined) parts.push(`${measure.bodyFatPct.toFixed(1)}% gordura`);
  if (measure.waistCm !== undefined) parts.push(`${measure.waistCm} cm cintura`);
  return parts.join(" · ");
}
