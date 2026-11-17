import * as React from "react";
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Field,
  KeyValue,
  Panel,
  SectionHeader,
  Switch,
  Textarea,
} from "@blocos/ui";
import { Bot, CircleAlert, CircleCheckBig, Clock, Send, ShieldCheck, Terminal, WandSparkles } from "lucide-react";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { formatOpsDateTime } from "./format.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type AgentToolId =
  | "buscar_agenda"
  | "oferecer_slots"
  | "registrar_atendimento"
  | "consultar_lead";

export interface AgentTool {
  id: AgentToolId;
  label: string;
  description: string;
  /** A tool esta na allowlist ativa do agente? */
  allowed: boolean;
}

export interface AgentMessage {
  id: string;
  role: "paciente" | "agente" | "sistema";
  text: string;
  /** ISO. */
  createdAt: string;
}

export interface AgentLogEntry {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  createdAt: string;
}

export interface AgentConsoleData {
  agent: {
    /** Controle do dono: liga e desliga o agente. */
    enabled: boolean;
    status: "ativo" | "pausado" | "erro";
    model: string;
    /** Prompt versionado do agente. */
    prompt: string;
    promptVersion: number;
    /** Allowlist de ferramentas — exatamente 4. */
    tools: AgentTool[];
    lastRunAt?: string;
  };
  messages: AgentMessage[];
  logs: AgentLogEntry[];
}

export type AgentConsoleVariant = "chat" | "cards" | "logs";

/* ------------------------------------------------------------------ */
/* Helpers de apresentacao                                             */
/* ------------------------------------------------------------------ */

const statusTone: Record<AgentConsoleData["agent"]["status"], "success" | "neutral" | "danger"> = {
  ativo: "success",
  pausado: "neutral",
  erro: "danger",
};

const roleLabel: Record<AgentMessage["role"], string> = {
  paciente: "Paciente",
  agente: "Agente",
  sistema: "Sistema",
};

