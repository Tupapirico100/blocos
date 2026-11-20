import * as React from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CircleDot, Megaphone, MessageCircle, Share2, UserPlus } from "lucide-react";
import { formatBRL } from "@blocos/core";
import { Badge, DataTable, IconButton, Panel, Skeleton } from "@blocos/ui";
import type { BadgeTone, Column } from "@blocos/ui";
import { BlockFrame, requiresOf, rolesOf } from "../shared/index.js";
import type { BlockProps } from "../shared/index.js";
import { formatDateTime, formatPhone } from "./format.js";
import { leadsBoardRecipe } from "./leads-board.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

/** Estagio fixo de lead: new -> qualified -> customer. */
export type LeadStage = "new" | "qualified" | "customer";

/** Origem do lead: a do PRIMEIRO toque, nao a do ultimo clique. */
export type LeadOrigin = "anuncio" | "indicacao" | "organico";

export interface Lead {
  id: string;
  name: string;
  /** Telefone E.164. */
  phone: string;
  stage: LeadStage;
  origin: LeadOrigin;
  /** Dinheiro sempre em centavos. */
  valueCents: number;
  /** Instante do primeiro toque (ISO). Define a origem e a atribuicao. */
  firstTouchAt: string;
  /** Canal do primeiro toque. */
  firstTouchChannel: string;
  /** Quem fez o primeiro toque (atribuicao). */
  firstTouchBy?: string;
  /** Ultimo toque (ISO). */
  lastTouchAt: string;
  note?: string;
}

export interface LeadStageMeta {
  id: LeadStage;
  label: string;
  hint?: string;
}

export interface LeadBoardData {
  leads: Lead[];
  stages: LeadStageMeta[];
  /**
   * Quadro de etapas proprias, arrastavel (CRM-HOF). Quando existe, a variacao
   * "board" mostra estas colunas e estes cartoes em vez dos leads acima.
   */
  dragBoard?: LeadDragBoard;
}

/**
 * Quadro arrastavel: o cartao e pego e solto em outra coluna, e isso E a
 * mudanca de etapa (`onAction("lead.move", { id, stage })`).
 *
 *  - Mouse: aperta e arrasta (comeca depois de alguns pixels, entao o clique
 *    num link ou botao dentro do cartao continua funcionando).
 *  - Toque: segura um instante e arrasta; um deslize rapido continua rolando.
 *  - Teclado: o cartao recebe foco; <- e -> movem uma coluna.
 *
 * Quem chama decide a etapa de cada cartao (otimista ou nao), marca `busy`
 * enquanto salva e anuncia o resultado.
 */
export interface LeadDragBoard {
  stages: Array<{ id: string; label: string; total?: string; tone?: "success" | "danger" }>;
  cards: Array<{ id: string; stage: string; name: string; body: React.ReactNode; busy?: boolean }>;
  /** O papel pode mover cartoes. Sem isso, so leitura. */
  canMove: boolean;
  /** Nome do quadro para leitor de tela. */
  label: string;
  /** Instrucao de arrastar (mostrada acima e ligada a cada cartao). */
  hint?: string;
  /** Texto da coluna vazia. */
  empty?: string;
}

const DEFAULT_STAGES: LeadStageMeta[] = [
  { id: "new", label: "Novo", hint: "Chegou e ainda nao foi qualificado" },
  { id: "qualified", label: "Qualificado", hint: "Tem interesse confirmado" },
  { id: "customer", label: "Cliente", hint: "Virou paciente do consultorio" },
];

const ORIGIN_LABEL: Record<LeadOrigin, string> = {
  anuncio: "Anuncio",
  indicacao: "Indicacao",
  organico: "Organico",
};

const ORIGIN_ICON: Record<LeadOrigin, React.ReactNode> = {
  anuncio: <Megaphone size={12} aria-hidden />,
  indicacao: <Share2 size={12} aria-hidden />,
  organico: <UserPlus size={12} aria-hidden />,
};

