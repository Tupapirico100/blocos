import * as React from "react";
import { Badge, Button, ConfirmDialog, EmptyState, Panel } from "@blocos/ui";
import { ArrowDown, ArrowRight, Ban, MessageCircle, MessageSquareText, Pause, Play, Trash2, Zap } from "lucide-react";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { socialAutomationsRecipe } from "./social-automations.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type AutomationTrigger = "comment" | "dm";
export type AutomationMatchMode = "contains" | "exact";

export interface SocialAutomationStats {
  /** Comentarios/mensagens que casaram com a palavra-chave. */
  matched: number;
  sent: number;
  /** A pessoa ja tinha recebido (1 direct por pessoa por automacao). */
  skipped: number;
  error: number;
}

export interface SocialAutomation {
  id: string;
  name: string;
  active: boolean;
  /** Sem o "@". `null` = conta removida. */
  account: string | null;
  trigger: AutomationTrigger;
  /** Onde vale, ja em texto: "todos os posts", "post agendado (comeca quando for publicado)"... */
  scopeText: string;
  matchMode: AutomationMatchMode;
  keywords: string[];
  excludeKeywords: string[];
  dmText: string;
  /** Quantas respostas publicas em rodizio (0 = nenhuma). */
  publicReplies: number;
  stats: SocialAutomationStats;
}

export interface SocialAutomationsData {
  automations: SocialAutomation[];
}

export type SocialAutomationsVariant = "list" | "cards" | "flow";

