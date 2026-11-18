import * as React from "react";
import {
  Badge,
  Button,
  Callout,
  ConnectorLock,
  DataTable,
  EmptyState,
  KeyValue,
  Panel,
  SectionHeader,
  type Column,
} from "@blocos/ui";
import {
  CircleAlert,
  CircleCheckBig,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { integrationManifestRecipe } from "./integration-manifest.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type ManifestConnectorId =
  | "whatsapp"
  | "anthropic"
  | "instagram"
  | "meta_ads"
  | "webhooks"
  | "storage"
  | "email"
  | "pdf"
  | "database";

export type ManifestConnectorStatus = "provisioned" | "missing" | "error";

export interface ManifestConnector {
  id: ManifestConnectorId;
  label: string;
  /** Tipo tecnico do conector. */
  kind: "api" | "whatsapp" | "webhook" | "oauth" | "llm" | "storage" | "database";
  status: ManifestConnectorStatus;
  /** Quem pode provisionar. Aqui e SEMPRE o dono da plataforma. */
  provisionedBy: string;
  /** NOMES das variaveis de ambiente esperadas. Nunca os valores. */
  env: string[];
  /** O que este conector destrava no programa. */
  unlocks: string[];
  /** Passo a passo de provisionamento, sem segredo. */
  howTo?: string;
  /** Ultimo erro conhecido. Nunca contem segredo. */
  message?: string;
}

export interface IntegrationManifestData {
  connectors: ManifestConnector[];
  /** Quem esta olhando o manifesto. */
  viewer: {
    isPlatformOwner: boolean;
    name?: string;
  };
  /** Nome do programa, exibido no cabecalho. */
  programName?: string;
}

export type IntegrationManifestVariant = "cards" | "table" | "checklist";

/* ------------------------------------------------------------------ */
/* Helpers de apresentacao                                             */
/* ------------------------------------------------------------------ */

const statusTone: Record<ManifestConnectorStatus, "success" | "warn" | "danger"> = {
  provisioned: "success",
  missing: "warn",
  error: "danger",
};

const statusLabel: Record<ManifestConnectorStatus, string> = {
  provisioned: "Provisionado",
  missing: "Falta provisionar",
  error: "Com erro",
};

const kindLabel: Record<ManifestConnector["kind"], string> = {
  api: "API",
  whatsapp: "WhatsApp",
  webhook: "Webhook",
  oauth: "OAuth",
  llm: "LLM",
  storage: "Storage",
  database: "Banco de dados",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function IntegrationManifest(props: BlockProps<IntegrationManifestData, IntegrationManifestVariant>) {
  const { data, onAction, variant = "cards", state = "success", onRequestConnector, className, connectors } = props;

  const listaConectores = data.connectors;
  const ready = listaConectores.filter((c) => c.status === "provisioned");
  const pending = listaConectores.filter((c) => c.status !== "provisioned");
  const isOwner = data.viewer.isPlatformOwner;

  return (
    <BlockFrame state={state} className={className}
        /* o manifesto NAO se bloqueia: e justamente o painel que mostra o que falta */
        recipe={integrationManifestRecipe}
        requires={[]}
        requiredRoles={rolesOf(integrationManifestRecipe)}
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow={data.programName ? `Programa · ${data.programName}` : "Programa"}
          title="Manifesto de conexoes"
          description="Todo conector de que o programa precisa, quem pode provisionar e o que cada um destrava. Este e o unico lugar onde um conector e provisionado."
          actions={
            <Badge tone="accent" icon={<Lock className="h-3.5 w-3.5" aria-hidden />}>
              Somente o dono da plataforma
            </Badge>
          }
        />

        <Callout
          tone="accent"
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          title="Acesso de implementacao apenas do dono do programa"
        >
          Ninguem mais provisiona conector. O dono da plataforma e o unico que pode; o dono do consultorio opera o
          consultorio, nao a implementacao. As variaveis de ambiente aparecem aqui <strong>somente como nome</strong> —
          o valor vive no cofre e nunca passa pela interface.
        </Callout>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Conectores" value={listaConectores.length} hint={`${ready.length} prontos`} />
          <SummaryTile label="Faltam" value={pending.length} hint={pending.length > 0 ? "Bloqueiam parte do programa" : "Tudo pronto"} />
          <SummaryTile
            label="Quem provisiona"
            value="Dono da plataforma"
            hint="Em todos os conectores"
          />
        </div>

        {!isOwner ? (
          <ConnectorLock
            connectorLabel="Conectores do programa"
            onRequestAccess={() => onRequestConnector?.("connector.provision")}
          />
        ) : listaConectores.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-5 w-5" aria-hidden />}
            title="Nenhum conector cadastrado"
            description="Cadastre os conectores do programa para que o manifesto reflita o que falta."
          />
        ) : variant === "table" ? (
          <Panel tone="outline" padding="none">
            <DataTable<ManifestConnector>
              rowKey={(row) => row.id}
              rows={listaConectores}
              columns={manifestColumns(onAction, pending[0]?.id)}
              empty={<EmptyState title="Nenhum conector" description="O manifesto esta vazio." />}
            />
          </Panel>
        ) : variant === "checklist" ? (
          <div className="flex flex-col gap-4">
            <ChecklistGroup
              title="Prontos para uso"
              tone="success"
              connectors={ready}
              onAction={onAction}
              isOwner={isOwner}
              primaryId={pending[0]?.id}
            />
            <ChecklistGroup
              title="Faltam provisionar"
              tone="warn"
              connectors={pending}
              onAction={onAction}
              isOwner={isOwner}
              primaryId={pending[0]?.id}
            />
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {listaConectores.map((connector) => (
              <ConnectorCard
                key={connector.id}
                connector={connector}
                onAction={onAction}
                isOwner={isOwner}
                /* Um elemento focal por tela: so o primeiro conector pendente fica primary. */
                isPrimary={connector.id === pending[0]?.id}
              />
            ))}
          </div>
        )}

        <Callout tone="info" icon={<KeyRound className="h-4 w-4" aria-hidden />} title="Segredo e referencia">
          O manifesto lista os <span className="bloco-mono">NAMES</span> das variaveis (por exemplo{" "}
          <span className="bloco-mono">WHATSAPP_ACCESS_TOKEN</span>). O valor e lido pelo runtime, no servidor, direto do
          cofre — e nunca aparece na tela, no log ou na URL.
        </Callout>
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacoes                                                           */
/* ------------------------------------------------------------------ */

function SummaryTile({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <Panel tone="outline" padding="sm" className="flex flex-col gap-2">
      <span className="bloco-micro break-words">{label}</span>
      <span className="bloco-title3 break-words">{value}</span>
      <span className="bloco-caption break-words">{hint}</span>
    </Panel>
  );
}

function ConnectorCard({
  connector,
  onAction,
  isOwner,
  isPrimary,
}: {
  connector: ManifestConnector;
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
  isOwner: boolean;
  isPrimary: boolean;
}) {
  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="bloco-title3 truncate" title={connector.label}>{connector.label}</p>
          <p className="bloco-caption">
            {kindLabel[connector.kind]} · id <span className="bloco-mono">{connector.id}</span>
          </p>
        </div>
        <Badge tone={statusTone[connector.status]} icon={connector.status === "provisioned" ? <CircleCheckBig className="h-3 w-3" aria-hidden /> : <CircleAlert className="h-3 w-3" aria-hidden />}>
          {statusLabel[connector.status]}
        </Badge>
      </div>

      <KeyValue
        columns={1}
        items={[
          {
            label: "Quem pode provisionar",
            value: (
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-fg-muted" aria-hidden />
                {connector.provisionedBy}
              </span>
            ),
          },
          {
            label: "Variaveis de ambiente (nome)",
            value: connector.env.length === 0 ? (
              <span className="bloco-caption">Nenhuma variavel esperada.</span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {connector.env.map((name) => (
                  <span
                    key={name}
                    className="bloco-mono rounded-[var(--r-sm)] border border-border bg-surface/60 px-1.5 py-0.5 bloco-label text-fg-secondary"
                  >
                    {name}
                  </span>
                ))}
              </span>
            ),
          },
          {
            label: "O que destrava",
            value: connector.unlocks.length === 0 ? (
              <span className="bloco-caption">Nada informado.</span>
            ) : (
              <ul className="flex flex-col gap-2">
                {connector.unlocks.map((item) => (
                  <li key={item} className="bloco-callout flex items-start gap-1.5 text-fg-secondary">
                    <CircleCheckBig className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />

      {connector.message ? (
        <p className="bloco-caption rounded-[var(--r-sm)] bg-danger-soft px-3 py-2 text-danger">{connector.message}</p>
      ) : null}

      {connector.howTo ? (
        <p className="bloco-caption border-l-2 border-border pl-2.5">{connector.howTo}</p>
      ) : null}

      {connector.status === "provisioned" ? (
        <div className="mt-auto border-t border-border pt-3">
          <span className="bloco-caption flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            Conector pronto. Nenhum segredo trafega por aqui.
          </span>
        </div>
      ) : isOwner ? (
        <div className="mt-auto border-t border-border pt-3">
          <Button
            size="sm"
            variant={isPrimary ? "primary" : "secondary"}
            icon={<Plus className="h-3.5 w-3.5" aria-hidden />}
            aria-label={`Provisionar ${connector.label}`}
            onClick={() => onAction?.("connector.provision", { connectorId: connector.id })}
          >
            Provisionar
          </Button>
        </div>
      ) : (
        <div className="mt-auto border-t border-border pt-3">
          <ConnectorLock
            connectorLabel={connector.label}
            onRequestAccess={() => onAction?.("connector.provision", { connectorId: connector.id })}
          />
        </div>
      )}
    </Panel>
  );
}

function ChecklistGroup({
  title,
  tone,
  connectors,
  onAction,
  isOwner,
  primaryId,
}: {
  title: string;
  tone: "success" | "warn";
  connectors: ManifestConnector[];
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
  isOwner: boolean;
  /** Conector que concentra a acao principal da tela. */
  primaryId?: string;
}) {
  if (connectors.length === 0) {
    return (
      <Panel tone="outline" padding="sm" className="flex items-center gap-2">
        <CircleCheckBig className="h-4 w-4 text-success" aria-hidden />
        <span className="bloco-callout text-fg-secondary">{title}: nada por aqui.</span>
      </Panel>
    );
  }

  return (
    <Panel tone="outline" padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="bloco-title3">{title}</p>
        <Badge tone={tone}>{connectors.length}</Badge>
      </div>

      <ul className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <li key={connector.id} className="rounded-[var(--r-md)] border border-border bg-surface/50 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                {connector.status === "provisioned" ? (
                  <CircleCheckBig className="h-4 w-4 text-success" aria-hidden />
                ) : (
                  <CircleAlert className="h-4 w-4 text-warn" aria-hidden />
                )}
                <span className="bloco-callout font-medium text-fg">{connector.label}</span>
                <span className="bloco-micro">{kindLabel[connector.kind]}</span>
              </span>

              {connector.status !== "provisioned" && isOwner ? (
                <Button
                  size="sm"
                  variant={connector.id === primaryId ? "primary" : "secondary"}
                  icon={<Plus className="h-3.5 w-3.5" aria-hidden />}
                  aria-label={`Provisionar ${connector.label}`}
                  onClick={() => onAction?.("connector.provision", { connectorId: connector.id })}
                >
                  Provisionar
                </Button>
              ) : null}
            </div>

            <div className="mt-2 flex flex-col gap-2">
              <span className="bloco-micro">Variaveis (nome)</span>
              <span className="flex flex-wrap gap-1">
                {connector.env.map((name) => (
                  <span
                    key={name}
                    className="bloco-mono rounded-[var(--r-sm)] border border-border bg-surface/60 px-1.5 py-0.5 bloco-label text-fg-secondary"
                  >
                    {name}
                  </span>
                ))}
              </span>
              <span className="bloco-micro mt-1">Destrava</span>
              <span className="bloco-caption">{connector.unlocks.join(" · ")}</span>
              <span className="bloco-micro mt-1">Provisionado por</span>
              <span className="bloco-caption flex items-center gap-1.5">
                <Lock className="h-3 w-3" aria-hidden />
                {connector.provisionedBy}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function manifestColumns(
  onAction?: (action: string, payload?: unknown) => void | Promise<void>,
  primaryId?: string,
): Array<Column<ManifestConnector>> {
  return [
    {
      key: "connector",
      header: "Conector",
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-fg">{row.label}</span>
          <span className="bloco-caption">
            {kindLabel[row.kind]} · <span className="bloco-mono">{row.id}</span>
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>,
    },
    {
      key: "owner",
      header: "Quem provisiona",
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-fg-muted" aria-hidden />
          {row.provisionedBy}
        </span>
      ),
    },
    {
      key: "env",
      header: "Variaveis (nome)",
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.env.map((name) => (
            <span
              key={name}
              className="bloco-mono rounded-[var(--r-sm)] border border-border bg-surface/60 px-1.5 py-0.5 bloco-label text-fg-secondary"
            >
              {name}
            </span>
          ))}
        </span>
      ),
    },
    {
      key: "unlocks",
      header: "Destrava",
      render: (row) => <span className="bloco-caption">{row.unlocks.join(" · ")}</span>,
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (row) =>
        row.status === "provisioned" ? (
          <span className="bloco-caption flex items-center justify-end gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-success" aria-hidden />
            pronto
          </span>
        ) : (
          <Button
            size="sm"
            variant={row.id === primaryId ? "primary" : "secondary"}
            icon={<Plus className="h-3.5 w-3.5" aria-hidden />}
            aria-label={`Provisionar ${row.label}`}
            onClick={() => onAction?.("connector.provision", { connectorId: row.id })}
          >
            Provisionar
          </Button>
        ),
    },
  ];
}
