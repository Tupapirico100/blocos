import * as React from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CircleDot, Megaphone, MessageCircle, Share2, UserPlus } from "lucide-react";
import { formatBRL } from "@blocos/core";
import { Badge, DataTable, IconButton, Panel, Skeleton } from "@blocos/ui";
import type { BadgeTone, Column } from "@blocos/ui";
import { BlockFrame } from "../shared/index.js";
import type { BlockProps } from "../shared/index.js";
import { formatDateTime, formatPhone } from "./format.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

/** Estagio fixo de lead: new -> qualified -> customer. */
export type LeadStage = "new" | "qualified" | "customer";

/** Origem do lead: a do PRIMEIRO toque, nao a do ultimo clique. */
export type LeadOrigin = "anuncio" | "indicacao" | "organico";

export interface Lead {
  id: string;
  name: string;
  /** Telefone E.164. */
  phone: string;
  stage: LeadStage;
  origin: LeadOrigin;
  /** Dinheiro sempre em centavos. */
  valueCents: number;
  /** Instante do primeiro toque (ISO). Define a origem e a atribuicao. */
  firstTouchAt: string;
  /** Canal do primeiro toque. */
  firstTouchChannel: string;
  /** Quem fez o primeiro toque (atribuicao). */
  firstTouchBy?: string;
  /** Ultimo toque (ISO). */
  lastTouchAt: string;
  note?: string;
}

export interface LeadStageMeta {
  id: LeadStage;
  label: string;
  hint?: string;
}

export interface LeadBoardData {
  leads: Lead[];
  stages: LeadStageMeta[];
}

const DEFAULT_STAGES: LeadStageMeta[] = [
  { id: "new", label: "Novo", hint: "Chegou e ainda nao foi qualificado" },
  { id: "qualified", label: "Qualificado", hint: "Tem interesse confirmado" },
  { id: "customer", label: "Cliente", hint: "Virou paciente do consultorio" },
];

const ORIGIN_LABEL: Record<LeadOrigin, string> = {
  anuncio: "Anuncio",
  indicacao: "Indicacao",
  organico: "Organico",
};

const ORIGIN_ICON: Record<LeadOrigin, React.ReactNode> = {
  anuncio: <Megaphone size={12} aria-hidden />,
  indicacao: <Share2 size={12} aria-hidden />,
  organico: <UserPlus size={12} aria-hidden />,
};