const ORIGIN_TONE: Record<LeadOrigin, BadgeTone> = {
  anuncio: "info",
  indicacao: "accent",
  organico: "neutral",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function LeadsBoard(props: BlockProps<LeadBoardData, "board" | "table" | "timeline">) {
  const { data, onAction, variant = "board", state = "success", className, connectors, onRequestConnector } = props;

  const stages = data.stages.length > 0 ? data.stages : DEFAULT_STAGES;

  return (
    <BlockFrame
      state={state}
      className={className}
      loading={
        <div className="@container w-full">
          <div className="grid gap-4 @[520px]:grid-cols-2 @[860px]:grid-cols-3">
            {[0, 1, 2].map((column) => (
              <div key={column} className="flex flex-col gap-2 rounded-[var(--r-lg)] border border-border p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </div>
      }
      empty={
        <div className="rounded-[var(--r-lg)] border border-dashed border-border p-6 text-center">
          <p className="bloco-headline">Nenhum lead por aqui</p>
          <p className="bloco-callout mt-1 text-fg-muted">
            Quando um lead entrar no funil, ele aparece aqui com a origem do primeiro toque.
          </p>
        </div>
      }
        recipe={leadsBoardRecipe}
        
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
      >
      {variant === "table" ? (
        <LeadTable leads={data.leads} stages={stages} onAction={onAction} />
      ) : variant === "timeline" ? (
        <LeadTimeline leads={data.leads} stages={stages} />
      ) : data.dragBoard ? (
        <DragBoard board={data.dragBoard} onAction={onAction} />
      ) : (
        <LeadBoardView leads={data.leads} stages={stages} onAction={onAction} />
      )}
    </BlockFrame>
  );
}

/** Alias em singular, para quem importa o bloco pelo nome do arquivo. */
export const LeadBoard = LeadsBoard;

/* ------------------------------------------------------------------ */
/* Variacao: quadro (kanban)                                            */
/* ------------------------------------------------------------------ */

function LeadBoardView({
  leads,
  stages,
  onAction,
}: {
  leads: Lead[];
  stages: LeadStageMeta[];
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  return (
    /*
     * Container query em vez de breakpoint de viewport: o quadro vive dentro
     * de um painel que pode ser estreito (menu lateral, drawer) mesmo em
     * telas grandes. Com 3 colunas forcadas o nome do lead ficava com 14px
     * de largura e quebrava uma letra por linha.
     */
    <div className="@container w-full">
      <div className="grid gap-4 @[520px]:grid-cols-2 @[860px]:grid-cols-3">
        {stages.map((stage) => {
          const columnLeads = leads.filter((lead) => lead.stage === stage.id);
          return (
            <Panel key={stage.id} tone="solid" padding="md" className="flex min-w-0 flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="bloco-title3 break-words">{stage.label}</h2>
                  {stage.hint ? (
                    <p className="bloco-caption mt-0.5 break-words text-fg-muted">{stage.hint}</p>
                  ) : null}
                </div>
                <Badge tone="neutral" className="shrink-0">
                  {columnLeads.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                {columnLeads.length === 0 ? (
                  <p className="bloco-caption rounded-[var(--r-md)] border border-dashed border-border px-3 py-4 text-center text-fg-muted">
                    Nenhum lead nesta etapa.
                  </p>
                ) : (
                  columnLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} stages={stages} onAction={onAction} />
                  ))
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  stages,
  onAction,
}: {
  lead: Lead;
  stages: LeadStageMeta[];
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  const index = stages.findIndex((stage) => stage.id === lead.stage);
  const previous = index > 0 ? stages[index - 1] : undefined;
  const next = index >= 0 && index < stages.length - 1 ? stages[index + 1] : undefined;

  const move = (stage: LeadStage) => {
    void onAction?.("lead.move", { id: lead.id, stage });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-[var(--r-md)] border border-border bg-surface/70 p-3 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="bloco-headline break-words">{lead.name}</p>
          <p className="bloco-caption min-w-0 break-words text-fg-muted">{formatPhone(lead.phone)}</p>
        </div>
        <Badge
          tone={ORIGIN_TONE[lead.origin]}
          icon={ORIGIN_ICON[lead.origin]}
          className="shrink-0"
        >
          {ORIGIN_LABEL[lead.origin]}
        </Badge>
      </div>

      <p className="bloco-micro mt-2 text-fg-faint">Atribuicao do primeiro toque</p>
      <p className="bloco-caption text-fg-secondary">
        {lead.firstTouchBy ? `${lead.firstTouchBy} · ` : ""}
        {lead.firstTouchChannel} · {formatDateTime(lead.firstTouchAt)}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="bloco-headline tabular-nums">{formatBRL(lead.valueCents)}</span>
        <div className="flex items-center gap-1">
          {previous ? (
            <IconButton
              label={`Mover ${lead.name} para ${previous.label}`}
              size="icon-sm"
              onClick={() => move(previous.id)}
            >
              <ArrowLeft size={14} aria-hidden />
            </IconButton>
          ) : null}
          {next ? (
            <IconButton
              label={`Mover ${lead.name} para ${next.label}`}
              size="icon-sm"
              onClick={() => move(next.id)}
            >
              <ArrowRight size={14} aria-hidden />
            </IconButton>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: tabela densa                                              */
/* ------------------------------------------------------------------ */

function LeadTable({
  leads,
  stages,
  onAction,
}: {
  leads: Lead[];
  stages: LeadStageMeta[];
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  const stageLabel = (stage: LeadStage): string =>
    stages.find((s) => s.id === stage)?.label ?? stage;

  const columns: Array<Column<Lead>> = [
    {
      key: "name",
      header: "Lead",
      render: (lead) => (
        <div className="min-w-0">
          <p className="bloco-headline truncate text-fg">{lead.name}</p>
          <p className="bloco-caption text-fg-muted">{formatPhone(lead.phone)}</p>
        </div>
      ),
    },
    {
      key: "origin",
      header: "Origem",
      width: "130px",
      render: (lead) => (
        <Badge tone={ORIGIN_TONE[lead.origin]} icon={ORIGIN_ICON[lead.origin]}>
          {ORIGIN_LABEL[lead.origin]}
        </Badge>
      ),
    },
    {
      key: "value",
      header: "Valor",
      align: "right",
      width: "110px",
      render: (lead) => <span className="tabular-nums">{formatBRL(lead.valueCents)}</span>,
    },
    {
      key: "stage",
      header: "Etapa",
      width: "130px",
      render: (lead) => (
        <Badge tone={lead.stage === "customer" ? "success" : lead.stage === "qualified" ? "accent" : "neutral"}>
          {stageLabel(lead.stage)}
        </Badge>
      ),
    },
    {
      key: "firstTouch",
      header: "Primeiro toque",
      width: "220px",
      render: (lead) => (
        <div className="min-w-0">
          <p className="truncate text-fg-secondary">
            {lead.firstTouchBy ?? "Sem responsavel"} · {lead.firstTouchChannel}
          </p>
          <p className="bloco-caption text-fg-faint">{formatDateTime(lead.firstTouchAt)}</p>
        </div>
      ),
    },
    {
      key: "move",
      header: "Mover",
      align: "right",
      width: "96px",
      render: (lead) => {
        const index = stages.findIndex((stage) => stage.id === lead.stage);
        const previous = index > 0 ? stages[index - 1] : undefined;
        const next = index >= 0 && index < stages.length - 1 ? stages[index + 1] : undefined;
        return (
          <div className="flex items-center justify-end gap-1">
            {previous ? (
              <IconButton
                label={`Mover ${lead.name} para ${previous.label}`}
                size="icon-sm"
                onClick={() => void onAction?.("lead.move", { id: lead.id, stage: previous.id })}
              >
                <ArrowLeft size={14} aria-hidden />
              </IconButton>
            ) : null}
            {next ? (
              <IconButton
                label={`Mover ${lead.name} para ${next.label}`}
                size="icon-sm"
                onClick={() => void onAction?.("lead.move", { id: lead.id, stage: next.id })}
              >
                <ArrowRight size={14} aria-hidden />
              </IconButton>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <Panel tone="solid" padding="none">
      <DataTable
        columns={columns}
        rows={leads}
        rowKey={(lead) => lead.id}
        empty={
          <p className="bloco-callout px-4 py-6 text-center text-fg-muted">
            Nenhum lead no funil.
          </p>
        }
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: timeline cronologica do primeiro toque                    */
/* ------------------------------------------------------------------ */

function LeadTimeline({ leads, stages }: { leads: Lead[]; stages: LeadStageMeta[] }) {
  const ordered = [...leads].sort((a, b) => a.firstTouchAt.localeCompare(b.firstTouchAt));

  return (
    <Panel tone="solid" padding="md">
      <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
        {ordered.map((lead) => (
          <li key={lead.id} className="relative">
            <span className="absolute -left-[26px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-surface-strong text-fg-muted">
              <CircleDot size={10} aria-hidden />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <p className="bloco-headline text-fg">{lead.name}</p>
              <Badge tone={ORIGIN_TONE[lead.origin]} icon={ORIGIN_ICON[lead.origin]}>
                {ORIGIN_LABEL[lead.origin]}
              </Badge>
              <Badge tone={lead.stage === "customer" ? "success" : "neutral"}>
                {stages.find((stage) => stage.id === lead.stage)?.label ?? lead.stage}
              </Badge>
            </div>
            <p className="bloco-caption mt-1 text-fg-secondary">
              <MessageCircle size={12} className="mr-1 inline" aria-hidden />
              {lead.firstTouchChannel}
              {lead.firstTouchBy ? ` · ${lead.firstTouchBy}` : ""} · {formatDateTime(lead.firstTouchAt)}
            </p>
            <p className="bloco-micro mt-1 text-fg-faint">
              Ultimo toque {formatDateTime(lead.lastTouchAt)} · {formatPhone(lead.phone)} ·{" "}
              {formatBRL(lead.valueCents)}
            </p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "board" com `dragBoard`: arrastar entre colunas             */
/* ------------------------------------------------------------------ */

const INTERACTIVE = "a, button, input, select, textarea, summary, label, details[open] > *:not(summary)";
const MOUSE_SLOP = 5;
const TOUCH_HOLD_MS = 280;
const TOUCH_SLOP = 8;

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  touch: boolean;
  active: boolean;
  timer: number | null;
  ghost: HTMLElement | null;
  offsetX: number;
  offsetY: number;
  card: HTMLElement;
  /** Onde o dedo foi visto por ultimo (o touchend nao traz posicao). */
  lastX: number;
  lastY: number;
}

function DragBoard({
  board,
  onAction,
}: {
  board: LeadDragBoard;
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  const { stages, cards, canMove } = board;
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<string | null>(null);
  const drag = React.useRef<DragState | null>(null);
  const boardRef = React.useRef<HTMLDivElement>(null);
  const refocus = React.useRef<string | null>(null);
  const hintId = React.useId();

  // Depois de um movimento pelo teclado o cartao muda de coluna (e de no):
  // o foco volta para ele.
  React.useEffect(() => {
    if (!refocus.current) return;
    document.getElementById(`lead-${refocus.current}`)?.focus();
    refocus.current = null;
  });

  const move = (id: string, stage: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    void onAction?.("lead.move", { id, stage });
  };

  const columnAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y);
    const col = el?.closest<HTMLElement>("[data-kanban-stage]");
    if (col) return col.dataset.kanbanStage ?? null;
    // Fora de uma coluna (um vao, a borda do celular): a coluna mais perto do
    // dedo, se o dedo estiver na altura do quadro.
    const b = boardRef.current;
    if (!b) return null;
    const r = b.getBoundingClientRect();
    if (y < r.top - 40 || y > r.bottom + 40) return null;
    const cx = Math.min(Math.max(x, r.left + 1), r.right - 1);
    let best: { stage: string; distance: number } | null = null;
    for (const c of b.querySelectorAll<HTMLElement>("[data-kanban-stage]")) {
      const cr = c.getBoundingClientRect();
      if (cr.right < r.left || cr.left > r.right) continue;
      const distance = cx < cr.left ? cr.left - cx : cx > cr.right ? cx - cr.right : 0;
      if (!best || distance < best.distance) best = { stage: c.dataset.kanbanStage ?? "", distance };
    }
    return best?.stage || null;
  };

  const start = (d: DragState) => {
    const rect = d.card.getBoundingClientRect();
    const ghost = d.card.cloneNode(true) as HTMLElement;
    // Copia so para os olhos: sem ids repetidos, nada focavel.
    ghost.removeAttribute("id");
    for (const el of ghost.querySelectorAll("[id]")) el.removeAttribute("id");
    for (const el of ghost.querySelectorAll("[for]")) el.removeAttribute("for");
    ghost.removeAttribute("tabindex");
    ghost.setAttribute("aria-hidden", "true");
    ghost.setAttribute("data-kanban-ghost", "");
    Object.assign(ghost.style, {
      position: "fixed",
      zIndex: "1000",
      margin: "0",
      left: "0",
      top: "0",
      width: `${rect.width}px`,
      pointerEvents: "none",
      cursor: "grabbing",
      listStyle: "none",
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
    });
    document.body.appendChild(ghost);
    d.ghost = ghost;
    d.offsetX = d.startX - rect.left;
    d.offsetY = d.startY - rect.top;
    d.active = true;
    try {
      d.card.setPointerCapture(d.pointerId);
    } catch {
      /* captura e um extra */
    }
    setDragging(d.id);
    // Com o cartao perto da borda, o quadro continua rolando.
    const tick = () => {
      const cur = drag.current;
      const b = boardRef.current;
      if (!cur || !cur.active || !b) return;
      const r = b.getBoundingClientRect();
      const before = b.scrollLeft;
      if (cur.lastX > r.right - 48) b.scrollLeft += 10;
      else if (cur.lastX < r.left + 48) b.scrollLeft -= 10;
      if (b.scrollLeft !== before) setOver(columnAt(cur.lastX, cur.lastY));
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };

  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const place = (d: DragState, x: number, y: number) => {
    if (d.ghost) d.ghost.style.transform = `translate(${x - d.offsetX}px, ${y - d.offsetY}px)${reduced() ? "" : " rotate(2deg)"}`;
    d.lastX = x;
    d.lastY = y;
    setOver(columnAt(x, y));
  };

  const finish = (drop: boolean, x?: number, y?: number) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.timer !== null) window.clearTimeout(d.timer);
    d.ghost?.remove();
    setDragging(null);
    setOver(null);
    if (drop && d.active && x !== undefined && y !== undefined) {
      const stage = columnAt(x, y);
      if (stage) move(d.id, stage);
    }
  };

  // O dedo e seguido por eventos de TOQUE, nao de ponteiro: quando o navegador
  // comeca a rolar ele cancela o ponteiro, e so um touchmove impedido segura a
  // pagina enquanto o cartao esta preso. Antes de segurar, mover e rolar.
  const touchHandlers = React.useRef<{ move: (e: TouchEvent) => void; end: (e: TouchEvent) => void } | null>(null);
  React.useEffect(() => {
    const onMove = (e: TouchEvent) => touchHandlers.current?.move(e);
    const onEnd = (e: TouchEvent) => touchHandlers.current?.end(e);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);
  touchHandlers.current = {
    move: (e: TouchEvent) => {
      const d = drag.current;
      const t = e.touches[0];
      if (!d || !d.touch || !t) return;
      if (!d.active) {
        if (Math.hypot(t.clientX - d.startX, t.clientY - d.startY) > TOUCH_SLOP) finish(false);
        return;
      }
      e.preventDefault();
      place(d, t.clientX, t.clientY);
    },
    end: () => {
      const d = drag.current;
      if (!d || !d.touch) return;
      finish(d.active, d.lastX, d.lastY);
    },
  };

  const onPointerDown = (id: string, busy?: boolean) => (event: React.PointerEvent<HTMLLIElement>) => {
    if (!canMove || busy) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
    const d: DragState = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      touch: event.pointerType === "touch",
      active: false,
      timer: null,
      ghost: null,
      offsetX: 0,
      offsetY: 0,
      card: event.currentTarget,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    drag.current = d;
    if (d.touch) {
      d.timer = window.setTimeout(() => {
        if (drag.current === d) {
          start(d);
          place(d, d.startX, d.startY);
          navigator.vibrate?.(10);
        }
      }, TOUCH_HOLD_MS);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    if (!d || d.touch || d.pointerId !== event.pointerId) return;
    // O botao foi solto onde o cartao nao viu: sem arrastar.
    if (event.buttons === 0) {
      finish(false);
      return;
    }
    if (!d.active) {
      if (Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < MOUSE_SLOP) return;
      start(d);
    }
    event.preventDefault();
    place(d, event.clientX, event.clientY);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    if (!d || d.touch || d.pointerId !== event.pointerId) return;
    finish(true, event.clientX, event.clientY);
  };

  const onKeyDown = (id: string, stage: string) => (event: React.KeyboardEvent<HTMLLIElement>) => {
    if (!canMove || event.target !== event.currentTarget) return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const i = stages.findIndex((s) => s.id === stage);
    const next = stages[i + (event.key === "ArrowRight" ? 1 : -1)];
    if (!next) return;
    refocus.current = id;
    move(id, next.id);
  };

  return (
    <div className="flex flex-col gap-2">
      {canMove && board.hint ? (
        <p id={hintId} className="bloco-callout text-fg-muted">
          {board.hint}
        </p>
      ) : null}
      {/* tabIndex: o quadro rola de lado; o teclado precisa alcanca-lo mesmo sem cartao. */}
      <div
        ref={boardRef}
        role="list"
        aria-label={board.label}
        tabIndex={0}
        className="bloco-scroll grid auto-cols-[minmax(16rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {stages.map((stage) => {
          const inColumn = cards.filter((c) => c.stage === stage.id);
          return (
            <section
              key={stage.id}
              role="listitem"
              aria-labelledby={`kanban-col-${stage.id}`}
              data-kanban-stage={stage.id}
              className={
                "grid min-h-48 content-start gap-2 rounded-[var(--r-lg)] border border-border bg-surface/40 p-3 " +
                (over === stage.id && dragging ? "outline-2 -outline-offset-2 outline-dashed outline-accent-ink bg-accent-soft/40" : "")
              }
            >
              <header className="flex items-center justify-between gap-2">
                <h2
                  id={`kanban-col-${stage.id}`}
                  className={
                    "bloco-callout font-bold uppercase tracking-wide " +
                    (stage.tone === "success" ? "text-success" : stage.tone === "danger" ? "text-danger" : "text-fg")
                  }
                >
                  {stage.label}
                </h2>
                <Badge tone="neutral" className="shrink-0" data-kanban-count="">
                  {inColumn.length}
                </Badge>
              </header>
              {stage.total ? (
                <p className="bloco-caption font-semibold text-fg-muted tabular-nums" data-kanban-total="">
                  {stage.total}
                </p>
              ) : null}
              <ul className="m-0 grid list-none gap-2 p-0">
                {inColumn.length === 0 ? (
                  <li className="bloco-caption rounded-[var(--r-md)] border border-dashed border-border p-3 text-center text-fg-muted">
                    {board.empty ?? "Nenhum lead nesta etapa."}
                  </li>
                ) : null}
                {inColumn.map((card) => (
                  <li
                    key={card.id}
                    id={`lead-${card.id}`}
                    data-lead-id={card.id}
                    tabIndex={canMove ? 0 : undefined}
                    aria-describedby={canMove && board.hint ? hintId : undefined}
                    aria-busy={card.busy || undefined}
                    onPointerDown={onPointerDown(card.id, card.busy)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => {
                      if (!drag.current?.touch) finish(false);
                    }}
                    onKeyDown={onKeyDown(card.id, card.stage)}
                    className={
                      "grid scroll-mt-4 gap-1 rounded-[var(--r-md)] border border-border bg-surface-solid p-3 shadow-sm transition-opacity duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink " +
                      (canMove ? "cursor-grab touch-pan-x touch-pan-y select-none [&_input]:select-text [&_select]:select-text [&_textarea]:select-text " : "") +
                      (dragging === card.id ? "opacity-35 " : card.busy ? "opacity-70 " : "")
                    }
                  >
                    {card.body}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
