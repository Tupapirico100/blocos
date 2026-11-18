import * as React from "react";
import { Button, ConfirmDialog, EmptyState } from "@blocos/ui";
import { CalendarPlus, ExternalLink, Images, Instagram, Plug, RotateCcw, Send, Trash2, X } from "lucide-react";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { socialAgendaRecipe } from "./social-agenda.recipe.js";
import { PostStatus, type SocialPostStatus } from "./status.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export interface SocialAgendaPost {
  id: string;
  /** Pagina do post (detalhe/edicao). */
  href: string;
  /** "09:00", ja no horario de Brasilia. */
  time: string;
  /** Sem o "@". `null` = conta removida. */
  account: string | null;
  /** "Carrossel · 4 imagens", "Reels (também no feed)", "Story (vídeo)"... */
  formatLabel: string;
  /** Primeira linha da legenda ("" = sem legenda). */
  caption: string;
  isStory?: boolean;
  /** Primeira midia (URL publica). */
  thumb: { url: string; kind: "image" | "video" } | null;
  /** Quantidade de midias (mostra o contador no carrossel quando > 1). */
  mediaCount: number;
  status: SocialPostStatus;
  /** Erro ja tratado (status error) ou aviso (ex.: aguardando cota). */
  message?: string | null;
  /** Link do post publicado (so https://www.instagram.com/...). */
  permalink?: string | null;
}

export interface SocialAgendaDay {
  key: string;
  /** "18" */
  day: string;
  /** "ter" */
  weekday: string;
  /** "nov" */
  month: string;
  posts: SocialAgendaPost[];
}

export interface SocialAgendaData {
  /** Filtro por conta (aparece com 2+ contas). */
  accounts: Array<{ id: string; username: string; href: string }>;
  activeAccountId: string | null;
  allAccountsHref: string;
  /** Na fila: agendado, processando, publicando, com erro. */
  upcoming: SocialAgendaDay[];
  /** Publicados e cancelados recentes. */
  history: SocialAgendaDay[];
  newPostHref: string;
  accountsHref: string;
}

export type SocialAgendaVariant = "route" | "compact";

type Confirm = { kind: "cancel" | "delete"; post: SocialAgendaPost } | null;

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialAgenda(props: BlockProps<SocialAgendaData, SocialAgendaVariant>) {
  const { data, onAction, variant = "route", state = "success", connectors, onRequestConnector, className } = props;
  const [confirm, setConfirm] = React.useState<Confirm>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const run = async (action: string, id: string) => {
    setBusy(`${action}:${id}`);
    try {
      await onAction?.(action, { id });
    } finally {
      setBusy(null);
    }
  };

  const linkBtn =
    "inline-flex h-[var(--btn-h-sm)] items-center gap-1.5 rounded-[var(--r-sm)] px-3 bloco-control-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <BlockFrame
      recipe={socialAgendaRecipe}
      onAction={onAction}
      requires={[]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
    >
      <div className="flex flex-col gap-6">
        {data.accounts.length > 1 ? (
          <nav aria-label="Filtrar por conta" className="flex flex-wrap gap-2">
            <Chip href={data.allAccountsHref} active={data.activeAccountId === null}>
              Todas
            </Chip>
            {data.accounts.map((a) => (
              <Chip key={a.id} href={a.href} active={data.activeAccountId === a.id}>
                @{a.username}
              </Chip>
            ))}
          </nav>
        ) : null}

        {data.accounts.length === 0 ? (
          <EmptyState
            icon={<Plug className="h-5 w-5" aria-hidden />}
            title="Conecte uma conta primeiro"
            description="O agendador publica em contas profissionais do Instagram conectadas pelo login oficial da Meta."
            action={
              <a href={data.accountsHref} className={`${linkBtn} bg-accent-strong text-accent-fg hover:brightness-110`}>
                Ir para Contas
              </a>
            }
          />
        ) : data.upcoming.length === 0 ? (
          <EmptyState
            icon={<CalendarPlus className="h-5 w-5" aria-hidden />}
            title="Fila vazia"
            description="Suba as artes, escreva a legenda e escolha o horário. O sistema publica sozinho."
            action={
              <a href={data.newPostHref} className={`${linkBtn} bg-accent-strong text-accent-fg hover:brightness-110`}>
                Agendar o primeiro post
              </a>
            }
          />
        ) : (
          <Days days={data.upcoming} compact={variant === "compact"} busy={busy} run={run} setConfirm={setConfirm} />
        )}

        {data.history.length > 0 ? (
          <section aria-labelledby="social-agenda-history" className="flex flex-col gap-3">
            <h2 id="social-agenda-history" className="bloco-title3">
              Histórico recente
            </h2>
            <Days days={data.history} compact={variant === "compact"} busy={busy} run={run} setConfirm={setConfirm} />
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => (open ? null : setConfirm(null))}
        title={confirm?.kind === "cancel" ? "Cancelar este post?" : "Excluir este post?"}
        description={
          confirm?.kind === "cancel"
            ? "Ele sai da fila. Dá para reagendar depois pela página do post."
            : "O post e os arquivos dele saem do sistema. Se já foi publicado, continua no Instagram."
        }
        confirmLabel={confirm?.kind === "cancel" ? "Cancelar post" : "Excluir post"}
        cancelLabel="Voltar"
        onConfirm={() => {
          if (confirm) void run(confirm.kind === "cancel" ? "post.cancel" : "post.delete", confirm.post.id);
          setConfirm(null);
        }}
      />
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Partes                                                              */
/* ------------------------------------------------------------------ */

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        "inline-flex min-h-8 items-center rounded-[var(--r-pill)] border px-3 bloco-label font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
        (active ? "border-fg bg-fg text-fg-inverse" : "border-border text-fg-secondary hover:bg-surface-hover")
      }
    >
      {children}
    </a>
  );
}

