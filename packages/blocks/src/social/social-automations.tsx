import * as React from "react";
import {
  Badge,
  Button,
  Callout,
  DataTable,
  EmptyState,
  Panel,
  SectionHeader,
  Switch,
  type Column,
} from "@blocos/ui";
import { ArrowRight, AtSign, Hash, ListChecks, MessageCircle, Play, Zap } from "lucide-react";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { formatSocialDateTime } from "./format.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type AutomationTriggerType = "comentario" | "palavra-chave" | "mencao";
export type AutomationActionType = "responder" | "marcar" | "agendar";

export interface SocialAutomation {
  id: string;
  name: string;
  active: boolean;
  accountHandle: string;
  trigger: {
    type: AutomationTriggerType;
    /** Termo, palavra ou "@conta" que dispara a regra. */
    value: string;
    match?: "exata" | "contem";
  };
  action: {
    type: AutomationActionType;
    /** Texto da resposta, etiqueta aplicada ou formato de agendamento. */
    value: string;
  };
  createdAt: string;
  /** Quantas vezes a regra disparou. */
  hits: number;
  lastTriggeredAt?: string;
}

export interface SocialAutomationsData {
  automations: SocialAutomation[];
}

export type SocialAutomationsVariant = "list" | "cards" | "flow";

/* ------------------------------------------------------------------ */
/* Helpers de apresentacao                                             */
/* ------------------------------------------------------------------ */

const triggerLabel: Record<AutomationTriggerType, string> = {
  comentario: "Comentario",
  "palavra-chave": "Palavra-chave",
  mencao: "Mencao",
};

const triggerIcon: Record<AutomationTriggerType, React.ReactNode> = {
  comentario: <MessageCircle className="h-3.5 w-3.5" aria-hidden />,
  "palavra-chave": <Hash className="h-3.5 w-3.5" aria-hidden />,
  mencao: <AtSign className="h-3.5 w-3.5" aria-hidden />,
};

const actionLabel: Record<AutomationActionType, string> = {
  responder: "Responder",
  marcar: "Marcar",
  agendar: "Agendar",
};

const actionIcon: Record<AutomationActionType, React.ReactNode> = {
  responder: <Play className="h-3.5 w-3.5" aria-hidden />,
  marcar: <ListChecks className="h-3.5 w-3.5" aria-hidden />,
  agendar: <Zap className="h-3.5 w-3.5" aria-hidden />,
};

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialAutomations(props: BlockProps<SocialAutomationsData, SocialAutomationsVariant>) {
  const {
    data,
    onAction,
    variant = "list",
    state = "success",
    className,
  } = props;

  const automations = data.automations;
  const hasRules = automations.length > 0;

  const toggle = (automation: SocialAutomation) => {
    onAction?.("automation.toggle", { id: automation.id, active: !automation.active });
  };

  return (
    <BlockFrame state={state} className={className}>
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Agendador-Instagram"
          title="Automacoes de resposta"
          description="Cada regra liga um gatilho a uma acao. Regras inativas ficam guardadas, mas nao respondem a ninguem."
        />

        {!hasRules ? (
          <EmptyState
            icon={<Zap className="h-5 w-5" aria-hidden />}
            title="Nenhuma regra criada"
            description="Crie uma regra para responder comentario, palavra-chave ou mencao automaticamente."
          />
        ) : variant === "cards" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {automations.map((automation) => (
              <AutomationCard key={automation.id} automation={automation} onToggle={() => toggle(automation)} />
            ))}
          </div>
        ) : variant === "flow" ? (
          <div className="flex flex-col gap-3">
            {automations.map((automation) => (
              <AutomationFlow key={automation.id} automation={automation} onToggle={() => toggle(automation)} />
            ))}
          </div>
        ) : (
          <Panel tone="outline" padding="none">
            <DataTable<SocialAutomation>
              rowKey={(row) => row.id}
              rows={automations}
              columns={automationColumns(toggle)}
              empty={
                <EmptyState title="Nenhuma regra criada" description="Crie uma regra para automatizar respostas." />
              }
            />
          </Panel>
        )}

        <Callout tone="info" icon={<Zap className="h-4 w-4" aria-hidden />} title="Regras que respeitam a lista de permitidos">
          A automacao so responde para quem esta na lista de permitidos e so dentro da janela de 24h — fora dela, entra
          somente template aprovado. Marcar cria lead; nunca grava dado de saude.
        </Callout>
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacoes                                                           */
/* ------------------------------------------------------------------ */

function automationColumns(
  toggle: (automation: SocialAutomation) => void,
): Array<Column<SocialAutomation>> {
  return [
    {
      key: "rule",
      header: "Regra",
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-fg">{row.name}</span>
          <span className="bloco-caption">{row.accountHandle}</span>
        </span>
      ),
    },
    {
      key: "trigger",
      header: "Gatilho",
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <span className="text-fg-muted">{triggerIcon[row.trigger.type]}</span>
          <span className="bloco-mono truncate">{row.trigger.value}</span>
          <span className="bloco-caption">({triggerLabel[row.trigger.type]})</span>
        </span>
      ),
    },
    {
      key: "action",
      header: "Acao",
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <span className="text-fg-muted">{actionIcon[row.action.type]}</span>
          <span>{actionLabel[row.action.type]}</span>
        </span>
      ),
    },
    {
      key: "hits",
      header: "Execucoes",
      align: "right",
      render: (row) => (
        <span className="flex flex-col">
          <span className="tabular-nums">{row.hits}</span>
          <span className="bloco-caption">
            {row.lastTriggeredAt ? formatSocialDateTime(row.lastTriggeredAt) : "nunca executada"}
          </span>
        </span>
      ),
    },
    {
      key: "active",
      header: "Ativa",
      align: "right",
      render: (row) => (
        <Switch
          checked={row.active}
          onCheckedChange={() => toggle(row)}
          label={<span className="sr-only">Alternar regra {row.name}</span>}
        />
      ),
    },
  ];
}

