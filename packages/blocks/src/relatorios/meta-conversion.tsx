import * as React from "react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Panel,
  SectionHeader,
  type BadgeTone,
  type Column,
} from "@blocos/ui";
import { ShieldCheck } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { metaConversionRecipe } from "./meta-conversion.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type MetaEventStatus = "pendente" | "enviado" | "erro";
export type MetaStageId = "new" | "qualified" | "customer";
export type MetaConversionVariant = "timeline" | "table" | "cards";

export interface MetaConversionEvent {
  id: string;
  /** Nome do evento na API da Meta (ex.: "Lead"). */
  event: string;
  /** Chave deterministica de dedup — mesma pessoa, mesmo evento, mesma chave. */
  dedupKey: string;
  stage: MetaStageId;
  /** Origem do lead (primeiro toque). */
  source: string;
  /** Instante do evento (ISO). */
  occurredAt: string;
  status: MetaEventStatus;
  /** Valor em centavos (opcional). */
  valueCents?: number;
  attempts?: number;
}

export interface MetaConversionData {
  events: MetaConversionEvent[];
  period?: { from: string; to: string };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const STATUS_LABEL: Record<MetaEventStatus, string> = {
  pendente: "Na fila",
  enviado: "Enviado",
  erro: "Erro",
};

const STATUS_TONE: Record<MetaEventStatus, BadgeTone> = {
  pendente: "warn",
  enviado: "success",
  erro: "danger",
};

const STAGE_LABEL: Record<MetaStageId, string> = {
  new: "new",
  qualified: "qualified",
  customer: "customer",
};

const STAGE_TONE: Record<MetaStageId, BadgeTone> = {
  new: "info",
  qualified: "accent",
  customer: "success",
};

function formatMoment(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function MetaConversion(props: BlockProps<MetaConversionData, MetaConversionVariant>) {
  const {
    data,
    onAction,
    variant = "timeline",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const events = data.events ?? [];
  const effectiveState = state === "success" && events.length === 0 ? "empty" : state;

  const pending = events.filter((e) => e.status === "pendente").length;
  const errors = events.filter((e) => e.status === "erro").length;

  return (
    <BlockFrame
      state={effectiveState}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      className={className}
        recipe={metaConversionRecipe}
        onAction={onAction}
        empty={
          <EmptyState
            icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
            title="Fila de eventos vazia"
            description="A fila e alimentada sozinha pela API da Meta quando um lead avanca no funil."
          />
        }
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Relatorios"
          title="Fila de eventos da Meta"
          description="Eventos de conversao prontos para envio a Meta, com chave deterministica de dedup."
          actions={
            <div className="flex items-center gap-2">
              <Badge tone={pending > 0 ? "warn" : "neutral"}>{pending} na fila</Badge>
              <Badge tone={errors > 0 ? "danger" : "neutral"}>{errors} com erro</Badge>
            </div>
          }
        />

        <Panel tone="outline" className="flex items-start gap-3 border-info/30 bg-info-soft">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-info" aria-hidden />
          <div>
            <p className="bloco-headline">LGPD: o payload nunca leva dado de saude</p>
            <p className="bloco-callout mt-0.5 text-fg-secondary">
              A fila envia apenas evento, etapa e origem. Consulta, medida, plano alimentar e qualquer
              conteudo de atendimento ficam de fora do payload — sempre.
            </p>
          </div>
        </Panel>

        {variant === "timeline" ? <EventTimeline events={events} /> : null}
        {variant === "table" ? (
          <Panel tone="outline" padding="none">
            <DataTable columns={eventColumns} rows={events} rowKey={(row) => row.id} />
          </Panel>
        ) : null}
        {variant === "cards" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              onAction?.("meta.event.export", {
                events: events.filter((e) => e.status === "pendente").map((e) => e.id),
                format: "csv",
              })
            }
          >
            Exportar fila
          </Button>
          {errors > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                onAction?.("meta.event.retry", {
                  ids: events.filter((e) => e.status === "erro").map((e) => e.id),
                })
              }
            >
              Reenviar com erro
            </Button>
          ) : null}
        </div>
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "timeline"                                                  */
/* ------------------------------------------------------------------ */

function EventTimeline({ events }: { events: MetaConversionEvent[] }) {
  const sorted = [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  if (sorted.length === 0) {
    return (
      <p className="bloco-caption text-fg-muted">Nenhum evento na fila.</p>
    );
  }

  return (
    <Panel tone="outline" className="flex flex-col">
      {sorted.map((event, index) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex w-4 shrink-0 flex-col items-center">
            <span
              className={
                "mt-3 h-2.5 w-2.5 shrink-0 rounded-full " +
                (event.status === "enviado"
                  ? "bg-success"
                  : event.status === "erro"
                    ? "bg-danger"
                    : "bg-warn")
              }
              aria-hidden
            />
            {index < sorted.length - 1 ? (
              <span className="w-px flex-1 bg-border" aria-hidden />
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1 border-b border-border py-3 last:border-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bloco-headline">{event.event}</span>
              <Badge tone={STAGE_TONE[event.stage]} size="sm">
                {STAGE_LABEL[event.stage]}
              </Badge>
              <Badge tone={STATUS_TONE[event.status]} size="sm">
                {STATUS_LABEL[event.status]}
              </Badge>
            </div>
            <p className="bloco-caption text-fg-muted">
              {formatMoment(event.occurredAt)} · origem {event.source}
            </p>
            <p className="bloco-micro">
              chave dedup: <span className="bloco-mono">{event.dedupKey}</span>
            </p>
          </div>
        </div>
      ))}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "cards"                                                     */
/* ------------------------------------------------------------------ */

function EventCard({ event }: { event: MetaConversionEvent }) {
  return (
    <Panel tone="glass" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="bloco-headline">{event.event}</span>
        <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
      </div>
      <Badge tone={STAGE_TONE[event.stage]} size="sm">
        {STAGE_LABEL[event.stage]}
      </Badge>
      <p className="bloco-caption text-fg-muted">
        {formatMoment(event.occurredAt)} · origem {event.source}
      </p>
      <p className="bloco-micro truncate">
        dedup: <span className="bloco-mono">{event.dedupKey}</span>
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Colunas                                                              */
/* ------------------------------------------------------------------ */

const eventColumns: Array<Column<MetaConversionEvent>> = [
  {
    key: "event",
    header: "Evento",
    render: (row) => <span className="font-medium text-fg">{row.event}</span>,
  },
  {
    key: "dedup",
    header: "Chave dedup",
    render: (row) => <span className="bloco-mono text-[12px]">{row.dedupKey}</span>,
  },
  {
    key: "stage",
    header: "Estagio",
    render: (row) => <Badge tone={STAGE_TONE[row.stage]}>{STAGE_LABEL[row.stage]}</Badge>,
  },
  {
    key: "source",
    header: "Origem",
    render: (row) => <span>{row.source}</span>,
  },
  {
    key: "occurred",
    header: "Quando",
    render: (row) => <span className="tabular-nums">{formatMoment(row.occurredAt)}</span>,
  },
  {
    key: "status",
    header: "Situacao",
    render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
  },
];
