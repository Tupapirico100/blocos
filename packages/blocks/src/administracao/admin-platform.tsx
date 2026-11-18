import * as React from "react";
import { motion } from "motion/react";
import {
  Building2,
  Crown,
  MessageCircle,
  Plus,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Badge, Button, Callout, DataTable, EmptyState, Panel, SectionHeader, Stat } from "@blocos/ui";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { adminPlatformRecipe } from "./admin-platform.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type AdminPlatformVariant = "cards" | "table" | "split";
export type AdminOfficeStatus = "active" | "trial" | "suspended";

export interface AdminPlatformOffice {
  id: string;
  /** Nome do consultorio. */
  name: string;
  /** Cidade do consultorio. */
  city: string;
  status: AdminOfficeStatus;
  /** Membros com acesso ao consultorio. */
  members: number;
  /** Leads que entraram hoje. */
  leadsToday: number;
  /** Canal conectado do consultorio. */
  channel: { connected: boolean; provider?: string; phone?: string };
  createdAt: string;
}

export interface AdminPlatformData {
  /** Quem esta olhando o painel. */
  viewer: { name: string; email: string; isPlatformOwner: boolean };
  /** Metricas agregadas da plataforma. */
  metrics: {
    activeOffices: number;
    members: number;
    leadsToday: number;
    conversations: number;
  };
  /** Consultorios administrados pelo dono da plataforma. */
  offices: AdminPlatformOffice[];
  notice?: string;
}

const MOTION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] } as const;

const STATUS_TONE: Record<AdminOfficeStatus, "success" | "info" | "warn"> = {
  active: "success",
  trial: "info",
  suspended: "warn",
};

