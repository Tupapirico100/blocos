import * as React from "react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Panel,
  SectionHeader,
  useBlocosLocale,
  type BadgeTone,
  type BlocosFormat,
  type Column,
} from "@blocos/ui";
import { ShieldCheck } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { metaConversionRecipe } from "./meta-conversion.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

/** `expirado` (mais de 7 dias, nao enviado) e `recusado` (faltou condicao, ex.: consentimento) sao opcionais. */
export type MetaEventStatus = "pendente" | "enviado" | "erro" | "expirado" | "recusado";
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
  source?: string;
  /** Instante do evento (ISO). */
  occurredAt: string;
  status: MetaEventStatus;
  /** Valor em centavos (opcional). */
  valueCents?: number;
  attempts?: number;
  /** Motivo legivel de recusa/expiracao/erro, ja no idioma do app. So aparece com `showOutcome`. */
  reason?: string;
  /** Codigo HTTP da resposta da Meta. So aparece com `showOutcome`. */
  responseCode?: number;
}

export interface MetaConversionData {
  events: MetaConversionEvent[];
  period?: { from: string; to: string };
  /** Coluna/linha de origem. Padrao: sim. */
  showSource?: boolean;
  /** Colunas de motivo e codigo de resposta. Padrao: nao. */
  showOutcome?: boolean;
  /** Botao "Exportar fila" (acao `meta.event.export`). Padrao: sim. */
  canExport?: boolean;
  /** Botao "Reenviar com erro" (acao `meta.event.retry`). Padrao: sim. */
  canRetry?: boolean;
  /** Cabecalho do bloco. Padrao: sim. */
  showHeader?: boolean;
}