function Days({
  days,
  compact,
  busy,
  run,
  setConfirm,
}: {
  days: SocialAgendaDay[];
  compact: boolean;
  busy: string | null;
  run: (action: string, id: string) => Promise<void>;
  setConfirm: (c: Confirm) => void;
}) {
  return (
    <div className="flex flex-col">
      {days.map((d) => (
        <section
          key={d.key}
          aria-label={`${d.day} de ${d.month}`}
          className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-border py-4 sm:grid-cols-[88px_minmax(0,1fr)]"
        >
          <div className="flex items-baseline gap-2 sm:flex-col sm:gap-0">
            <span className="bloco-display leading-none tabular-nums">{d.day}</span>
            <span className="bloco-caption text-fg-muted">
              {d.weekday} {d.month}
            </span>
          </div>
          <ul className="flex flex-col">
            {d.posts.map((p) => (
              <PostRow key={p.id} post={p} compact={compact} busy={busy} run={run} setConfirm={setConfirm} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PostRow({
  post,
  compact,
  busy,
  run,
  setConfirm,
}: {
  post: SocialAgendaPost;
  compact: boolean;
  busy: string | null;
  run: (action: string, id: string) => Promise<void>;
  setConfirm: (c: Confirm) => void;
}) {
  const caption = post.caption || (post.isStory ? "Story (sem legenda)" : "Sem legenda");
  const handle = post.account ? `@${post.account}` : "conta removida";
  const linkSm =
    "inline-flex h-[var(--btn-h-sm)] items-center gap-1.5 rounded-[var(--r-sm)] px-3 bloco-control-sm font-medium text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const short = caption.length > 40 ? `${caption.slice(0, 40)}…` : caption;

  return (
    <li className="@container border-b border-border/60 py-3 last:border-0">
      <div className="flex flex-col gap-3 @[620px]:flex-row @[620px]:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="w-12 shrink-0 pt-0.5 bloco-headline tabular-nums">{post.time}</span>
          {compact ? null : (
            <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[var(--r-sm)] bg-surface-active">
              {post.thumb ? (
                post.thumb.kind === "video" ? (
                  <video src={`${post.thumb.url}#t=0.1`} preload="metadata" muted playsInline aria-hidden className="h-full w-full object-cover" />
                ) : (
                  <img src={post.thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )
              ) : (
                <span className="flex h-full w-full items-center justify-center text-fg-muted">
                  <Instagram className="h-4 w-4" aria-hidden />
                </span>
              )}
              {post.mediaCount > 1 ? (
                <span className="absolute right-1 bottom-1 inline-flex items-center gap-0.5 rounded-full bg-black/75 px-1.5 bloco-micro text-white">
                  <Images className="h-2.5 w-2.5" aria-hidden />
                  {post.mediaCount}
                </span>
              ) : null}
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <p className="bloco-caption text-fg-muted">
              <span className="font-semibold text-fg">{handle}</span> · {post.formatLabel}
            </p>
            <a
              href={post.href}
              title={caption}
              className="block min-h-8 max-w-full truncate rounded-[var(--r-sm)] py-1.5 bloco-callout text-fg underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {caption}
            </a>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <PostStatus status={post.status} />
              {post.status === "published" && post.permalink ? (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-8 items-center gap-1 rounded-[var(--r-sm)] bloco-label text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Ver no Instagram
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              ) : null}
            </div>
            {post.message ? (
              <p className={post.status === "error" ? "bloco-caption break-words text-danger" : "bloco-caption break-words text-fg-muted"}>
                {post.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 @[620px]:justify-end">
          {post.status === "scheduled" ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                icon={<Send className="h-3.5 w-3.5" aria-hidden />}
                loading={busy === `post.publishNow:${post.id}`}
                onClick={() => void run("post.publishNow", post.id)}
                aria-label={`Publicar agora: ${short}`}
              >
                Publicar agora
              </Button>
              <a href={post.href} className={linkSm} aria-label={`Editar: ${short}`}>
                Editar
              </a>
              <Button
                size="sm"
                variant="danger-ghost"
                icon={<X className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => setConfirm({ kind: "cancel", post })}
                aria-label={`Cancelar: ${short}`}
              >
                Cancelar
              </Button>
            </>
          ) : null}
          {post.status === "error" ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
                loading={busy === `post.retry:${post.id}`}
                onClick={() => void run("post.retry", post.id)}
                aria-label={`Tentar de novo: ${short}`}
              >
                Tentar de novo
              </Button>
              <a href={post.href} className={linkSm} aria-label={`Editar: ${short}`}>
                Editar
              </a>
            </>
          ) : null}
          {post.status === "canceled" ? (
            <a href={post.href} className={linkSm} aria-label={`Reagendar: ${short}`}>
              Reagendar
            </a>
          ) : null}
          {post.status === "published" ? (
            <a href={post.href} className={linkSm} aria-label={`Detalhes: ${short}`}>
              Detalhes
            </a>
          ) : null}
          {post.status === "error" || post.status === "canceled" ? (
            <Button
              size="sm"
              variant="danger-ghost"
              icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
              onClick={() => setConfirm({ kind: "delete", post })}
              aria-label={`Excluir: ${short}`}
            >
              Excluir
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