const STATUS_LABEL: Record<AdminOfficeStatus, string> = {
  active: "Ativo",
  trial: "Em teste",
  suspended: "Suspenso",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function AdminPlatform(props: BlockProps<AdminPlatformData, AdminPlatformVariant>) {
  const { data, onAction, variant = "cards", state, connectors, onRequestConnector } = props;

  const offices = data.offices;

  const openOffice = (officeId: string) => {
    void onAction?.("admin.office.open", { officeId });
  };

  const createOffice = () => {
    void onAction?.("admin.office.create", {});
  };

  /* ---- Banner de acesso total ---- */

  const ownerBanner = (
    <Callout
      tone="accent"
      title="Painel do dono da plataforma"
      icon={<Crown className="h-4 w-4" aria-hidden />}
      action={
        <Badge tone="accent" icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}>
          acesso total
        </Badge>
      }
    >
      Voce administra a plataforma inteira: todos os consultorios, membros e canais ficam visiveis
      aqui. Este acesso nao pode ser rebaixado nem removido pelo dono do consultorio.
    </Callout>
  );

  /* ---- Metricas ---- */

  const metrics = (dense: boolean) => (
    <div
      className={
        dense
          ? "grid grid-cols-2 gap-3"
          : "grid grid-cols-1 gap-3 @[520px]:grid-cols-2 @[860px]:grid-cols-4"
      }
    >
      <Stat
        label="Consultorios ativos"
        value={data.metrics.activeOffices}
        icon={<Building2 className="h-4 w-4" aria-hidden />}
        hint="com operacao em andamento"
      />
      <Stat
        label="Membros"
        value={data.metrics.members}
        icon={<UsersRound className="h-4 w-4" aria-hidden />}
        hint="em todos os consultorios"
      />
      <Stat
        label="Leads hoje"
        value={data.metrics.leadsToday}
        icon={<UserRound className="h-4 w-4" aria-hidden />}
        hint="pessoas que iniciaram contato"
      />
      <Stat
        label="Conversas"
        value={data.metrics.conversations}
        icon={<MessageCircle className="h-4 w-4" aria-hidden />}
        hint="janelas de atendimento abertas"
      />
    </div>
  );

  /* ---- Cartao de consultorio ---- */

  const officeCard = (office: AdminPlatformOffice) => (
    <Panel
      key={office.id}
      tone="glass"
      padding="md"
      interactive
      role="button"
      tabIndex={0}
      aria-label={`Abrir consultorio ${office.name}`}
      onClick={() => openOffice(office.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openOffice(office.id);
        }
      }}
      className="flex min-w-[180px] flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="bloco-headline truncate" title={office.name}>{office.name}</p>
          <p className="bloco-caption break-words text-fg-muted">{office.city}</p>
        </div>
        <Badge tone={STATUS_TONE[office.status]}>{STATUS_LABEL[office.status]}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={office.channel.connected ? "success" : "neutral"}>
          {office.channel.connected ? "WhatsApp conectado" : "WhatsApp nao conectado"}
        </Badge>
        {office.channel.provider ? (
          <Badge tone="outline">{office.channel.provider}</Badge>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div className="min-w-0">
          <dt className="bloco-micro break-words text-fg-muted">Membros</dt>
          <dd className="bloco-body text-fg tabular-nums">{office.members}</dd>
        </div>
        <div className="min-w-0">
          <dt className="bloco-micro break-words text-fg-muted">Leads hoje</dt>
          <dd className="bloco-body text-fg tabular-nums">{office.leadsToday}</dd>
        </div>
      </dl>

      <p className="bloco-micro text-fg-faint">
        Criado em {formatDate(office.createdAt)}
        {office.channel.phone ? ` · ${office.channel.phone}` : ""}
      </p>
    </Panel>
  );

  /* ---- Tabela ---- */

  const table = (
    <DataTable
      rows={offices}
      rowKey={(office) => office.id}
      onRowClick={(office) => openOffice(office.id)}
      columns={[
        {
          key: "name",
          header: "Consultorio",
          render: (office) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-fg" title={office.name}>{office.name}</p>
              <p className="bloco-caption break-words text-fg-muted">{office.city}</p>
            </div>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (office) => <Badge tone={STATUS_TONE[office.status]}>{STATUS_LABEL[office.status]}</Badge>,
        },
        {
          key: "members",
          header: "Membros",
          align: "right",
          render: (office) => office.members,
        },
        {
          key: "leadsToday",
          header: "Leads hoje",
          align: "right",
          render: (office) => office.leadsToday,
        },
        {
          key: "channel",
          header: "Canal",
          render: (office) => (
            <Badge tone={office.channel.connected ? "success" : "neutral"}>
              {office.channel.connected ? "WhatsApp sim" : "WhatsApp nao"}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: "Criado em",
          render: (office) => formatDate(office.createdAt),
        },
      ]}
    />
  );

  /* ---- Lista compacta (usada no split) ---- */

  const compactList = (
    <ul className="flex flex-col gap-2">
      {offices.map((office) => (
        <li key={office.id}>
          <button
            type="button"
            onClick={() => openOffice(office.id)}
            className="flex w-full items-center justify-between gap-3 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5 text-left transition-colors hover:border-border-strong hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="min-w-0">
              <span className="block truncate bloco-control font-medium text-fg" title={office.name}>{office.name}</span>
              <span className="bloco-caption block break-words text-fg-muted">
                {office.city} · {office.members} membros
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Badge tone={STATUS_TONE[office.status]}>{STATUS_LABEL[office.status]}</Badge>
              <Badge tone={office.channel.connected ? "success" : "neutral"}>
                {office.channel.connected ? "WhatsApp sim" : "WhatsApp nao"}
              </Badge>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  /* ---- Variacoes ---- */

  const header = (
    <SectionHeader
      eyebrow="Plataforma"
      title="Consultorios administrados"
      description="Visao do dono da plataforma sobre todos os consultorios ativos, em teste ou suspensos."
      actions={
        <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={createOffice}>
          Novo consultório
        </Button>
      }
    />
  );

  if (variant === "table") {
    return (
      <BlockFrame
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        state={state}
        empty={
          <EmptyState
            icon={<Building2 className="h-5 w-5" aria-hidden />}
            title="Nenhum consultorio ainda"
            description="Crie o primeiro consultorio para comecar a atender."
            action={
              <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={createOffice}>
                Novo consultório
              </Button>
            }
          />
        }
        className="flex flex-col gap-4"
        recipe={adminPlatformRecipe}
        onAction={onAction}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION}
          className="@container flex flex-col gap-4"
        >
          {ownerBanner}
          {data.notice ? <Callout tone="info">{data.notice}</Callout> : null}
          {header}
          {metrics(false)}
          <Panel tone="glass" padding="none" className="overflow-hidden">
            {table}
          </Panel>
        </motion.div>
      </BlockFrame>
    );
  }

  if (variant === "split") {
    return (
      <BlockFrame
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        state={state}
        empty={
          <EmptyState
            icon={<Building2 className="h-5 w-5" aria-hidden />}
            title="Nenhum consultorio ainda"
            description="Crie o primeiro consultorio para comecar a atender."
            action={
              <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={createOffice}>
                Novo consultório
              </Button>
            }
          />
        }
        className="flex flex-col gap-4"
        requires={requiresOf(adminPlatformRecipe)}
        requiredRoles={rolesOf(adminPlatformRecipe)}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION}
          className="@container flex flex-col gap-4"
        >
          {ownerBanner}
          {data.notice ? <Callout tone="info">{data.notice}</Callout> : null}
          {header}
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="flex flex-col gap-3">
              {metrics(true)}
              <div className="rounded-[var(--r-lg)] border border-border bg-surface/50 p-4">
                <p className="bloco-micro text-fg-muted">Assinado como</p>
                <p className="bloco-body mt-1 text-fg">{data.viewer.name}</p>
                <p className="bloco-caption text-fg-muted">{data.viewer.email}</p>
              </div>
            </div>
            <Panel tone="glass" padding="md" className="flex flex-col gap-3">
              <p className="bloco-headline">Consultorios</p>
              {compactList}
            </Panel>
          </div>
        </motion.div>
      </BlockFrame>
    );
  }

  return (
    <BlockFrame
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      empty={
        <EmptyState
          icon={<Building2 className="h-5 w-5" aria-hidden />}
          title="Nenhum consultorio ainda"
          description="Crie o primeiro consultorio para comecar a atender."
          action={
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={createOffice}>
              Novo consultório
            </Button>
          }
        />
      }
      className="flex flex-col gap-4"
        requires={requiresOf(adminPlatformRecipe)}
        requiredRoles={rolesOf(adminPlatformRecipe)}
      >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION}
        className="@container flex flex-col gap-4"
      >
        {ownerBanner}
        {data.notice ? <Callout tone="info">{data.notice}</Callout> : null}
        {header}
        {metrics(false)}
        <div className="grid grid-cols-1 gap-3 @[520px]:grid-cols-2 @[860px]:grid-cols-3">
          {offices.map((office) => officeCard(office))}
        </div>
      </motion.div>
    </BlockFrame>
  );
}

export default AdminPlatform;