const DM_PREVIEW = 140;

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialAutomations(props: BlockProps<SocialAutomationsData, SocialAutomationsVariant>) {
  const { data, onAction, variant = "flow", state = "success", connectors, onRequestConnector, className } = props;
  const [deleting, setDeleting] = React.useState<SocialAutomation | null>(null);

  return (
    <BlockFrame
      recipe={socialAutomationsRecipe}
      onAction={onAction}
      requires={[]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
    >
      {data.automations.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-5 w-5" aria-hidden />}
          title="Nenhuma automação ainda"
          description="Crie a primeira: quem comentar a palavra-chave recebe a mensagem no direct."
          action={
            onAction ? (
              <Button onClick={() => void onAction("automation.create")}>Nova automação</Button>
            ) : undefined
          }
        />
      ) : variant === "list" ? (
        <ul className="flex flex-col">
          {data.automations.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="bloco-headline inline-block max-w-full truncate" title={a.name}>
                  {a.name}
                  {a.active ? null : <span className="bloco-caption ml-2 text-fg-muted">(pausada)</span>}
                </p>
                <p className="bloco-caption text-fg-muted">
                  {a.account ? `@${a.account}` : "conta removida"} · {triggerText(a)} · {a.keywords.join(", ")}
                </p>
                <Stats stats={a.stats} compact />
              </div>
              <RowActions automation={a} onAction={onAction} onDelete={() => setDeleting(a)} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.automations.map((a) => (
            <li key={a.id}>
              <AutomationCard automation={a} flow={variant === "flow"} onAction={onAction} onDelete={() => setDeleting(a)} />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title={deleting ? `Excluir “${deleting.name}”?` : "Excluir automação"}
        description="Ela para de responder na hora. Os registros já feitos continuam em Registros."
        confirmLabel="Excluir automação"
        onConfirm={() => {
          if (deleting) void onAction?.("automation.delete", { id: deleting.id });
          setDeleting(null);
        }}
      />
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Partes                                                              */
/* ------------------------------------------------------------------ */

function triggerText(a: SocialAutomation): string {
  return `${a.trigger === "comment" ? "comentário" : "direct"} em ${a.scopeText}`;
}

function Keywords({ words, tone = "accent" }: { words: string[]; tone?: "accent" | "outline" }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {words.map((w) => (
        <Badge key={w} tone={tone}>
          {w}
        </Badge>
      ))}
    </span>
  );
}

function Stats({ stats, compact }: { stats: SocialAutomationStats; compact?: boolean }) {
  const items = [
    { n: stats.matched, label: "casaram" },
    { n: stats.sent, label: "DMs enviadas" },
    { n: stats.skipped, label: "já tinham recebido" },
    { n: stats.error, label: "falharam", bad: stats.error > 0 },
  ];
  return (
    <p className={compact ? "mt-1 flex flex-wrap gap-x-3 gap-y-0.5 bloco-caption" : "flex flex-wrap gap-x-4 gap-y-1 bloco-callout"} aria-label="Resultados desta automação">
      {items.map((it) => (
        <span key={it.label} className={it.bad ? "text-danger" : "text-fg-muted"}>
          <strong className={it.bad ? "font-semibold text-danger tabular-nums" : "font-semibold text-fg tabular-nums"}>{it.n}</strong> {it.label}
        </span>
      ))}
    </p>
  );
}

function RowActions({
  automation,
  onAction,
  onDelete,
}: {
  automation: SocialAutomation;
  onAction?: BlockProps<SocialAutomationsData>["onAction"];
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        icon={automation.active ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
        onClick={() => void onAction?.("automation.toggle", { id: automation.id, active: !automation.active })}
        aria-label={`${automation.active ? "Pausar" : "Ativar"} a automação ${automation.name}`}
      >
        {automation.active ? "Pausar" : "Ativar"}
      </Button>
      <Button
        size="sm"
        variant="danger-ghost"
        icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
        onClick={onDelete}
        aria-label={`Excluir a automação ${automation.name}`}
      >
        Excluir
      </Button>
    </div>
  );
}

function Step({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-[var(--r-md)] border border-border bg-surface/60 p-3">
      <span className="flex items-center gap-1.5 bloco-label font-semibold text-fg-secondary">
        {icon}
        {title}
      </span>
      <div className="bloco-callout min-w-0 break-words text-fg">{children}</div>
    </div>
  );
}

function AutomationCard({
  automation: a,
  flow,
  onAction,
  onDelete,
}: {
  automation: SocialAutomation;
  flow: boolean;
  onAction?: BlockProps<SocialAutomationsData>["onAction"];
  onDelete: () => void;
}) {
  const dm = a.dmText.length > DM_PREVIEW ? `${a.dmText.slice(0, DM_PREVIEW)}…` : a.dmText;
  const arrow = (
    <span className="flex items-center justify-center text-fg-muted" aria-hidden>
      <ArrowRight className="hidden h-4 w-4 @[640px]:block" />
      <ArrowDown className="h-4 w-4 @[640px]:hidden" />
    </span>
  );

  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="bloco-headline inline-block max-w-full truncate" title={a.name}>
              {a.name}
            </p>
            <Badge tone={a.active ? "success" : "outline"}>{a.active ? "Ativa" : "Pausada"}</Badge>
          </div>
          <p className="bloco-caption text-fg-muted">
            {a.account ? `@${a.account}` : "conta removida"} · {triggerText(a)} · {a.matchMode === "exact" ? "texto exato" : "contém"}
          </p>
        </div>
        <RowActions automation={a} onAction={onAction} onDelete={onDelete} />
      </div>

      {flow ? (
        <div className="@container">
          <div className="flex flex-col items-stretch gap-2 @[640px]:flex-row">
            <Step icon={<MessageCircle className="h-3.5 w-3.5" aria-hidden />} title={a.trigger === "comment" ? "Quem comentar" : "Quem mandar no direct"}>
              <Keywords words={a.keywords} />
              {a.excludeKeywords.length > 0 ? (
                <span className="mt-2 flex items-start gap-1.5 bloco-caption text-fg-muted">
                  <Ban className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                  Não responde se tiver: {a.excludeKeywords.join(", ")}
                </span>
              ) : null}
            </Step>
            {arrow}
            <Step icon={<MessageSquareText className="h-3.5 w-3.5" aria-hidden />} title="Recebe no direct">
              <span className="whitespace-pre-line">{dm}</span>
            </Step>
            {a.trigger === "comment" && a.publicReplies > 0 ? (
              <>
                {arrow}
                <Step icon={<MessageCircle className="h-3.5 w-3.5" aria-hidden />} title="Resposta pública">
                  {a.publicReplies === 1 ? "1 resposta embaixo do comentário" : `${a.publicReplies} respostas em rodízio`}
                </Step>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Keywords words={a.keywords} />
          {a.excludeKeywords.length > 0 ? (
            <p className="bloco-caption text-fg-muted">Não responde se tiver: {a.excludeKeywords.join(", ")}</p>
          ) : null}
          {a.publicReplies > 1 ? <p className="bloco-caption text-fg-muted">{a.publicReplies} respostas públicas em rodízio</p> : null}
          <p className="bloco-callout whitespace-pre-line break-words text-fg-secondary">{dm}</p>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <Stats stats={a.stats} />
      </div>
    </Panel>
  );
}
