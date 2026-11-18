import * as React from "react";
import { Building2, Plug, Radio, Server, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge, Button, DataTable, Panel, Skeleton } from "@blocos/ui";
import type { BadgeTone, Column } from "@blocos/ui";
import { BlockFrame, requiresOf, rolesOf } from "../shared/index.js";
import type { BlockProps } from "../shared/index.js";
import { formatDateTime, formatPhone } from "./format.js";
import { channelConnectionsRecipe } from "./channel-connections.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

/** "oficial" = Cloud API da Meta; "auto-hospedado" = nao-oficial; "hospedado" = terceiro. */
export type ChannelProviderKind = "oficial" | "auto-hospedado" | "hospedado";

export type ChannelStatus = "ativo" | "pendente" | "erro";

export interface RiskAcceptance {
  /** Versao do texto de risco aceito. */
  version: string;
  /** Quem aceitou (owner do consultorio). */
  acceptedBy: string;
  /** Quando aceitou (ISO). */
  acceptedAt: string;
  note?: string;
}

export interface ChannelConnection {
  id: string;
  /** Nome do provedor exibido. */
  provider: string;
  kind: ChannelProviderKind;
  /** Numero do canal em E.164. */
  phoneNumber: string;
  status: ChannelStatus;
  /** WABA da Meta, quando o provedor tem. */
  waba?: {
    id?: string;
    name: string;
    status: string;
    reviewStatus?: string;
  };
  /** Aceite de risco versionado. Ausente em provedores nao oficiais = pendencia. */
  riskAcceptance?: RiskAcceptance | null;
  notes?: string;
}

export interface ChannelConnectionsData {
  connections: ChannelConnection[];
}

const KIND_LABEL: Record<ChannelProviderKind, string> = {
  oficial: "Oficial",
  "auto-hospedado": "Nao oficial (auto-hospedado)",
  hospedado: "Hospedado por terceiro",
};

const KIND_TONE: Record<ChannelProviderKind, BadgeTone> = {
  oficial: "success",
  "auto-hospedado": "danger",
  hospedado: "warn",
};

const KIND_ICON: Record<ChannelProviderKind, React.ReactNode> = {
  oficial: <ShieldCheck size={12} aria-hidden />,
  "auto-hospedado": <TriangleAlert size={12} aria-hidden />,
  hospedado: <Building2 size={12} aria-hidden />,
};

const STATUS_LABEL: Record<ChannelStatus, string> = {
  ativo: "Ativo",
  pendente: "Pendente",
  erro: "Com erro",
};

