import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Ban,
  Clock,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  LayoutTemplate,
  UserCheck,
} from "lucide-react";
import { Avatar, Badge, Button, EmptyState, IconButton, Panel, Skeleton, Textarea } from "@blocos/ui";
import { BlockFrame } from "../shared/index.js";
import type { BlockProps } from "../shared/index.js";
import { formatDateTime, formatPhone, formatTime, isWithin24h } from "./format.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: string;
  /** "in" = do cliente, "out" = do consultorio. */
  direction: "in" | "out";
  body: string;
  /** ISO. */
  at: string;
  /** Preenchido quando a mensagem saiu como template aprovado. */
  templateId?: string;
}

export interface Conversation {
  id: string;
  name: string;
  /** Telefone E.164. */
  phone: string;
  lastMessage: string;
  /** ISO. */
  lastMessageAt: string;
  /** Ultima mensagem ENVIADA PELO CLIENTE. Define a janela de 24h. */
  lastInboundAt?: string;
  /** Regra 11: so respondemos quem esta na lista de permitidos. */
  allowed: boolean;
  unread?: number;
  messages: ChatMessage[];
}

export interface WhatsappTemplate {
  id: string;
  name: string;
  body: string;
}

export interface InboxWhatsappData {
  conversations: Conversation[];
  templates: WhatsappTemplate[];
  quickReplies: string[];
  /** Referencia para o calculo da janela de 24h (ISO). */
  now?: string;
  /** Conversa aberta por padrao. */
  activeConversationId?: string;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function InboxWhatsapp(
  props: BlockProps<InboxWhatsappData, "split" | "stacked" | "focus">,
) {
  const {
    data,
    onAction,
    variant = "split",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const now = React.useMemo(() => (data.now ? new Date(data.now) : new Date()), [data.now]);

  const [selectedId, setSelectedId] = React.useState<string | null>(
    data.activeConversationId ?? data.conversations[0]?.id ?? null,
  );
  const [draft, setDraft] = React.useState("");
  const [templateOpen, setTemplateOpen] = React.useState(false);

  const active = React.useMemo(
    () => data.conversations.find((c) => c.id === selectedId) ?? data.conversations[0],
    [data.conversations, selectedId],
  );

  const send = () => {
    if (!active) return;
    const body = draft.trim();
    if (!body) return;
    void onAction?.("message.send", { conversationId: active.id, body });
    setDraft("");
  };

  const sendTemplate = (templateId: string) => {
    if (!active) return;
    void onAction?.("message.template", { conversationId: active.id, templateId });
    setTemplateOpen(false);
  };

  const allow = () => {
    if (!active) return;
    void onAction?.("lead.allow", { conversationId: active.id, phone: active.phone });
  };

  const list = (
    <ConversationList
      conversations={data.conversations}
      now={now}
      selectedId={active?.id}
      onSelect={setSelectedId}
    />
  );

  const chat = active ? (
    <ChatPanel
      conversation={active}
      now={now}
      templates={data.templates}
      quickReplies={data.quickReplies}
      draft={draft}
      templateOpen={templateOpen}
      onDraftChange={setDraft}
      onToggleTemplates={() => setTemplateOpen((open) => !open)}
      onSend={send}
      onSendTemplate={sendTemplate}
      onAllow={allow}
    />
  ) : (
    <EmptyState
      icon={<MessageSquareText size={20} aria-hidden />}
      title="Nenhuma conversa"
      description="Quando alguem escrever no WhatsApp, a conversa aparece aqui."
    />
  );

  return (
    <BlockFrame
      requires={["whatsapp"]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
      loading={
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col gap-2 rounded-[var(--r-lg)] border border-border p-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="flex flex-col gap-2 rounded-[var(--r-lg)] border border-border p-4">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      }
      empty={
        <EmptyState
          icon={<MessageSquareText size={20} aria-hidden />}
          title="Caixa de entrada vazia"
          description="Nenhuma conversa recebida pelo WhatsApp do consultorio."
        />
      }
    >
      {variant === "focus" ? (
        <div className="flex flex-col gap-4">{chat}</div>
      ) : variant === "stacked" ? (
        <div className="flex flex-col gap-4">
          <Panel tone="solid" padding="none" className="max-h-[280px] overflow-hidden">
            {list}
          </Panel>
          {chat}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Panel tone="solid" padding="none" className="overflow-hidden">
            {list}
          </Panel>
          {chat}
        </div>
      )}
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Lista de conversas                                                   */
/* ------------------------------------------------------------------ */

function ConversationList({
  conversations,
  now,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  now: Date;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <label className="relative block">
          <span className="sr-only">Buscar conversa</span>
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome"
            className="h-9 w-full rounded-[var(--r-md)] border border-border bg-surface-strong/60 pl-8 pr-3 text-[13px] text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/15"
          />
        </label>
      </div>

      <ul className="bloco-scroll max-h-[420px] overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="p-4">
            <p className="bloco-caption text-fg-muted">Nenhuma conversa encontrada.</p>
          </li>
        ) : (
          filtered.map((conversation) => {
            const within = isWithin24h(conversation.lastInboundAt, now);
            const selected = conversation.id === selectedId;
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-current={selected ? "true" : undefined}
                  className={`flex w-full items-start gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors ${
                    selected ? "bg-surface-hover" : "hover:bg-surface-hover/60"
                  }`}
                >
                  <Avatar name={conversation.name} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="bloco-headline truncate text-fg">{conversation.name}</span>
                      <span className="bloco-micro shrink-0 text-fg-faint">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="bloco-caption mt-0.5 block truncate text-fg-muted">
                      {conversation.lastMessage}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1">
                      {conversation.unread ? (
                        <Badge tone="accent">{conversation.unread} nova(s)</Badge>
                      ) : null}
                      {conversation.allowed ? (
                        <Badge tone="success" icon={<ShieldCheck size={11} aria-hidden />}>
                          Permitido
                        </Badge>
                      ) : (
                        <Badge tone="danger" icon={<Ban size={11} aria-hidden />}>
                          Bloqueado
                        </Badge>
                      )}
                      <Badge tone={within ? "info" : "warn"} icon={<Clock size={11} aria-hidden />}>
                        {within ? "Dentro da janela" : "Fora da janela"}
                      </Badge>
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Painel do chat                                                       */
/* ------------------------------------------------------------------ */

function ChatPanel({
  conversation,
  now,
  templates,
  quickReplies,
  draft,
  templateOpen,
  onDraftChange,
  onToggleTemplates,
  onSend,
  onSendTemplate,
  onAllow,
}: {
  conversation: Conversation;
  now: Date;
  templates: WhatsappTemplate[];
  quickReplies: string[];
  draft: string;
  templateOpen: boolean;
  onDraftChange: (value: string) => void;
  onToggleTemplates: () => void;
  onSend: () => void;
  onSendTemplate: (templateId: string) => void;
  onAllow: () => void;
}) {
  const within = isWithin24h(conversation.lastInboundAt, now);
  const allowed = conversation.allowed;
  const canSendFree = within && allowed;

  return (
    <Panel tone="solid" padding="none" className="flex flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={conversation.name} size={38} />
          <div className="min-w-0">
            <p className="bloco-headline truncate">{conversation.name}</p>
            <p className="bloco-caption text-fg-muted">{formatPhone(conversation.phone)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={within ? "info" : "warn"} icon={<Clock size={11} aria-hidden />}>
            {within ? "Dentro da janela de 24h" : "Fora da janela — template necessario"}
          </Badge>
          {allowed ? (
            <Badge tone="success" icon={<ShieldCheck size={11} aria-hidden />}>
              Na lista de permitidos
            </Badge>
          ) : (
            <Badge tone="danger" icon={<Ban size={11} aria-hidden />}>
              Bloqueado
            </Badge>
          )}
        </div>
      </header>

      {!allowed ? (
        <div className="border-b border-warn/25 bg-warn-soft px-4 py-2.5">
          <p className="bloco-caption text-warn">
            Regra 11: este contato nao esta na lista de permitidos. Libere o atendimento antes de
            responder.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            icon={<UserCheck size={14} aria-hidden />}
            onClick={onAllow}
          >
            Permitir contato
          </Button>
        </div>
      ) : null}

      <div className="bloco-scroll flex max-h-[420px] flex-col gap-2 overflow-y-auto px-4 py-4">
        {conversation.messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className={`flex ${message.direction === "out" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] rounded-[var(--r-lg)] px-3.5 py-2 ${
                message.direction === "out"
                  ? "bg-accent-soft text-fg"
                  : "border border-border bg-surface-strong text-fg-secondary"
              }`}
            >
              {message.templateId ? (
                <p className="bloco-micro mb-1 flex items-center gap-1 text-fg-muted">
                  <LayoutTemplate size={11} aria-hidden /> Template aprovado
                </p>
              ) : null}
              <p className="bloco-body whitespace-pre-wrap">{message.body}</p>
              <p className="bloco-micro mt-1 text-fg-faint">{formatDateTime(message.at)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="border-t border-border px-4 py-3">
        {quickReplies.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => onDraftChange(reply)}
                className="rounded-[var(--r-pill)] border border-border bg-surface/60 px-3 py-1 text-[12px] text-fg-secondary transition-colors hover:border-border-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {reply}
              </button>
            ))}
          </div>
        ) : null}

        {!within ? (
          <p className="bloco-caption mb-2 text-warn">
            Fora da janela de 24h: a mensagem livre nao e permitida. Envie um template aprovado.
          </p>
        ) : null}

        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={2}
            disabled={!canSendFree}
            placeholder={
              !allowed
                ? "Contato bloqueado — libere o atendimento para responder"
                : within
                  ? "Escreva a resposta"
                  : "Fora da janela: use um template aprovado"
            }
            className="min-h-[56px]"
          />
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <IconButton
                label="Enviar template aprovado"
                variant="secondary"
                onClick={onToggleTemplates}
                aria-expanded={templateOpen}
              >
                <LayoutTemplate size={16} aria-hidden />
              </IconButton>
              <AnimatePresence>
                {templateOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute right-0 z-20 mt-2 w-72 rounded-[var(--r-md)] border border-border bg-surface-solid p-1.5 shadow-[var(--shadow-3)]"
                  >
                    <p className="bloco-micro px-2 py-1.5 text-fg-faint">Templates aprovados</p>
                    {templates.length === 0 ? (
                      <p className="bloco-caption px-2 py-2 text-fg-muted">
                        Nenhum template cadastrado.
                      </p>
                    ) : (
                      templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => onSendTemplate(template.id)}
                          className="flex w-full flex-col gap-0.5 rounded-[var(--r-sm)] px-2 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <span className="bloco-headline flex items-center gap-1.5 text-fg">
                            <Sparkles size={12} aria-hidden /> {template.name}
                          </span>
                          <span className="bloco-caption line-clamp-2 text-fg-muted">
                            {template.body}
                          </span>
                        </button>
                      ))
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <Button
              onClick={onSend}
              disabled={!canSendFree || draft.trim().length === 0}
              icon={<Send size={15} aria-hidden />}
            >
              Enviar
            </Button>
          </div>
        </div>
      </footer>
    </Panel>
  );
}
