import * as React from "react";
import { Button, Callout, ConfirmDialog, Field, Input, KeyValue, Panel, Textarea } from "@blocos/ui";
import { ExternalLink, RotateCcw, Save, Send, Trash2, X } from "lucide-react";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { formatSocialDateTime } from "./format.js";
import { socialPostDetailRecipe } from "./social-post-detail.recipe.js";
import { PostStatus, type SocialPostStatus } from "./status.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export interface SocialPostDetailData {
  post: {
    id: string;
    /** Sem o "@". `null` = conta removida. */
    account: string | null;
    status: SocialPostStatus;
    formatLabel: string;
    isStory?: boolean;
    /** ISO. */
    scheduledAt: string;
    publishedAt?: string | null;
    permalink?: string | null;
    containerStatus?: string | null;
    attempts: number;
    /** Erro ja tratado (status error) ou aviso. */
    message?: string | null;
    caption: string;
    media: Array<{ id: string; url: string; kind: "image" | "video" }>;
    /** Automacoes ligadas a este post, ja em texto. */
    automations: string[];
  };
  /** Resultado da ultima acao (vem do servidor). */
  notice?: { tone: "success" | "danger"; text: string } | null;
}

export type SocialPostDetailVariant = "page";

export const MAX_CAPTION = 2200;
export const MAX_HASHTAGS = 30;
const countHashtags = (text: string) => (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length;
const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialPostDetail(props: BlockProps<SocialPostDetailData, SocialPostDetailVariant>) {
  const { data, onAction, state = "success", connectors, onRequestConnector, className } = props;
  const { post } = data;
  const [confirm, setConfirm] = React.useState<"cancel" | "delete" | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState(post.caption);
  const [when, setWhen] = React.useState("");

  const editable = post.status === "scheduled" || post.status === "error" || post.status === "canceled";
  const removable = post.status !== "processing" && post.status !== "publishing";

  // Valor inicial depois de montar: evita diferenca de fuso entre servidor e navegador.
  React.useEffect(() => {
    const d = new Date(post.scheduledAt);
    setWhen(toLocalInput(d.getTime() < Date.now() ? new Date(Date.now() + 60 * 60_000) : d));
  }, [post.scheduledAt]);

  const run = async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(action);
    try {
      await onAction?.(action, { id: post.id, ...payload });
    } finally {
      setBusy(null);
    }
  };

  const len = [...caption].length;
  const tags = countHashtags(caption);
  const tooLong = len > MAX_CAPTION;
  const tooManyTags = tags > MAX_HASHTAGS;

  const facts = [
    { label: "Formato", value: post.formatLabel },
    { label: "Horário", value: `${formatSocialDateTime(post.scheduledAt)} (Brasília)` },
    ...(post.publishedAt ? [{ label: "Publicado em", value: formatSocialDateTime(post.publishedAt) }] : []),
    ...(post.permalink
      ? [
          {
            label: "No Instagram",
            value: (
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1 rounded-[var(--r-sm)] text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Abrir o post
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            ),
          },
        ]
      : []),
    ...(post.containerStatus ? [{ label: "Status na Meta", value: post.containerStatus }] : []),
    { label: "Tentativas", value: String(post.attempts) },
    ...(post.automations.length ? [{ label: "Automação", value: post.automations.join(" | ") }] : []),
  ];

  return (
    <BlockFrame
      recipe={socialPostDetailRecipe}
      onAction={onAction}
      requires={[]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <PostStatus status={post.status} />
        </div>

        {data.notice ? (
          <div role={data.notice.tone === "danger" ? "alert" : "status"}>
            <Callout tone={data.notice.tone}>{data.notice.text}</Callout>
          </div>
        ) : null}
        {post.message ? (
          <div role={post.status === "error" ? "alert" : undefined}>
            <Callout tone={post.status === "error" ? "danger" : "info"}>{post.message}</Callout>
          </div>
        ) : null}

        {post.media.length > 0 ? (
          <ul aria-label="Arquivos do post" className="bloco-scroll flex gap-3 overflow-x-auto pb-1">
            {post.media.map((m, i) => (
              <li key={m.id} className="h-[200px] w-[160px] shrink-0 overflow-hidden rounded-[var(--r-md)] bg-surface-active">
                {m.kind === "video" ? (
                  <video src={m.url} controls muted playsInline aria-label="Vídeo do post" className="h-full w-full object-cover" />
                ) : (
                  <img src={m.url} alt={`Imagem ${i + 1}`} className="h-full w-full object-cover" />
                )}
              </li>
            ))}
          </ul>
        ) : null}

        <Panel tone="solid" padding="md">
          <KeyValue items={facts} />
        </Panel>

        <div className="flex flex-wrap items-center gap-2">
          {post.status === "scheduled" ? (
            <>
              <Button icon={<Send className="h-4 w-4" aria-hidden />} loading={busy === "post.publishNow"} onClick={() => void run("post.publishNow")}>
                Publicar agora
              </Button>
              <Button variant="danger-ghost" icon={<X className="h-4 w-4" aria-hidden />} onClick={() => setConfirm("cancel")}>
                Cancelar post
              </Button>
            </>
          ) : null}
          {post.status === "error" ? (
            <Button icon={<RotateCcw className="h-4 w-4" aria-hidden />} loading={busy === "post.retry"} onClick={() => void run("post.retry")}>
              Tentar de novo
            </Button>
          ) : null}
          {removable ? (
            <Button variant="danger-ghost" icon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => setConfirm("delete")}>
              Excluir
            </Button>
          ) : null}
        </div>

        {editable ? (
          <section aria-labelledby="social-post-edit" className="flex flex-col gap-4">
            <h2 id="social-post-edit" className="bloco-title3">
              {post.status === "scheduled" ? "Editar" : "Reagendar"}
            </h2>
            <form
              className="flex flex-col gap-4"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (tooLong || tooManyTags || !when) return;
                void run("post.update", { caption, scheduledAt: new Date(when).toISOString() });
              }}
            >
              {post.isStory ? null : (
                <Field
                  label="Legenda"
                  htmlFor="social-post-caption"
                  aside={
                    <span className={tooLong || tooManyTags ? "text-danger" : undefined}>
                      {len}/{MAX_CAPTION} caracteres · {tags}/{MAX_HASHTAGS} hashtags
                    </span>
                  }
                  error={tooLong ? `A legenda passa de ${MAX_CAPTION} caracteres.` : tooManyTags ? `O Instagram aceita no máximo ${MAX_HASHTAGS} hashtags.` : undefined}
                >
                  <Textarea id="social-post-caption" value={caption} invalid={tooLong || tooManyTags} onChange={(e) => setCaption(e.target.value)} className="min-h-[140px]" />
                </Field>
              )}
              <Field
                label="Publicar em"
                htmlFor="social-post-when"
                required
                hint="Horário de Brasília. Os arquivos não mudam; para trocar as imagens, crie um novo post."
              >
                {/* :focus (não só :focus-visible): no ícone do calendário o Chromium não marca focus-visible no campo. */}
                <Input id="social-post-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required className="max-w-xs focus:outline-2 focus:outline-solid focus:outline-offset-1 focus:outline-accent" />
              </Field>
              <div>
                <Button type="submit" icon={<Save className="h-4 w-4" aria-hidden />} loading={busy === "post.update"} disabled={tooLong || tooManyTags || !when}>
                  Salvar e reagendar
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <section aria-labelledby="social-post-caption-title" className="flex flex-col gap-2">
            <h2 id="social-post-caption-title" className="bloco-title3">
              Legenda
            </h2>
            <p className="bloco-body max-w-prose whitespace-pre-wrap break-words text-fg-secondary">{post.caption || "Sem legenda."}</p>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => (open ? null : setConfirm(null))}
        title={confirm === "cancel" ? "Cancelar este post?" : "Excluir este post?"}
        description={
          confirm === "cancel"
            ? "Ele sai da fila. Dá para reagendar depois nesta mesma página."
            : "O post e os arquivos dele saem do sistema. Se já foi publicado, continua no Instagram."
        }
        confirmLabel={confirm === "cancel" ? "Cancelar post" : "Excluir post"}
        cancelLabel="Voltar"
        onConfirm={() => {
          const kind = confirm;
          setConfirm(null);
          if (kind) void run(kind === "cancel" ? "post.cancel" : "post.delete");
        }}
      />
    </BlockFrame>
  );
}
