import * as React from "react";
import {
  Badge,
  Button,
  Callout,
  DataTable,
  EmptyState,
  Panel,
  SectionHeader,
  Stat,
  type Column,
} from "@blocos/ui";
import {
  Activity,
  CircleAlert,
  CircleCheckBig,
  Clock,
  HardDriveDownload,
  ListChecks,
  ShieldCheck,
  TriangleAlert,
  Webhook,
} from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { formatOpsDateTime, formatOpsDuration } from "./format.js";
import { opsHealthRecipe } from "./ops-health.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type OpsCheckStatus = "ok" | "warn" | "error";

export interface OpsCheck {
  id: string;
  label: string;
  status: OpsCheckStatus;
  detail: string;
  /** ISO. */
  at: string;
}

export interface OpsQueue {
  id: string;
  name: string;
  pending: number;
  processing: number;
  failed: number;
  /** ISO — item mais antigo esperando. */
  oldestPendingAt?: string;
}

export interface OpsFailedWebhook {
  id: string;
  url: string;
  attempts: number;
  lastError: string;
  lastAttemptAt?: string;
}

export interface OpsHealthData {
  instrumentation: {
    enabled: boolean;
    /** Allowlist: somente estes campos saem para a telemetria. */
    allowedFields: string[];
    /** Campos que o scrub remove antes de gravar qualquer log. */
    scrubbedFields: string[];
    /** Amostragem (0 a 1). */
    sampleRate: number;
  };
  lastBackup: {
    at: string;
    durationMs: number;
    status: "ok" | "failed";
    sizeLabel: string;
    location: string;
  };
  queues: OpsQueue[];
  failedWebhooks: OpsFailedWebhook[];
  checks: OpsCheck[];
}

export type OpsHealthVariant = "cards" | "table" | "timeline";

/* ------------------------------------------------------------------ */
/* Helpers de apresentacao                                             */
/* ------------------------------------------------------------------ */

const checkTone: Record<OpsCheckStatus, "success" | "warn" | "danger"> = {
  ok: "success",
  warn: "warn",
  error: "danger",
};

const checkIcon: Record<OpsCheckStatus, React.ReactNode> = {
  ok: <CircleCheckBig className="h-3.5 w-3.5" aria-hidden />,
  warn: <TriangleAlert className="h-3.5 w-3.5" aria-hidden />,
  error: <CircleAlert className="h-3.5 w-3.5" aria-hidden />,
};

interface TimelineEvent {
  id: string;
  at: string;
  label: string;
  detail: string;
  status: OpsCheckStatus;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function OpsHealth(props: BlockProps<OpsHealthData, OpsHealthVariant>) {
  const { data, onAction, variant = "cards", state = "success", className, connectors, onRequestConnector } = props;

  const { instrumentation, lastBackup, queues, failedWebhooks, checks } = data;
  const totalPending = queues.reduce((sum, q) => sum + q.pending, 0);
  const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0);

