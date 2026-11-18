import * as React from "react";
import {
  Badge,
  Callout,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Panel,
  SectionHeader,
  Switch,
  type BlocosFormat,
  type Column,
  useBlocosLocale,
} from "@blocos/ui";
import { ArrowRight, Clock, Eye, KeyRound, Lock, ShieldAlert, ShieldCheck, Webhook } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { webhooksRecipe } from "./webhooks-panel.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type WebhookDeliveryStatus = "ok" | "failed" | "pending";

export interface WebhookGuard {
  /** O endpoint usa HTTPS? */
  https: boolean;
  /** O host resolve para IP publico (guard de SSRF)? */
  publicIp: boolean;
  /** Quando o guard foi verificado por ultimo. */
  checkedAt: string;
}

export interface WebhookEndpoint {
  id: string;
  /** URL de destino (publica, nunca interna). */
  url: string;
  /** Eventos assinados. */
  events: string[];
  /** Nome da variavel de ambiente que guarda o segredo. NUNCA o segredo. */
  secretRef: string;
  active: boolean;
  guard: WebhookGuard;
  delivery: {
    /** Tentativas na ultima entrega. */
    attempts: number;
    lastStatus: WebhookDeliveryStatus;
    lastAttemptAt?: string;
    /** Proxima tentativa agendada pelo backoff. */
    nextAttemptAt?: string;
    httpStatus?: number;
    /** Ultimo erro, sem corpo da resposta do destino. */
    lastError?: string;
  };
  /** Indice do backoff (0 = primeira tentativa). */
  backoffStep: number;
}

export interface WebhooksData {
  webhooks: WebhookEndpoint[];
  /** Backoff oficial: 1m -> 5m -> 15m -> 1h -> 6h -> 24h. */
  backoffSchedule: string[];
  /** Nome legivel de cada evento (ex.: "appointment.created" -> "Cita creada"). Sem nome, mostra o codigo. */
  eventLabels?: Record<string, string>;
  /** Mostra "Ver previa" em cada endpoint (acao `webhook.preview`). Padrao: nao. */
  canPreview?: boolean;
  /** Mostra o cabecalho do bloco (titulo e descricao). Padrao: sim. */
  showHeader?: boolean;
}

export type WebhooksVariant = "list" | "flow";

/* ------------------------------------------------------------------ */
/* Helpers de apresentacao                                             */
/* ------------------------------------------------------------------ */

const deliveryTone: Record<WebhookDeliveryStatus, "success" | "danger" | "warn"> = {
  ok: "success",
  failed: "danger",
  pending: "warn",
};

const deliveryLabel = (L: BlocosFormat, status: WebhookDeliveryStatus): string =>
  ({
    ok: L.t("webhooks.status.ok", "Entregue"),
    failed: L.t("webhooks.status.failed", "Falhou"),
    pending: L.t("webhooks.status.pending", "Aguardando"),
  })[status];