const ORIGIN_TONE: Record<LeadOrigin, BadgeTone> = {
  anuncio: "info",
  indicacao: "accent",
  organico: "neutral",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function LeadsBoard(props: BlockProps<LeadBoardData, "board" | "table" | "timeline">) {
  const { data, onAction, variant = "board", state = "success", className } = props;

  const stages = data.stages.length > 0 ? data.stages : DEFAULT_STAGES;

  return (
    <BlockFrame
      state={state}
      className={className}
      loading={
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((column) => (
            <div key={column} className="flex flex-col gap-2 rounded-[var(--r-lg)] border border-border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      }
      empty={
        <div className="rounded-[var(--r-lg)] border border-dashed border-border p-6 text-center">
          <p className="bloco-headline">Nenhum lead por aqui</p>
          <p className="bloco-callout mt-1 text-fg-muted">
            Quando um lead entrar no funil, ele aparece aqui com a origem do primeiro toque.
          </p>
        </div>
      }
    >
      {variant === "table" ? (
        <LeadTable leads={data.leads} stages={stages} onAction={onAction} />
      ) : variant === "timeline" ? (
        <LeadTimeline leads={data.leads} stages={stages} />
      ) : (
        <LeadBoardView leads={data.leads} stages={stages} onAction={onAction} />
      )}
    </BlockFrame>
  );
}

/** Alias em singular, para quem importa o bloco pelo nome do arquivo. */
export const LeadBoard = LeadsBoard;

/* ------------------------------------------------------------------ */
/* Variacao: quadro (kanban)                                            */
/* ------------------------------------------------------------------ */

function LeadBoardView({
  leads,
  stages,
  onAction,
}: {
  leads: Lead[];
  stages: LeadStageMeta[];
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {stages.map((stage) => {
        const columnLeads = leads.filter((lead) => lead.stage === stage.id);
        return (
          <Panel key={stage.id} tone="solid" padding="md" className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="bloco-title3">{stage.label}</h3>
                {stage.hint ? <p className="bloco-caption mt-0.5 text-fg-muted">{stage.hint}</p> : null}
              </div>
              <Badge tone="neutral">{columnLeads.length}</Badge>
            </div>

            <div className="flex flex-col gap-2">
              {columnLeads.length === 0 ? (
                <p className="bloco-caption rounded-[var(--r-md)] border border-dashed border-border px-3 py-4 text-center text-fg-muted">
                  Nenhum lead nesta etapa.
                </p>
              ) : (
                columnLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} stages={stages} onAction={onAction} />
                ))
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function LeadCard({
  lead,
  stages,
  onAction,
}: {
  lead: Lead;
  stages: LeadStageMeta[];
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  const index = stages.findIndex((stage) => stage.id === lead.stage);
  const previous = index > 0 ? stages[index - 1] : undefined;
  const next = index >= 0 && index < stages.length - 1 ? stages[index + 1] : undefined;

  const move = (stage: LeadStage) => {
    void onAction?.("lead.move", { id: lead.id, stage });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-[var(--r-md)] border border-border bg-surface/70 p-3 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="bloco-headline break-words">{lead.name}</p>
          <p className="bloco-caption text-fg-muted">{formatPhone(lead.phone)}</p>
        </div>
        <Badge
          tone={ORIGIN_TONE[lead.origin]}
          icon={ORIGIN_ICON[lead.origin]}
          className="shrink-0"
        >
          {ORIGIN_LABEL[lead.origin]}
        </Badge>
      </div>

      <p className="bloco-micro mt-2 text-fg-faint">Atribuicao do primeiro toque</p>
      <p className="bloco-caption text-fg-secondary">
        {lead.firstTouchBy ? `${lead.firstTouchBy} · ` : ""}
        {lead.firstTouchChannel} · {formatDateTime(lead.firstTouchAt)}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="bloco-headline tabular-nums">{formatBRL(lead.valueCents)}</span>
        <div className="flex items-center gap-1">
          {previous ? (
            <IconButton
              label={`Mover ${lead.name} para ${previous.label}`}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => move(previous.id)}
            >
              <ArrowLeft size={14} aria-hidden />
            </IconButton>
          ) : null}
          {next ? (
            <IconButton
              label={`Mover ${lead.name} para ${next.label}`}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => move(next.id)}
            >
              <ArrowRight size={14} aria-hidden />
            </IconButton>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: tabela densa                                              */
/* ------------------------------------------------------------------ */

function LeadTable({
  leads,
  stages,
  onAction,
}: {
  leads: Lead[];
  stages: LeadStageMeta[];
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  const stageLabel = (stage: LeadStage): string =>
    stages.find((s) => s.id === stage)?.label ?? stage;

  const columns: Array<Column<Lead>> = [
    {
      key: "name",
      header: "Lead",
      render: (lead) => (
        <div className="min-w-0">
          <p className="bloco-headline truncate text-fg">{lead.name}</p>
          <p className="bloco-caption text-fg-muted">{formatPhone(lead.phone)}</p>
        </div>
      ),
    },
    {
      key: "origin",
      header: "Origem",
      width: "130px",
      render: (lead) => (
        <Badge tone={ORIGIN_TONE[lead.origin]} icon={ORIGIN_ICON[lead.origin]}>
          {ORIGIN_LABEL[lead.origin]}
        </Badge>
      ),
    },
    {
      key: "value",
      header: "Valor",
      align: "right",
      width: "110px",
      render: (lead) => <span className="tabular-nums">{formatBRL(lead.valueCents)}</span>,
    },
    {
      key: "stage",
      header: "Etapa",
      width: "130px",
      render: (lead) => (
        <Badge tone={lead.stage === "customer" ? "success" : lead.stage === "qualified" ? "accent" : "neutral"}>
          {stageLabel(lead.stage)}
        </Badge>
      ),
    },
    {
      key: "firstTouch",
      header: "Primeiro toque",
      width: "220px",
      render: (lead) => (
        <div className="min-w-0">
          <p className="truncate text-fg-secondary">
            {lead.firstTouchBy ?? "Sem responsavel"} · {lead.firstTouchChannel}
          </p>
          <p className="bloco-caption text-fg-faint">{formatDateTime(lead.firstTouchAt)}</p>
        </div>
      ),
    },
    {
      key: "move",
      header: "Mover",
      align: "right",
      width: "96px",
      render: (lead) => {
        const index = stages.findIndex((stage) => stage.id === lead.stage);
        const previous = index > 0 ? stages[index - 1] : undefined;
        const next = index >= 0 && index < stages.length - 1 ? stages[index + 1] : undefined;
        return (
          <div className="flex items-center justify-end gap-1">
            {previous ? (
              <IconButton
                label={`Mover ${lead.name} para ${previous.label}`}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => void onAction?.("lead.move", { id: lead.id, stage: previous.id })}
              >
                <ArrowLeft size={14} aria-hidden />
              </IconButton>
            ) : null}
            {next ? (
              <IconButton
                label={`Mover ${lead.name} para ${next.label}`}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => void onAction?.("lead.move", { id: lead.id, stage: next.id })}
              >
                <ArrowRight size={14} aria-hidden />
              </IconButton>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <Panel tone="solid" padding="none">
      <DataTable
        columns={columns}
        rows={leads}
        rowKey={(lead) => lead.id}
        empty={
          <p className="bloco-callout px-4 py-6 text-center text-fg-muted">
            Nenhum lead no funil.
          </p>
        }
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: timeline cronologica do primeiro toque                    */
/* ------------------------------------------------------------------ */

function LeadTimeline({ leads, stages }: { leads: Lead[]; stages: LeadStageMeta[] }) {
  const ordered = [...leads].sort((a, b) => a.firstTouchAt.localeCompare(b.firstTouchAt));

  return (
    <Panel tone="solid" padding="md">
      <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
        {ordered.map((lead) => (
          <li key={lead.id} className="relative">
            <span className="absolute -left-[26px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-surface-strong text-fg-muted">
              <CircleDot size={10} aria-hidden />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <p className="bloco-headline text-fg">{lead.name}</p>
              <Badge tone={ORIGIN_TONE[lead.origin]} icon={ORIGIN_ICON[lead.origin]}>
                {ORIGIN_LABEL[lead.origin]}
              </Badge>
              <Badge tone={lead.stage === "customer" ? "success" : "neutral"}>
                {stages.find((stage) => stage.id === lead.stage)?.label ?? lead.stage}
              </Badge>
            </div>
            <p className="bloco-caption mt-1 text-fg-secondary">
              <MessageCircle size={12} className="mr-1 inline" aria-hidden />
              {lead.firstTouchChannel}
              {lead.firstTouchBy ? ` · ${lead.firstTouchBy}` : ""} · {formatDateTime(lead.firstTouchAt)}
            </p>
            <p className="bloco-micro mt-1 text-fg-faint">
              Ultimo toque {formatDateTime(lead.lastTouchAt)} · {formatPhone(lead.phone)} ·{" "}
              {formatBRL(lead.valueCents)}
            </p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