const logTone: Record<AgentLogEntry["level"], "info" | "warn" | "danger"> = {
  info: "info",
  warn: "warn",
  error: "danger",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function AgentConsole(props: BlockProps<AgentConsoleData, AgentConsoleVariant>) {
  const {
    data,
    onAction,
    variant = "chat",
    state = "success",
    connectors = [],
    onRequestConnector,
    className,
  } = props;

  const { agent, messages, logs } = data;
  const [draft, setDraft] = React.useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onAction?.("agent.message", { text });
    setDraft("");
  };

  const toggleAgent = () => {
    onAction?.("agent.toggle", { enabled: !agent.enabled });
  };

  return (
    <BlockFrame
      requires={["anthropic"]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Operacao"
          title="Console do agente"
          description="O agente atende quem esta na lista de permitidos, dentro da janela de 24h, usando apenas as quatro ferramentas autorizadas."
          actions={
            <div className="flex items-center gap-2">
              <Badge tone={statusTone[agent.status]} icon={agent.status === "ativo" ? <CircleCheckBig className="h-3 w-3" aria-hidden /> : <Clock className="h-3 w-3" aria-hidden />}>
                {agent.status === "ativo" ? "Ativo" : agent.status === "pausado" ? "Pausado" : "Com erro"}
              </Badge>
              <Switch
                checked={agent.enabled}
                onCheckedChange={toggleAgent}
                label={agent.enabled ? "Agente ligado" : "Agente desligado"}
              />
            </div>
          }
        />

        {variant === "chat" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Panel tone="solid" padding="md" className="flex flex-col gap-3">
              <div className="bloco-scroll flex max-h-[420px] flex-col gap-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <EmptyState
                    icon={<Bot className="h-5 w-5" aria-hidden />}
                    title="Conversa vazia"
                    description="As mensagens trocadas com o agente aparecem aqui."
                  />
                ) : (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <Field label="Mensagem para o agente" htmlFor="agent-console-input">
                  <Textarea
                    id="agent-console-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Teste o comportamento do agente..."
                  />
                </Field>
                <div className="flex justify-end">
                  <Button icon={<Send className="h-4 w-4" aria-hidden />} onClick={send} disabled={draft.trim().length === 0}>
                    Enviar
                  </Button>
                </div>
              </div>
            </Panel>

            <div className="flex flex-col gap-3">
              <ToolAllowlist tools={agent.tools} />
              <PromptPanel prompt={agent.prompt} promptVersion={agent.promptVersion} model={agent.model} lastRunAt={agent.lastRunAt} />
            </div>
          </div>
        ) : variant === "cards" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel tone="glass" padding="md" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="bloco-title3">Capacidades</p>
                <Badge tone="outline">{agent.tools.filter((t) => t.allowed).length} de {agent.tools.length} liberadas</Badge>
              </div>
              <p className="bloco-callout text-fg-secondary">
                Allowlist fixa. O agente nunca inventa ferramenta nova: o que nao esta aqui, ele nao faz.
              </p>
              <ToolAllowlist tools={agent.tools} />
            </Panel>

            <div className="flex flex-col gap-3">
              <Panel tone="glass" padding="md" className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="bloco-title3">Controle do dono</p>
                  <Badge tone={agent.enabled ? "success" : "neutral"}>{agent.enabled ? "Ligado" : "Desligado"}</Badge>
                </div>
                <p className="bloco-callout text-fg-secondary">
                  O agente comeca desligado. Quem liga e desliga e o dono da plataforma — o dono do consultorio ve o
                  estado, mas nao mexe.
                </p>
                <Switch
                  checked={agent.enabled}
                  onCheckedChange={toggleAgent}
                  label={agent.enabled ? "Agente ativo" : "Agente inativo"}
                  description="Desligar mantem o prompt e o historico; o agente para de responder."
                />
                <KeyValue
                  columns={2}
                  items={[
                    { label: "Modelo", value: agent.model },
                    { label: "Prompt", value: `v${agent.promptVersion}` },
                    { label: "Ultima execucao", value: formatOpsDateTime(agent.lastRunAt) },
                    { label: "Status", value: agent.status },
                  ]}
                />
              </Panel>

              <PromptPanel
                prompt={agent.prompt}
                promptVersion={agent.promptVersion}
                model={agent.model}
                lastRunAt={agent.lastRunAt}
                editable
                onSave={(prompt) => onAction?.("agent.prompt.update", { prompt })}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Panel tone="outline" padding="none">
              {logs.length === 0 ? (
                <EmptyState
                  icon={<Terminal className="h-5 w-5" aria-hidden />}
                  title="Nenhum registro"
                  description="As execucoes do agente ficam registradas aqui."
                />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {logs.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <Badge tone={logTone[entry.level]}>{entry.level}</Badge>
                      <span className="bloco-callout min-w-0 flex-1 text-fg-secondary">{entry.message}</span>
                      <span className="bloco-caption">{formatOpsDateTime(entry.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <div className="grid gap-3 lg:grid-cols-2">
              <ToolAllowlist tools={agent.tools} />
              <PromptPanel prompt={agent.prompt} promptVersion={agent.promptVersion} model={agent.model} lastRunAt={agent.lastRunAt} />
            </div>
          </div>
        )}

        <Callout tone="info" icon={<ShieldCheck className="h-4 w-4" aria-hidden />} title="Regras que o agente respeita">
          Regra 11: so responde a quem esta na lista de permitidos. Janela de 24h: fora dela, so template aprovado. E
          nunca registra dado de saude — apenas agendamento, atendimento e lead.
        </Callout>
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Pecas                                                               */
/* ------------------------------------------------------------------ */

function MessageBubble({ message }: { message: AgentMessage }) {
  const isAgent = message.role === "agente";
  const isSystem = message.role === "sistema";

  return (
    <div className={isAgent ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isSystem
            ? "bloco-caption w-full rounded-[var(--r-md)] border border-dashed border-border px-3 py-2"
            : `max-w-[85%] rounded-[var(--r-md)] px-3.5 py-2.5 ${
                isAgent ? "bg-accent-soft text-fg" : "border border-border bg-surface/60 text-fg-secondary"
              }`
        }
      >
        <span className="bloco-micro mr-2">{roleLabel[message.role]}</span>
        <span className="bloco-body">{message.text}</span>
        <span className="bloco-caption mt-1 block">{formatOpsDateTime(message.createdAt)}</span>
      </div>
    </div>
  );
}

function ToolAllowlist({ tools }: { tools: AgentTool[] }) {
  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="bloco-title3">Ferramentas permitidas</p>
        <Badge tone="outline" icon={<WandSparkles className="h-3 w-3" aria-hidden />}>
          allowlist
        </Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {tools.map((tool) => (
          <li
            key={tool.id}
            className="flex items-start gap-2.5 rounded-[var(--r-md)] border border-border bg-surface/50 px-3 py-2.5"
          >
            <span className={tool.allowed ? "mt-0.5 text-success" : "mt-0.5 text-fg-faint"}>
              {tool.allowed ? (
                <CircleCheckBig className="h-4 w-4" aria-hidden />
              ) : (
                <CircleAlert className="h-4 w-4" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="bloco-callout block font-medium text-fg">{tool.label}</span>
              <span className="bloco-caption block">{tool.description}</span>
              <span className="bloco-micro mt-1 block">{tool.id}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function PromptPanel({
  prompt,
  promptVersion,
  model,
  lastRunAt,
  editable = false,
  onSave,
}: {
  prompt: string;
  promptVersion: number;
  model: string;
  lastRunAt?: string;
  editable?: boolean;
  onSave?: (prompt: string) => void;
}) {
  const [value, setValue] = React.useState(prompt);

  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="bloco-title3">Prompt do agente</p>
        <Badge tone="outline">v{promptVersion}</Badge>
      </div>

      {editable ? (
        <Field label="Instrucao do agente" htmlFor="agent-console-prompt" hint="Somente o dono da plataforma altera o prompt.">
          <Textarea id="agent-console-prompt" value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
      ) : (
        <p className="bloco-mono block max-h-48 overflow-y-auto whitespace-pre-wrap rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5 text-[13px] text-fg-secondary">
          {prompt}
        </p>
      )}

      <KeyValue
        columns={2}
        items={[
          { label: "Modelo", value: model },
          { label: "Ultima execucao", value: formatOpsDateTime(lastRunAt) },
        ]}
      />

      {editable ? (
        <div className="flex justify-end">
          <Button onClick={() => onSave?.(value)} disabled={value === prompt}>
            Salvar prompt
          </Button>
        </div>
      ) : null}
    </Panel>
  );
}
