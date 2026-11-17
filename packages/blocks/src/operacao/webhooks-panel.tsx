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
  type Column,
} from "@blocos/ui";
import { ArrowRight, Clock, KeyRound, Lock, ShieldAlert, ShieldCheck, Webhook } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { formatOpsDateTime } from "./format.js";
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

const deliveryLabel: Record<WebhookDeliveryStatus, string> = {
  ok: "Entregue",
  failed: "Falhou",
  pending: "Aguardando",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function WebhooksPanel(props: BlockProps<WebhooksData, WebhooksVariant>) {
  const { data, onAction, variant = "list", state = "success", className, connectors, onRequestConnector } = props;

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
            title="Nenhum webhook configurado"
            description="Os endpoints sao cadastrados no manifesto de integracoes; aqui aparece so o que ja esta ativo."
          />
        }
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Operacao"
          title="Webhooks de saida"
          description="Eventos que o programa envia para fora. O segredo nunca aparece aqui: a interface mostra apenas o nome da variavel de ambiente que o guarda."
          actions={
            <Badge tone="info" icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}>
              Somente HTTPS e IP publico
            </Badge>
          }
        />

        {!hasWebhooks ? (
          <EmptyState
            icon={<Webhook className="h-5 w-5" aria-hidden />}
            title="Nenhum webhook configurado"
            description="Cadastre um endpoint para o programa avisar eventos quando algo acontecer no consultorio."
          />
        ) : variant === "flow" ? (
          <div className="flex flex-col gap-3">
            {webhooks.map((webhook) => (
              <WebhookFlow key={webhook.id} webhook={webhook} schedule={schedule} />
            ))}
          </div>
        ) : (
          <Panel tone="outline" padding="none">
            <DataTable<WebhookEndpoint>
              rowKey={(row) => row.id}
              rows={webhooks}
              columns={webhookColumns(toggle)}
              empty={<EmptyState title="Nenhum webhook configurado" description="Cadastre um endpoint de saida." />}
            />
          </Panel>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <Callout
            tone="warn"
            icon={<ShieldAlert className="h-4 w-4" aria-hidden />}
            title="Guard de SSRF ativo"
          >
            So aceitamos endpoint <strong>HTTPS</strong> que resolve para <strong>IP publico</strong>. Endereco interno,
            loopback e rede privada sao recusados antes do envio — inclusive quando o DNS muda depois.
          </Callout>

          <Callout tone="info" icon={<Clock className="h-4 w-4" aria-hidden />} title="Backoff de reexecucao">
            {schedule.join(" -> ")}. Depois da ultima tentativa o evento e marcado como falho e vai para a fila de
            inspecao manual.
          </Callout>
        </div>

        <ConfirmDialog
          open={confirmando !== null}
          onOpenChange={(open) => {
            if (!open) setConfirmando(null);
          }}
          title="Desativar endpoint de webhook"
          description="O programa deixa de enviar eventos para este endpoint. O segredo, a configuracao e o historico de entregas sao mantidos — a reativacao e imediata, a qualquer momento."
          confirmLabel="Desativar"
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
): Array<Column<WebhookEndpoint>> {
  return [
    {
      key: "endpoint",
      header: "Endpoint",
      render: (row) => (
        <span className="flex flex-col">
          <span className="bloco-mono truncate text-fg">{row.url}</span>
          <span className="bloco-caption flex items-center gap-1.5">
            <KeyRound className="h-3 w-3" aria-hidden />
            {row.secretRef}
          </span>
        </span>
      ),
    },
    {
      key: "events",
      header: "Eventos",
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.events.slice(0, 3).map((event) => (
            <Badge key={event} tone="outline">
              {event}
            </Badge>
          ))}
          {row.events.length > 3 ? <span className="bloco-caption">+{row.events.length - 3}</span> : null}
        </span>
      ),
    },
    {
      key: "guard",
      header: "Guard",
      render: (row) => (
        <span className="flex items-center gap-1.5">
          {row.guard.https && row.guard.publicIp ? (
            <Badge tone="success" icon={<ShieldCheck className="h-3 w-3" aria-hidden />}>
              HTTPS + IP publico
            </Badge>
          ) : (
            <Badge tone="danger" icon={<ShieldAlert className="h-3 w-3" aria-hidden />}>
              Bloqueado
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: "attempts",
      header: "Tentativas",
      align: "right",
      render: (row) => <span className="tabular-nums">{row.delivery.attempts}</span>,
    },
    {
      key: "status",
      header: "Ultima entrega",
      render: (row) => (
        <span className="flex flex-col">
          <Badge tone={deliveryTone[row.delivery.lastStatus]}>{deliveryLabel[row.delivery.lastStatus]}</Badge>
          <span className="bloco-caption">
            {row.delivery.lastAttemptAt ? formatOpsDateTime(row.delivery.lastAttemptAt) : "nunca entregue"}
            {row.delivery.httpStatus ? ` · HTTP ${row.delivery.httpStatus}` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "active",
      header: "Ativo",
      align: "right",
      render: (row) => (
        <Switch
          checked={row.active}
          onCheckedChange={() => toggle(row, !row.active)}
          label={<span className="sr-only">Ativar ou desativar o endpoint {row.url}</span>}
          ariaLabel={`Ativar ou desativar o endpoint ${row.url}`}
        />
      ),
    },
  ];
}

function WebhookFlow({ webhook, schedule }: { webhook: WebhookEndpoint; schedule: string[] }) {
  const blocked = !(webhook.guard.https && webhook.guard.publicIp);

  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="bloco-mono text-fg">{webhook.url}</span>
        <div className="flex items-center gap-2">
          {blocked ? (
            <Badge tone="danger" icon={<Lock className="h-3 w-3" aria-hidden />}>
              Guard bloqueia
            </Badge>
          ) : (
            <Badge tone="success" icon={<ShieldCheck className="h-3 w-3" aria-hidden />}>
              HTTPS + IP publico
            </Badge>
          )}
          <Badge tone={webhook.active ? "success" : "neutral"}>{webhook.active ? "Ativo" : "Inativo"}</Badge>
        </div>
      </div>

      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="flex flex-col gap-2 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5">
          <span className="bloco-micro">Eventos assinados</span>
          <span className="flex flex-wrap gap-1">
            {webhook.events.map((event) => (
              <Badge key={event} tone="outline">
                {event}
              </Badge>
            ))}
          </span>
        </div>

        <span className="flex items-center justify-center text-fg-faint">
          <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" aria-hidden />
        </span>

        <div className="flex flex-col gap-2 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5">
          <span className="bloco-micro">Segredo (por referencia)</span>
          <span className="bloco-mono truncate text-fg">{webhook.secretRef}</span>
          <span className="bloco-caption">O valor vive no cofre; nunca e exibido.</span>
        </div>

        <span className="flex items-center justify-center text-fg-faint">
          <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" aria-hidden />
        </span>

        <div className="flex flex-col gap-2 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5">
          <span className="bloco-micro">Ultima entrega</span>
          <span className="bloco-callout text-fg">
            {deliveryLabel[webhook.delivery.lastStatus]} · {webhook.delivery.attempts} tentativa(s)
          </span>
          <span className="bloco-caption">
            {webhook.delivery.nextAttemptAt
              ? `Proxima: ${formatOpsDateTime(webhook.delivery.nextAttemptAt)}`
              : `Backoff: ${schedule[Math.min(webhook.backoffStep, schedule.length - 1)] ?? "—"}`}
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