function AutomationCard({
  automation,
  onToggle,
}: {
  automation: SocialAutomation;
  onToggle: () => void;
}) {
  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="bloco-headline truncate">{automation.name}</p>
          <p className="bloco-caption">{automation.accountHandle}</p>
        </div>
        <Badge tone={automation.active ? "success" : "neutral"}>
          {automation.active ? "Ativa" : "Inativa"}
        </Badge>
      </div>

      <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-border bg-surface/50 px-3 py-2">
        <span className="text-fg-muted">{triggerIcon[automation.trigger.type]}</span>
        <span className="bloco-callout min-w-0 truncate">{triggerLabel[automation.trigger.type]}</span>
        <span className="bloco-mono truncate text-fg">{automation.trigger.value}</span>
      </div>

      <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-border bg-surface/50 px-3 py-2">
        <span className="text-fg-muted">{actionIcon[automation.action.type]}</span>
        <span className="bloco-callout min-w-0 truncate">{actionLabel[automation.action.type]}</span>
        <span className="bloco-caption truncate">{automation.action.value}</span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="bloco-caption">
          {automation.hits} execucao(oes)
          {automation.lastTriggeredAt ? ` · ${formatSocialDateTime(automation.lastTriggeredAt)}` : ""}
        </span>
        <Button size="sm" variant="outline" onClick={onToggle}>
          {automation.active ? "Desativar" : "Ativar"}
        </Button>
      </div>
    </Panel>
  );
}

function AutomationFlow({
  automation,
  onToggle,
}: {
  automation: SocialAutomation;
  onToggle: () => void;
}) {
  return (
    <Panel tone="outline" padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="bloco-headline truncate">{automation.name}</p>
        <div className="flex items-center gap-2">
          <Badge tone={automation.active ? "success" : "neutral"}>
            {automation.active ? "Ativa" : "Inativa"}
          </Badge>
          <Button size="sm" variant="outline" onClick={onToggle}>
            {automation.active ? "Desativar" : "Ativar"}
          </Button>
        </div>
      </div>

      <div className="grid items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-1 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5">
          <span className="bloco-micro flex items-center gap-1.5">
            {triggerIcon[automation.trigger.type]} Gatilho · {triggerLabel[automation.trigger.type]}
          </span>
          <span className="bloco-mono truncate text-fg">{automation.trigger.value}</span>
          {automation.trigger.match ? (
            <span className="bloco-caption">Correspondencia: {automation.trigger.match}</span>
          ) : null}
        </div>

        <span className="flex items-center justify-center text-fg-faint">
          <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" aria-hidden />
        </span>

        <div className="flex flex-col gap-1 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5">
          <span className="bloco-micro flex items-center gap-1.5">
            {actionIcon[automation.action.type]} Acao · {actionLabel[automation.action.type]}
          </span>
          <span className="bloco-callout truncate text-fg">{automation.action.value}</span>
          <span className="bloco-caption">
            {automation.hits} execucao(oes) · {automation.accountHandle}
          </span>
        </div>
      </div>
    </Panel>
  );
}