const STATUS_TONE: Record<ChannelStatus, BadgeTone> = {
  ativo: "success",
  pendente: "warn",
  erro: "danger",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function ChannelConnections(
  props: BlockProps<ChannelConnectionsData, "cards" | "table">,
) {
  const { data, onAction, variant = "cards", state = "success", connectors, onRequestConnector, className } =
    props;

  return (
    <BlockFrame
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
      loading={
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((card) => (
            <div key={card} className="flex flex-col gap-3 rounded-[var(--r-lg)] border border-border p-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      }
      empty={
        <div className="rounded-[var(--r-lg)] border border-dashed border-border p-6 text-center">
          <p className="bloco-headline">Nenhuma conexao de canal</p>
          <p className="bloco-callout mt-1 text-fg-muted">
            O dono do consultorio pode conectar o numero do WhatsApp aqui.
          </p>
        </div>
      }
        recipe={channelConnectionsRecipe}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <p className="bloco-caption text-fg-muted">
          Configuracao do canal do consultorio — visivel apenas para o dono. Nenhum trafega pelo bloco.
        </p>
        {variant === "table" ? (
          <ChannelTable connections={data.connections} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.connections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onReconnect={() =>
                  void onAction?.("channel.reconnect", { id: connection.id, provider: connection.provider })
                }
              />
            ))}
          </div>
        )}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: cartoes                                                    */
/* ------------------------------------------------------------------ */

function ConnectionCard({
  connection,
  onReconnect,
}: {
  connection: ChannelConnection;
  onReconnect: () => void;
}) {
  const risk = connection.riskAcceptance ?? null;

  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="bloco-title3 truncate" title={connection.provider}>
            {connection.provider}
          </h2>
          <p className="bloco-caption mt-0.5 break-words text-fg-muted">
            {formatPhone(connection.phoneNumber)}
          </p>
        </div>
        <Badge tone={STATUS_TONE[connection.status]}>{STATUS_LABEL[connection.status]}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={KIND_TONE[connection.kind]} icon={KIND_ICON[connection.kind]}>
          {KIND_LABEL[connection.kind]}
        </Badge>
        {connection.kind === "auto-hospedado" ? (
          <Badge tone="outline" icon={<Server size={12} aria-hidden />}>
            Servidor proprio
          </Badge>
        ) : null}
        {connection.kind === "hospedado" ? (
          <Badge tone="outline" icon={<Building2 size={12} aria-hidden />}>
            Provedor terceiro
          </Badge>
        ) : null}
      </div>

      {connection.waba ? (
        <div className="rounded-[var(--r-md)] border border-border bg-surface/60 p-3">
          <p className="bloco-micro flex items-center gap-1.5 text-fg-faint">
            <Radio size={11} aria-hidden /> WABA (Meta)
          </p>
          <p className="bloco-body mt-1 text-fg">{connection.waba.name}</p>
          <p className="bloco-caption mt-0.5 text-fg-muted">
            Status: {connection.waba.status}
            {connection.waba.reviewStatus ? ` · Revisao: ${connection.waba.reviewStatus}` : ""}
          </p>
          {connection.waba.id ? (
            <p className="bloco-mono mt-1 break-all text-[11px] text-fg-faint">{connection.waba.id}</p>
          ) : null}
        </div>
      ) : null}

      {risk ? (
        <div className="rounded-[var(--r-md)] border border-success/25 bg-success-soft p-3">
          <p className="bloco-micro flex items-center gap-1.5 text-success">
            <ShieldCheck size={11} aria-hidden /> Aceite de risco versionado
          </p>
          <p className="bloco-body mt-1 text-fg">{risk.version}</p>
          <p className="bloco-caption mt-0.5 text-fg-secondary">
            Aceito por {risk.acceptedBy} em {formatDateTime(risk.acceptedAt)}
          </p>
          {risk.note ? <p className="bloco-caption mt-1 text-fg-muted">{risk.note}</p> : null}
        </div>
      ) : connection.kind === "oficial" ? (
        <p className="bloco-caption rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2 text-fg-muted">
          Provedor oficial: nao exige aceite de risco.
        </p>
      ) : (
        <div className="rounded-[var(--r-md)] border border-danger/25 bg-danger-soft p-3">
          <p className="bloco-micro flex items-center gap-1.5 text-danger">
            <TriangleAlert size={11} aria-hidden /> Aceite de risco nao versionado
          </p>
          <p className="bloco-caption mt-1 text-fg-secondary">
            Este provedor exige aceite de risco registrado (versao, quem e quando) antes de operar.
          </p>
        </div>
      )}

      {connection.notes ? (
        <p className="bloco-caption text-fg-muted">{connection.notes}</p>
      ) : null}

      <div className="mt-auto">
        <Button
          variant="primary"
          size="sm"
          className="min-h-8"
          icon={<Plug size={14} aria-hidden />}
          /* Varios cartoes na tela: o nome acessivel diz qual provedor. */
          aria-label={`Reconectar ${connection.provider}`}
          onClick={onReconnect}
        >
          Reconectar
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: tabela                                                     */
/* ------------------------------------------------------------------ */

function ChannelTable({ connections }: { connections: ChannelConnection[] }) {
  const columns: Array<Column<ChannelConnection>> = [
    {
      key: "provider",
      header: "Provedor",
      render: (connection) => (
        <div className="min-w-0">
          <p className="bloco-headline truncate text-fg">{connection.provider}</p>
          <p className="bloco-caption text-fg-muted">{formatPhone(connection.phoneNumber)}</p>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Tipo",
      width: "200px",
      render: (connection) => (
        <Badge tone={KIND_TONE[connection.kind]} icon={KIND_ICON[connection.kind]}>
          {KIND_LABEL[connection.kind]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "110px",
      render: (connection) => (
        <Badge tone={STATUS_TONE[connection.status]}>{STATUS_LABEL[connection.status]}</Badge>
      ),
    },
    {
      key: "waba",
      header: "WABA",
      width: "190px",
      render: (connection) =>
        connection.waba ? (
          <div className="min-w-0">
            <p className="truncate text-fg-secondary">{connection.waba.name}</p>
            <p className="bloco-caption text-fg-faint">
              {connection.waba.status}
              {connection.waba.reviewStatus ? ` · ${connection.waba.reviewStatus}` : ""}
            </p>
          </div>
        ) : (
          <span className="text-fg-faint">—</span>
        ),
    },
    {
      key: "risk",
      header: "Aceite de risco",
      width: "230px",
      render: (connection) =>
        connection.riskAcceptance ? (
          <div className="min-w-0">
            <p className="text-fg-secondary">{connection.riskAcceptance.version}</p>
            <p className="bloco-caption text-fg-faint">
              {connection.riskAcceptance.acceptedBy} · {formatDateTime(connection.riskAcceptance.acceptedAt)}
            </p>
          </div>
        ) : connection.kind === "oficial" ? (
          <span className="text-fg-faint">Nao exigido</span>
        ) : (
          <Badge tone="danger" icon={<TriangleAlert size={11} aria-hidden />}>
            Nao versionado
          </Badge>
        ),
    },
  ];

  return (
    <Panel tone="solid" padding="none">
      <DataTable
        columns={columns}
        rows={connections}
        rowKey={(connection) => connection.id}
        empty={
          <p className="bloco-callout px-4 py-6 text-center text-fg-muted">
            Nenhuma conexao cadastrada.
          </p>
        }
      />
    </Panel>
  );
}
