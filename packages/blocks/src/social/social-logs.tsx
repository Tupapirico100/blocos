import * as React from "react";
import { DataTable, EmptyState, type Column } from "@blocos/ui";
import { ScrollText } from "lucide-react";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { formatSocialDateTime } from "./format.js";
import { socialLogsRecipe } from "./social-logs.recipe.js";
import { StatusDot, type StatusTone } from "./status.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type SocialLogStatus = "sent" | "error" | "pending" | "skipped";

export interface SocialLogEntry {
  id: string;
  /** ISO. */
  at: string;
  /** Sem o "@". `null` = conta removida. */
  account: string | null;
  /** Nome da automacao. `null` = automacao removida. */
  automation: string | null;
  /** Quem escreveu: @ (sem o "@") ou, sem ele, o id da Meta. */
  from: string;
  fromIsUsername: boolean;
  /** Texto recebido (comentario ou direct). */
  text: string;
  status: SocialLogStatus;
  /** Mensagem de erro ja tratada (sem token, sem corpo cru da Meta). */
  error?: string | null;
}

export interface SocialLogsData {
  entries: SocialLogEntry[];
}

export type SocialLogsVariant = "table" | "timeline";

const STATUS: Record<SocialLogStatus, { label: string; tone: StatusTone }> = {
  sent: { label: "Enviada", tone: "success" },
  error: { label: "Erro", tone: "danger" },
  pending: { label: "Em andamento", tone: "warn" },
  skipped: { label: "Ignorada", tone: "neutral" },
};

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialLogs(props: BlockProps<SocialLogsData, SocialLogsVariant>) {
  const { data, onAction, variant = "table", state = "success", connectors, onRequestConnector, className } = props;

  const empty = (
    <EmptyState
      icon={<ScrollText className="h-5 w-5" aria-hidden />}
      title="Nada por aqui ainda"
      description="Quando uma automação responder alguém, o registro aparece aqui, inclusive os erros."
    />
  );

  const who = (e: SocialLogEntry) => (e.fromIsUsername ? `@${e.from}` : e.from);

  const columns: Array<Column<SocialLogEntry>> = [
    {
      key: "at",
      header: "Quando",
      width: "9rem",
      render: (e) => <span className="whitespace-nowrap tabular-nums">{formatSocialDateTime(e.at)}</span>,
    },
    { key: "account", header: "Conta", render: (e) => (e.account ? `@${e.account}` : "conta removida") },
    { key: "automation", header: "Automação", render: (e) => e.automation ?? "removida" },
    { key: "from", header: "Quem", render: (e) => who(e) },
    {
      key: "text",
      header: "Texto recebido",
      render: (e) => <span className="block max-w-[28ch] break-words">{e.text}</span>,
    },
    {
      key: "status",
      header: "Resultado",
      render: (e) => (
        <div className="flex flex-col gap-1">
          <StatusDot tone={STATUS[e.status].tone} label={STATUS[e.status].label} />
          {e.error ? <span className="bloco-caption max-w-[32ch] break-words text-danger">{e.error}</span> : null}
        </div>
      ),
    },
  ];

  return (
    <BlockFrame
      recipe={socialLogsRecipe}
      onAction={onAction}
      requires={[]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
    >
      {data.entries.length === 0 ? (
        empty
      ) : variant === "timeline" ? (
        <ol className="flex flex-col">
          {data.entries.map((e) => (
            <li key={e.id} className="grid grid-cols-[auto_1fr] gap-x-3 border-b border-border py-3 last:border-0">
              <span className="bloco-caption whitespace-nowrap pt-0.5 tabular-nums text-fg-muted">{formatSocialDateTime(e.at)}</span>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusDot tone={STATUS[e.status].tone} label={STATUS[e.status].label} />
                  <span className="bloco-callout text-fg">{who(e)}</span>
                  <span className="bloco-caption text-fg-muted">
                    {e.automation ?? "automação removida"} · {e.account ? `@${e.account}` : "conta removida"}
                  </span>
                </div>
                <p className="bloco-callout break-words text-fg-secondary">{e.text}</p>
                {e.error ? <p className="bloco-caption break-words text-danger">{e.error}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <DataTable columns={columns} rows={data.entries} rowKey={(e) => e.id} empty={empty} />
      )}
    </BlockFrame>
  );
}