const eventName = (data: WebhooksData, event: string): string => data.eventLabels?.[event] ?? event;

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function WebhooksPanel(props: BlockProps<WebhooksData, WebhooksVariant>) {
  const { data, onAction, variant = "list", state = "success", className, connectors, onRequestConnector } = props;
  const L = useBlocosLocale();
  const { t } = L;

  const webhooks = data.webhooks;
  const hasWebhooks = webhooks.length > 0;
  const schedule = data.backoffSchedule.length > 0 ? data.backoffSchedule : ["1m", "5m", "15m", "1h", "6h", "24h"];

  /* Desativar um endpoint para o envio de eventos: passa por confirmacao. */
  const [confirmando, setConfirmando] = React.useState<{ acao: string; payload?: unknown } | null>(null);

  const toggle = (webhook: WebhookEndpoint, active: boolean) => {
    if (!active) {
      setConfirmando({ acao: "webhook.toggle", payload: { id: webhook.id, active: false } });
      return;
    }
    onAction?.("webhook.toggle", { id: webhook.id, active: true });
  };

  return (
    <BlockFrame state={state} className={className}
        recipe={webhooksRecipe}
        
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
        empty={
          <EmptyState
            icon={<Webhook className="h-5 w-5" aria-hidden />}
            title={t("webhooks.emptyTitle", "Nenhum webhook configurado")}
            description={t("webhooks.emptyFrame", "Os endpoints sao cadastrados no manifesto de integracoes; aqui aparece so o que ja esta ativo.")}
          />
        }
      >
      <div className="flex flex-col gap-4">
        {data.showHeader === false ? null : (
          <SectionHeader
            eyebrow={t("webhooks.eyebrow", "Operacao")}
            title={t("webhooks.title", "Webhooks de saida")}
            description={t(
              "webhooks.description",
              "Eventos que o programa envia para fora. O segredo nunca aparece aqui: a interface mostra apenas o nome da variavel de ambiente que o guarda.",
            )}
            actions={
              <Badge tone="info" icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}>
                {t("webhooks.httpsOnly", "Somente HTTPS e IP publico")}
              </Badge>
            }
          />
        )}

        {!hasWebhooks ? (
          <EmptyState
            icon={<Webhook className="h-5 w-5" aria-hidden />}
            title={t("webhooks.emptyTitle", "Nenhum webhook configurado")}
            description={t("webhooks.emptyDescription", "Cadastre um endpoint para o programa avisar eventos quando algo acontecer no consultorio.")}
          />
        ) : variant === "flow" ? (
          <div className="flex flex-col gap-3">
            {webhooks.map((webhook) => (
              <WebhookFlow key={webhook.id} webhook={webhook} schedule={schedule} data={data} L={L} onAction={onAction} />
            ))}
          </div>
        ) : (
          <Panel tone="outline" padding="none">
            <DataTable<WebhookEndpoint>
              rowKey={(row) => row.id}
              rows={webhooks}
              columns={webhookColumns(toggle, data, L, onAction)}
              empty={
                <EmptyState
                  title={t("webhooks.emptyTitle", "Nenhum webhook configurado")}
                  description={t("webhooks.emptyShort", "Cadastre um endpoint de saida.")}
                />
              }
            />
          </Panel>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <Callout
            tone="warn"
            icon={<ShieldAlert className="h-4 w-4" aria-hidden />}
            title={t("webhooks.ssrfTitle", "Guard de SSRF ativo")}
          >
            {t(
              "webhooks.ssrfBody",
              "So aceitamos endpoint HTTPS que resolve para IP publico. Endereco interno, loopback e rede privada sao recusados antes do envio — inclusive quando o DNS muda depois.",
            )}
          </Callout>

          <Callout tone="info" icon={<Clock className="h-4 w-4" aria-hidden />} title={t("webhooks.backoffTitle", "Backoff de reexecucao")}>
            {t(
              "webhooks.backoffBody",
              "{schedule}. Depois da ultima tentativa o evento e marcado como falho e vai para a fila de inspecao manual.",
              { schedule: schedule.join(" -> ") },
            )}
          </Callout>
        </div>

        <ConfirmDialog
          open={confirmando !== null}
          onOpenChange={(open) => {
            if (!open) setConfirmando(null);
          }}
          title={t("webhooks.disableTitle", "Desativar endpoint de webhook")}
          description={t(
            "webhooks.disableBody",
            "O programa deixa de enviar eventos para este endpoint. O segredo, a configuracao e o historico de entregas sao mantidos — a reativacao e imediata, a qualquer momento.",
          )}
          confirmLabel={t("webhooks.disable", "Desativar")}
          tone="danger"
          onConfirm={() => {
            if (confirmando?.payload) onAction?.(confirmando.acao, confirmando.payload);
          }}
        />
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacoes                                                           */
/* ------------------------------------------------------------------ */

function webhookColumns(
  toggle: (webhook: WebhookEndpoint, active: boolean) => void,
  data: WebhooksData,
  L: BlocosFormat,
  onAction?: (action: string, payload?: unknown) => void | Promise<void>,
): Array<Column<WebhookEndpoint>> {
  const { t } = L;
  return [
    {
      key: "endpoint",
      header: t("webhooks.col.endpoint", "Endpoint"),
      render: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="bloco-mono block min-w-0 max-w-full truncate text-fg" title={row.url}>
            {row.url}
          </span>
          <span className="bloco-caption flex items-center gap-1.5">
            <KeyRound className="h-3 w-3" aria-hidden />
            {row.secretRef}
          </span>
          {data.canPreview ? (
            <button
              type="button"
              onClick={() => void onAction?.("webhook.preview", { id: row.id })}
              className="bloco-caption mt-1 inline-flex min-h-6 items-center gap-1 self-start text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Eye className="h-3 w-3" aria-hidden />
              {t("webhooks.preview", "Ver previa do envio")}
            </button>
          ) : null}
        </span>
      ),
    },
    {
      key: "events",
      header: t("webhooks.col.events", "Eventos"),
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.events.slice(0, 3).map((event) => (
            <Badge key={event} tone="outline">
              {eventName(data, event)}
            </Badge>
          ))}
          {row.events.length > 3 ? <span className="bloco-caption">+{row.events.length - 3}</span> : null}
        </span>
      ),
    },
    {
      key: "guard",
      header: t("webhooks.col.guard", "Guard"),
      render: (row) => (
        <span className="flex items-center gap-1.5">
          {row.guard.https && row.guard.publicIp ? (
            <Badge tone="success" icon={<ShieldCheck className="h-3 w-3" aria-hidden />}>
              {t("webhooks.guardOk", "HTTPS + IP publico")}
            </Badge>
          ) : (
            <Badge tone="danger" icon={<ShieldAlert className="h-3 w-3" aria-hidden />}>
              {t("webhooks.guardBlocked", "Bloqueado")}
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: "attempts",
      header: t("webhooks.col.attempts", "Tentativas"),
      align: "right",
      render: (row) => <span className="tabular-nums">{row.delivery.attempts}</span>,
    },
    {
      key: "status",
      header: t("webhooks.col.lastDelivery", "Ultima entrega"),
      render: (row) => (
        <span className="flex flex-col">
          <Badge tone={deliveryTone[row.delivery.lastStatus]}>{deliveryLabel(L, row.delivery.lastStatus)}</Badge>
          <span className="bloco-caption">
            {row.delivery.lastAttemptAt ? L.dateTime(row.delivery.lastAttemptAt) : t("webhooks.never", "nunca entregue")}
            {row.delivery.httpStatus ? ` · HTTP ${row.delivery.httpStatus}` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "active",
      header: t("webhooks.col.active", "Ativo"),
      align: "right",
      render: (row) => (
        <Switch
          checked={row.active}
          onCheckedChange={() => toggle(row, !row.active)}
          label={<span className="sr-only">{t("webhooks.toggleLabel", "Ativar ou desativar o endpoint {url}", { url: row.url })}</span>}
          ariaLabel={t("webhooks.toggleLabel", "Ativar ou desativar o endpoint {url}", { url: row.url })}
        />
      ),
    },
  ];
}

function WebhookFlow({
  webhook,
  schedule,
  data,
  L,
  onAction,
}: {
  webhook: WebhookEndpoint;
  schedule: string[];
  data: WebhooksData;
  L: BlocosFormat;
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  const { t } = L;
  const blocked = !(webhook.guard.https && webhook.guard.publicIp);

  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="bloco-mono min-w-0 break-all text-fg">{webhook.url}</span>
        <div className="flex items-center gap-2">
          {blocked ? (
            <Badge tone="danger" icon={<Lock className="h-3 w-3" aria-hidden />}>
              {t("webhooks.guardBlocks", "Guard bloqueia")}
            </Badge>
          ) : (
            <Badge tone="success" icon={<ShieldCheck className="h-3 w-3" aria-hidden />}>
              {t("webhooks.guardOk", "HTTPS + IP publico")}
            </Badge>
          )}
          <Badge tone={webhook.active ? "success" : "neutral"}>
            {webhook.active ? t("webhooks.active", "Ativo") : t("webhooks.inactive", "Inativo")}
          </Badge>
          {data.canPreview ? (
            <button
              type="button"
              onClick={() => void onAction?.("webhook.preview", { id: webhook.id })}
              className="bloco-caption inline-flex min-h-6 items-center gap-1 text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Eye className="h-3 w-3" aria-hidden />
              {t("webhooks.preview", "Ver previa do envio")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="flex flex-col gap-2 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5">
          <span className="bloco-micro">{t("webhooks.subscribed", "Eventos assinados")}</span>
          <span className="flex flex-wrap gap-1">
            {webhook.events.map((event) => (
              <Badge key={event} tone="outline">
                {eventName(data, event)}
              </Badge>
            ))}
          </span>
        </div>

        <span className="flex items-center justify-center text-fg-faint">
          <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" aria-hidden />
        </span>

        <div className="flex flex-col gap-2 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5">
          <span className="bloco-micro">{t("webhooks.secretByRef", "Segredo (por referencia)")}</span>
          <span className="bloco-mono block min-w-0 max-w-full truncate text-fg" title={webhook.secretRef}>{webhook.secretRef}</span>
          <span className="bloco-caption">{t("webhooks.secretVault", "O valor vive no cofre; nunca e exibido.")}</span>
        </div>

        <span className="flex items-center justify-center text-fg-faint">
          <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" aria-hidden />
        </span>

        <div className="flex flex-col gap-2 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5">
          <span className="bloco-micro">{t("webhooks.col.lastDelivery", "Ultima entrega")}</span>
          <span className="bloco-callout text-fg">
            {deliveryLabel(L, webhook.delivery.lastStatus)} ·{" "}
            {t("webhooks.attemptsCount", "{n} tentativa(s)", { n: webhook.delivery.attempts })}
          </span>
          <span className="bloco-caption">
            {webhook.delivery.nextAttemptAt
              ? t("webhooks.next", "Proxima: {when}", { when: L.dateTime(webhook.delivery.nextAttemptAt) })
              : t("webhooks.backoffStep", "Backoff: {step}", {
                  step: schedule[Math.min(webhook.backoffStep, schedule.length - 1)] ?? "—",
                })}
          </span>
        </div>
      </div>

      {webhook.delivery.lastError ? (
        <p className="bloco-caption rounded-[var(--r-sm)] bg-danger-soft px-3 py-2 text-danger">
          {webhook.delivery.lastError}
        </p>
      ) : null}
    </Panel>
  );
}
