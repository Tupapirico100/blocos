import * as React from "react";
import {
  Badge,
  Button,
  Callout,
  DataTable,
  EmptyState,
  Panel,
  SectionHeader,
  type Column,
} from "@blocos/ui";
import { CircleAlert, CircleCheckBig, Clock, RefreshCw, Terminal, TriangleAlert } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { formatSocialDateTime } from "./format.js";
import { socialLogsRecipe } from "./social-logs.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type SocialLogLevel = "info" | "warn" | "error";
export type SocialLogStatus = "concluido" | "falhou" | "pendente";

export interface SocialLogEntry {
  id: string;
  level: SocialLogLevel;
  /** Conta em que o evento ocorreu. */
  accountHandle: string;
  /** O que aconteceu: "publicacao", "comentario", "publicacao agendada"... */
  action: string;
  /** Resumo sem dado sensivel. */
  message: string;
  /** ISO. */
  createdAt: string;
  status: SocialLogStatus;
  /** Falhou e pode ser reexecutado? */
  retryable?: boolean;
}

export interface SocialLogsData {
  logs: SocialLogEntry[];
}

export type SocialLogsVariant = "table" | "timeline";

/* ------------------------------------------------------------------ */
/* Helpers de apresentacao                                             */
/* ------------------------------------------------------------------ */

const levelTone: Record<SocialLogLevel, "info" | "warn" | "danger"> = {
  info: "info",
  warn: "warn",
  error: "danger",
};

const levelLabel: Record<SocialLogLevel, string> = {
  info: "Info",
  warn: "Atencao",
  error: "Erro",
};

const statusTone: Record<SocialLogStatus, "success" | "danger" | "neutral"> = {
  concluido: "success",
  falhou: "danger",
  pendente: "neutral",
};

const levelDot: Record<SocialLogLevel, string> = {
  info: "bg-info",
  warn: "bg-warn",
  error: "bg-danger",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialLogs(props: BlockProps<SocialLogsData, SocialLogsVariant>) {
  const { data, onAction, variant = "table", state = "success", className, connectors, onRequestConnector } = props;

  const logs = data.logs;
  const hasLogs = logs.length > 0;

  return (
    <BlockFrame state={state} className={className}
        recipe={socialLogsRecipe}

        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
        empty={
          <EmptyState
            icon={<Terminal className="h-5 w-5" aria-hidden />}
            title="Nenhum registro ainda"
            description="Assim que houver publicacao ou interacao, o historico aparece aqui."
          />
        }
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Agendador-Instagram"
          title="Logs de publicacao e interacao"
          description="Tudo que saiu para o Instagram, com nivel, conta, acao e horario. Falhas repetidas podem ser reexecutadas."
        />

        {!hasLogs ? (
          <EmptyState
            icon={<Terminal className="h-5 w-5" aria-hidden />}
            title="Nenhum registro ainda"
            description="Assim que houver publicacao ou interacao, o historico aparece aqui."
          />
        ) : variant === "timeline" ? (
          <Panel tone="outline" padding="md">
            <ol className="flex flex-col">
              {logs.map((entry, index) => (
                <li key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${levelDot[entry.level]}`} aria-hidden />
                    {index < logs.length - 1 ? <span className="w-px flex-1 bg-border" aria-hidden /> : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={levelTone[entry.level]}>{levelLabel[entry.level]}</Badge>
                      <span className="bloco-headline">{entry.action}</span>
                      <Badge tone={statusTone[entry.status]}>{entry.status}</Badge>
                      <span className="bloco-caption ml-auto">{formatSocialDateTime(entry.createdAt)}</span>
                    </div>
                    <p className="bloco-callout text-fg-secondary">{entry.message}</p>
                    <span className="bloco-caption">{entry.accountHandle}</span>
                    {entry.retryable ? (
                      <div>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
                          aria-label={`Reexecutar ${entry.action} em ${entry.accountHandle}`}
                          onClick={() => onAction?.("log.retry", { id: entry.id })}
                        >
                          Reexecutar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        ) : (
          <Panel tone="outline" padding="none">
            <DataTable<SocialLogEntry>
              rowKey={(row) => row.id}
              rows={logs}
              columns={logColumns(onAction)}
              empty={<EmptyState title="Nenhum registro ainda" description="O historico aparece aqui." />}
            />
          </Panel>
        )}

        <Callout tone="info" icon={<CircleCheckBig className="h-4 w-4" aria-hidden />} title="Log sem dado sensivel">
          O registro guarda acao, conta, nivel e horario. Nao entram token, legenda completa, mensagem de paciente ou
          qualquer dado de saude — a fila de eventos da Meta usa chave deterministica para nao duplicar entrega.
        </Callout>
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Colunas                                                             */
/* ------------------------------------------------------------------ */

function logColumns(
  onAction?: (action: string, payload?: unknown) => void | Promise<void>,
): Array<Column<SocialLogEntry>> {
  return [
    {
      key: "level",
      header: "Nivel",
      render: (row) => (
        <Badge tone={levelTone[row.level]} icon={row.level === "error" ? <CircleAlert className="h-3 w-3" aria-hidden /> : row.level === "warn" ? <TriangleAlert className="h-3 w-3" aria-hidden /> : <Clock className="h-3 w-3" aria-hidden />}>
          {levelLabel[row.level]}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Acao",
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-fg">{row.action}</span>
          <span className="bloco-caption">{row.message}</span>
        </span>
      ),
    },
    {
      key: "account",
      header: "Conta",
      render: (row) => <span className="bloco-mono">{row.accountHandle}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    {
      key: "createdAt",
      header: "Data",
      align: "right",
      render: (row) => <span className="bloco-caption">{formatSocialDateTime(row.createdAt)}</span>,
    },
    {
      key: "retry",
      header: "",
      align: "right",
      render: (row) =>
        row.retryable ? (
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
            aria-label={`Reexecutar ${row.action} em ${row.accountHandle}`}
            onClick={() => onAction?.("log.retry", { id: row.id })}
          >
            Reexecutar
          </Button>
        ) : (
          <span className="bloco-caption">—</span>
        ),
    },
  ];
}