interface EventView {
  L: BlocosFormat;
  showSource: boolean;
  showOutcome: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const STATUS_LABEL: Record<MetaEventStatus, string> = {
  pendente: "Na fila",
  enviado: "Enviado",
  erro: "Erro",
  expirado: "Expirado",
  recusado: "Recusado",
};

const STATUS_TONE: Record<MetaEventStatus, BadgeTone> = {
  pendente: "warn",
  enviado: "success",
  erro: "danger",
  expirado: "neutral",
  recusado: "neutral",
};

const statusLabel = (L: BlocosFormat, s: MetaEventStatus) => L.t(`meta.status.${s}`, STATUS_LABEL[s]);
const stageLabel = (L: BlocosFormat, s: MetaStageId) => L.t(`meta.stage.${s}`, STAGE_LABEL[s]);

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

/** Data e hora no idioma e fuso do `LocaleProvider` (padrao pt-BR, America/Sao_Paulo). */
function formatMoment(L: BlocosFormat, iso: string): string {
  return new Intl.DateTimeFormat(L.config.locale, {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: L.config.timeZone,
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

  const L = useBlocosLocale();
  const { t } = L;
  const view: EventView = { L, showSource: data.showSource !== false, showOutcome: data.showOutcome === true };
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
            title={t("meta.emptyTitle", "Fila de eventos vazia")}
            description={t("meta.emptyDescription", "A fila e alimentada sozinha pela API da Meta quando um lead avanca no funil.")}
          />
        }
      >
      <div className="flex flex-col gap-4">
        {data.showHeader === false ? null : (
          <SectionHeader
            eyebrow={t("meta.eyebrow", "Relatorios")}
            title={t("meta.title", "Fila de eventos da Meta")}
            description={t("meta.description", "Eventos de conversao prontos para envio a Meta, com chave deterministica de dedup.")}
            actions={
              <div className="flex items-center gap-2">
                <Badge tone={pending > 0 ? "warn" : "neutral"}>{t("meta.pendingCount", "{n} na fila", { n: pending })}</Badge>
                <Badge tone={errors > 0 ? "danger" : "neutral"}>{t("meta.errorCount", "{n} com erro", { n: errors })}</Badge>
              </div>
            }
          />
        )}

        <Panel tone="outline" className="flex items-start gap-3 border-info/30 bg-info-soft">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-info" aria-hidden />
          <div>
            <p className="bloco-headline">{t("meta.privacyTitle", "LGPD: o payload nunca leva dado de saude")}</p>
            <p className="bloco-callout mt-0.5 text-fg-secondary">
              {t(
                "meta.privacyBody",
                "A fila envia apenas evento, etapa e origem. Consulta, medida, plano alimentar e qualquer conteudo de atendimento ficam de fora do payload — sempre.",
              )}
            </p>
          </div>
        </Panel>

        {variant === "timeline" ? <EventTimeline events={events} view={view} /> : null}
        {variant === "table" ? (
          <Panel tone="outline" padding="none">
            <DataTable columns={eventColumns(view)} rows={events} rowKey={(row) => row.id} />
          </Panel>
        ) : null}
        {variant === "cards" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} view={view} />
            ))}
          </div>
        ) : null}

        {data.canExport !== false || (data.canRetry !== false && errors > 0) ? (
          <div className="flex flex-wrap items-center gap-2">
            {data.canExport !== false ? (
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
                {t("meta.export", "Exportar fila")}
              </Button>
            ) : null}
            {data.canRetry !== false && errors > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  onAction?.("meta.event.retry", {
                    ids: events.filter((e) => e.status === "erro").map((e) => e.id),
                  })
                }
              >
                {t("meta.retry", "Reenviar com erro")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "timeline"                                                  */
/* ------------------------------------------------------------------ */

function EventTimeline({ events, view }: { events: MetaConversionEvent[]; view: EventView }) {
  const { L, showSource, showOutcome } = view;
  const { t } = L;
  const sorted = [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  if (sorted.length === 0) {
    return (
      <p className="bloco-caption text-fg-muted">{t("meta.none", "Nenhum evento na fila.")}</p>
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
                    : event.status === "pendente"
                      ? "bg-warn"
                      : "bg-fg-faint")
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
                {stageLabel(L, event.stage)}
              </Badge>
              <Badge tone={STATUS_TONE[event.status]} size="sm">
                {statusLabel(L, event.status)}
              </Badge>
            </div>
            <p className="bloco-caption text-fg-muted">
              {formatMoment(L, event.occurredAt)}
              {showSource && event.source ? ` · ${t("meta.sourcePrefix", "origem")} ${event.source}` : ""}
            </p>
            {showOutcome && (event.reason || event.responseCode) ? (
              <p className="bloco-caption text-fg-secondary">
                {[event.reason, event.responseCode ? `HTTP ${event.responseCode}` : null].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            <p className="bloco-micro">
              {t("meta.dedupPrefix", "chave dedup:")} <span className="bloco-mono">{event.dedupKey}</span>
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

function EventCard({ event, view }: { event: MetaConversionEvent; view: EventView }) {
  const { L, showSource, showOutcome } = view;
  const { t } = L;
  return (
    <Panel tone="glass" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="bloco-headline">{event.event}</span>
        <Badge tone={STATUS_TONE[event.status]}>{statusLabel(L, event.status)}</Badge>
      </div>
      <Badge tone={STAGE_TONE[event.stage]} size="sm">
        {stageLabel(L, event.stage)}
      </Badge>
      <p className="bloco-caption text-fg-muted">
        {formatMoment(L, event.occurredAt)}
        {showSource && event.source ? ` · ${t("meta.sourcePrefix", "origem")} ${event.source}` : ""}
      </p>
      {showOutcome && (event.reason || event.responseCode) ? (
        <p className="bloco-caption text-fg-secondary">
          {[event.reason, event.responseCode ? `HTTP ${event.responseCode}` : null].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <p className="bloco-micro truncate">
        {t("meta.dedupShort", "dedup:")} <span className="bloco-mono">{event.dedupKey}</span>
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Colunas                                                              */
/* ------------------------------------------------------------------ */

function eventColumns(view: EventView): Array<Column<MetaConversionEvent>> {
  const { L, showSource, showOutcome } = view;
  const { t } = L;
  const columns: Array<Column<MetaConversionEvent>> = [
    {
      key: "event",
      header: t("meta.col.event", "Evento"),
      render: (row) => <span className="font-medium text-fg">{row.event}</span>,
    },
    {
      key: "dedup",
      header: t("meta.col.dedup", "Chave dedup"),
      render: (row) => <span className="bloco-mono bloco-label">{row.dedupKey}</span>,
    },
    {
      key: "stage",
      header: t("meta.col.stage", "Estagio"),
      render: (row) => <Badge tone={STAGE_TONE[row.stage]}>{stageLabel(L, row.stage)}</Badge>,
    },
  ];
  if (showSource) {
    columns.push({
      key: "source",
      header: t("meta.col.source", "Origem"),
      render: (row) => <span>{row.source ?? "—"}</span>,
    });
  }
  columns.push(
    {
      key: "occurred",
      header: t("meta.col.when", "Quando"),
      render: (row) => <span className="tabular-nums">{formatMoment(L, row.occurredAt)}</span>,
    },
    {
      key: "status",
      header: t("meta.col.status", "Situacao"),
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{statusLabel(L, row.status)}</Badge>,
    },
  );
  if (showOutcome) {
    columns.push(
      {
        key: "reason",
        header: t("meta.col.reason", "Motivo"),
        render: (row) => <span className="text-fg-secondary">{row.reason ?? "—"}</span>,
      },
      {
        key: "response",
        header: t("meta.col.response", "Resposta"),
        render: (row) => <span className="tabular-nums text-fg-secondary">{row.responseCode ?? "—"}</span>,
      },
    );
  }
  return columns;
}