  const events: TimelineEvent[] = [
    ...checks.map((check) => ({
      id: check.id,
      at: check.at,
      label: check.label,
      detail: check.detail,
      status: check.status,
    })),
    ...failedWebhooks.map((webhook) => ({
      id: webhook.id,
      at: webhook.lastAttemptAt ?? lastBackup.at,
      label: "Webhook com falha",
      detail: `${webhook.url} — ${webhook.lastError}`,
      status: "error" as OpsCheckStatus,
    })),
    {
      id: "backup",
      at: lastBackup.at,
      label: "Ultimo backup",
      detail: `${lastBackup.location} · ${lastBackup.sizeLabel} em ${formatOpsDuration(lastBackup.durationMs)}`,
      status: (lastBackup.status === "ok" ? "ok" : "error") as OpsCheckStatus,
    },
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <BlockFrame state={state} className={className}
        recipe={opsHealthRecipe}
        
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
      >
      <div className="@container flex flex-col gap-4">
        <SectionHeader
          eyebrow="Operacao"
          title="Saude da operacao"
          description="Instrumentacao, backup, filas e webhooks com falha — o suficiente para saber se o programa esta de pe antes do paciente ligar."
          actions={
            <Button
              icon={<HardDriveDownload className="h-4 w-4" aria-hidden />}
              onClick={() => onAction?.("ops.backup.run", {})}
            >
              Rodar backup
            </Button>
          }
        />

        {variant === "cards" ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 @[520px]:grid-cols-2 @[880px]:grid-cols-4">
              <Stat
                label="Ultimo backup"
                value={formatOpsDateTime(lastBackup.at)}
                icon={<HardDriveDownload className="h-4 w-4" aria-hidden />}
                hint={`${lastBackup.location} · ${lastBackup.sizeLabel} · ${formatOpsDuration(lastBackup.durationMs)}`}
              />
              <Stat
                label="Tarefas na fila"
                value={totalPending}
                icon={<ListChecks className="h-4 w-4" aria-hidden />}
                hint={`${totalPending} esperando · ${totalFailed} com falha`}
              />
              <Stat
                label="Webhooks com falha"
                value={failedWebhooks.length}
                icon={<Webhook className="h-4 w-4" aria-hidden />}
                hint={failedWebhooks.length > 0 ? "Precisam de inspecao manual" : "Nenhuma entrega pendente"}
              />
              <Stat
                label="Instrumentacao"
                value={instrumentation.enabled ? "Ativa" : "Desligada"}
                icon={<Activity className="h-4 w-4" aria-hidden />}
                hint={`Amostragem de ${Math.round(instrumentation.sampleRate * 100)}% · ${instrumentation.allowedFields.length} campos na allowlist`}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <InstrumentationPanel instrumentation={instrumentation} />
              <Panel tone="glass" padding="md" className="flex flex-col gap-3">
                <p className="bloco-title3">Filas</p>
                {queues.length === 0 ? (
                  <p className="bloco-caption">Nenhuma fila registrada.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {queues.map((queue) => (
                      <li
                        key={queue.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--r-md)] border border-border bg-surface/50 px-3 py-2.5"
                      >
                        <span className="bloco-callout font-medium text-fg">{queue.name}</span>
                        <span className="bloco-caption">
                          {queue.pending} esperando · {queue.processing} em andamento
                          {queue.failed > 0 ? (
                            <span className="ml-2 text-danger">{queue.failed} com falha</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <FailedWebhooks webhooks={failedWebhooks} />
          </div>
        ) : variant === "table" ? (
          <div className="flex flex-col gap-4">
            <Panel tone="outline" padding="none">
              <DataTable<OpsCheck>
                rowKey={(row) => row.id}
                rows={checks}
                columns={checkColumns}
                empty={<EmptyState title="Nenhuma checagem" description="As checagens de operacao aparecem aqui." />}
              />
            </Panel>

            <Panel tone="outline" padding="none">
              <DataTable<OpsQueue>
                rowKey={(row) => row.id}
                rows={queues}
                columns={queueColumns}
                empty={<EmptyState title="Nenhuma fila" description="Nenhuma fila de trabalho registrada." />}
              />
            </Panel>

            <FailedWebhooks webhooks={failedWebhooks} />
          </div>
        ) : (
          <Panel tone="outline" padding="md">
            {events.length === 0 ? (
              <EmptyState title="Sem eventos" description="Nada aconteceu na operacao ainda." />
            ) : (
              <ol className="flex flex-col">
                {events.map((event, index) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          event.status === "ok" ? "bg-success" : event.status === "warn" ? "bg-warn" : "bg-danger"
                        }`}
                        aria-hidden
                      />
                      {index < events.length - 1 ? <span className="w-px flex-1 bg-border" aria-hidden /> : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bloco-headline">{event.label}</span>
                        <Badge tone={checkTone[event.status]} icon={checkIcon[event.status]}>
                          {event.status === "ok" ? "Ok" : event.status === "warn" ? "Atencao" : "Erro"}
                        </Badge>
                        <span className="bloco-caption ml-auto">{formatOpsDateTime(event.at)}</span>
                      </div>
                      <p className="bloco-callout break-words text-fg-secondary">{event.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        )}

        <Callout tone="info" icon={<ShieldCheck className="h-4 w-4" aria-hidden />} title="Instrumentacao por allowlist">
          Saem para a telemetria somente os campos explicitamente permitidos. O scrub remove segredo e dado de saude
          antes de qualquer gravacao — inclusive no backup.
        </Callout>
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Pecas                                                               */
/* ------------------------------------------------------------------ */

function InstrumentationPanel({
  instrumentation,
}: {
  instrumentation: OpsHealthData["instrumentation"];
}) {
  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="bloco-title3">Allowlist de instrumentacao</p>
        <Badge tone={instrumentation.enabled ? "success" : "neutral"}>
          {instrumentation.enabled ? "Ativa" : "Desligada"}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <span className="bloco-micro">Campos permitidos</span>
        <div className="flex flex-wrap gap-1">
          {instrumentation.allowedFields.length === 0 ? (
            <span className="bloco-caption">Nenhum campo liberado.</span>
          ) : (
            instrumentation.allowedFields.map((field) => (
              <Badge key={field} tone="outline" icon={<ShieldCheck className="h-3 w-3" aria-hidden />}>
                {field}
              </Badge>
            ))
          )}
        </div>

        <span className="bloco-micro mt-1">Removidos pelo scrub</span>
        <div className="flex flex-wrap gap-1">
          {instrumentation.scrubbedFields.length === 0 ? (
            <span className="bloco-caption">Nada configurado.</span>
          ) : (
            instrumentation.scrubbedFields.map((field) => (
              <Badge key={field} tone="danger">
                {field}
              </Badge>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}

function FailedWebhooks({ webhooks }: { webhooks: OpsFailedWebhook[] }) {
  if (webhooks.length === 0) {
    return (
      <Callout tone="success" icon={<CircleCheckBig className="h-4 w-4" aria-hidden />} title="Nenhum webhook com falha">
        Todas as entregas de saida foram concluidas ou estao aguardando a proxima tentativa.
      </Callout>
    );
  }

  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="bloco-title3">Webhooks com falha</p>
        <Badge tone="danger">{webhooks.length}</Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {webhooks.map((webhook) => (
          <li key={webhook.id} className="rounded-[var(--r-md)] border border-border bg-danger-soft/40 px-3 py-2.5">
            <span className="bloco-mono block truncate text-fg">{webhook.url}</span>
            <span className="bloco-caption block">
              {webhook.attempts} tentativa(s) · {formatOpsDateTime(webhook.lastAttemptAt)} · {webhook.lastError}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Colunas                                                             */
/* ------------------------------------------------------------------ */

const checkColumns: Array<Column<OpsCheck>> = [
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge tone={checkTone[row.status]} icon={checkIcon[row.status]}>
        {row.status === "ok" ? "Ok" : row.status === "warn" ? "Atencao" : "Erro"}
      </Badge>
    ),
  },
  {
    key: "label",
    header: "Checagem",
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-medium text-fg">{row.label}</span>
        <span className="bloco-caption">{row.detail}</span>
      </span>
    ),
  },
  {
    key: "at",
    header: "Quando",
    align: "right",
    render: (row) => <span className="bloco-caption">{formatOpsDateTime(row.at)}</span>,
  },
];

const queueColumns: Array<Column<OpsQueue>> = [
  {
    key: "name",
    header: "Fila",
    render: (row) => <span className="font-medium text-fg">{row.name}</span>,
  },
  {
    key: "pending",
    header: "Esperando",
    align: "right",
    render: (row) => <span className="tabular-nums">{row.pending}</span>,
  },
  {
    key: "processing",
    header: "Em andamento",
    align: "right",
    render: (row) => <span className="tabular-nums">{row.processing}</span>,
  },
  {
    key: "failed",
    header: "Com falha",
    align: "right",
    render: (row) => (
      <span className={row.failed > 0 ? "tabular-nums text-danger" : "tabular-nums"}>{row.failed}</span>
    ),
  },
  {
    key: "oldest",
    header: "Mais antiga",
    align: "right",
    render: (row) => (
      <span className="bloco-caption">
        <Clock className="mr-1 inline h-3 w-3" aria-hidden />
        {row.oldestPendingAt ? formatOpsDateTime(row.oldestPendingAt) : "—"}
      </span>
    ),
  },
];
