import * as React from "react";
import {
  Badge,
  Button,
  Callout,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Panel,
  SectionHeader,
  Select,
  Textarea,
} from "@blocos/ui";
import { CalendarClock, Hash, Image, Instagram, Send, SquareStack, Video } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { socialComposerRecipe } from "./social-composer.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type SocialPostFormat = "post" | "carrossel" | "reels";

export interface SocialComposerAccount {
  id: string;
  handle: string;
  displayName: string;
}

export interface SocialMediaItem {
  id: string;
  kind: "image" | "video";
  name: string;
  /** Rotulo legivel (tamanho/duracao). Nunca bytes crus. */
  meta: string;
}

export interface SocialComposerData {
  accounts: SocialComposerAccount[];
  /** Midias disponiveis no storage do programa. */
  media: SocialMediaItem[];
  /** Rascunho em edicao (preenche o formulario). */
  draft?: {
    accountId?: string;
    format: SocialPostFormat;
    caption: string;
    hashtags: string[];
    mediaIds: string[];
    /** ISO — momento do agendamento (hora local do programa). */
    scheduledAt?: string;
  };
}

export type SocialComposerVariant = "composer" | "split" | "preview";

/* ------------------------------------------------------------------ */
/* Regras de formato (limites reais do Instagram)                      */
/* ------------------------------------------------------------------ */

const FORMAT_INFO: Record<
  SocialPostFormat,
  { label: string; hint: string; maxMedia: number; icon: React.ReactNode }
> = {
  post: {
    label: "Post",
    hint: "Uma imagem, ate 10 legendas",
    maxMedia: 1,
    icon: <Image className="h-3.5 w-3.5" aria-hidden />,
  },
  carrossel: {
    label: "Carrossel",
    hint: "Ate 10 midias",
    maxMedia: 10,
    icon: <SquareStack className="h-3.5 w-3.5" aria-hidden />,
  },
  reels: {
    label: "Reels",
    hint: "Um video, ate 60s",
    maxMedia: 1,
    icon: <Video className="h-3.5 w-3.5" aria-hidden />,
  },
};

const MAX_CAPTION = 2200;

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialComposer(props: BlockProps<SocialComposerData, SocialComposerVariant>) {
  const { data, onAction, variant = "composer", state = "success", connectors = [], onRequestConnector, className } = props;

  const draft = data.draft;

  const [format, setFormat] = React.useState<SocialPostFormat>(draft?.format ?? "post");
  const [accountId, setAccountId] = React.useState<string>(draft?.accountId ?? data.accounts[0]?.id ?? "");
  const [caption, setCaption] = React.useState<string>(draft?.caption ?? "");
  const [hashtags, setHashtags] = React.useState<string>(draft?.hashtags.join(" ") ?? "");
  const [mediaIds, setMediaIds] = React.useState<string[]>(draft?.mediaIds ?? []);
  const [scheduledAt, setScheduledAt] = React.useState<string>(draft?.scheduledAt ?? "");

  const selectedAccount = data.accounts.find((a) => a.id === accountId);
  const tagList = hashtags
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);

  const error = validate({ format, caption, mediaIds, data, accountId });

  const schedule = () => {
    if (error) return;
    onAction?.("post.schedule", {
      accountId,
      format,
      caption,
      hashtags: tagList,
      mediaIds,
      scheduledAt: scheduledAt || null,
      timezone: "America/Sao_Paulo",
    });
  };

  const toggleMedia = (id: string) => {
    setMediaIds((current) => {
      if (current.includes(id)) return current.filter((m) => m !== id);
      const max = FORMAT_INFO[format].maxMedia;
      if (current.length >= max) return [...current.slice(1), id];
      return [...current, id];
    });
  };

  const preview = (
    <PostPreview
      handle={selectedAccount?.handle ?? "@conta.sem.conexao"}
      format={format}
      caption={caption}
      hashtags={tagList}
      media={data.media.filter((m) => mediaIds.includes(m.id))}
    />
  );

  const form = (
    <div className="flex flex-col gap-4">
      <Field label="Formato" htmlFor="social-composer-format" hint={FORMAT_INFO[format].hint}>
        <Select
          id="social-composer-format"
          value={format}
          onChange={(e) => {
            const next = e.target.value as SocialPostFormat;
            setFormat(next);
            const max = FORMAT_INFO[next].maxMedia;
            setMediaIds((current) => current.slice(0, max));
          }}
        >
          {(Object.keys(FORMAT_INFO) as SocialPostFormat[]).map((key) => (
            <option key={key} value={key}>
              {FORMAT_INFO[key].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Conta" htmlFor="social-composer-account" required>
        <Select
          id="social-composer-account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {data.accounts.length === 0 ? <option value="">Nenhuma conta conectada</option> : null}
          {data.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.handle} — {account.displayName}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Legenda"
        htmlFor="social-composer-caption"
        required={format !== "reels"}
        aside={`${caption.length}/${MAX_CAPTION}`}
        hint="A legenda nao substitui consentimento de marketing. Nao escreva dado de paciente."
      >
        <Textarea
          id="social-composer-caption"
          value={caption}
          maxLength={MAX_CAPTION}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Conte a novidade do consultorio em uma frase..."
        />
      </Field>

      <Field label="Hashtags" htmlFor="social-composer-hashtags" hint="Separe por espaco ou virgula.">
        <Input
          id="social-composer-hashtags"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="nutricao #consultorio #agenda"
        />
      </Field>

      <Field
        label="Midia"
        hint={format === "reels" ? "Reels aceita um video." : `Selecione ate ${FORMAT_INFO[format].maxMedia} item(ns).`}
      >
        {data.media.length === 0 ? (
          <p className="bloco-caption">Nenhuma midia disponivel no storage do programa.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.media.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-[var(--r-sm)] border border-border bg-surface/50 px-2.5 py-2 transition-colors hover:bg-surface-hover"
              >
                {/* O nome do arquivo vira o rotulo do checkbox: cada midia tem nome acessivel proprio. */}
                <Checkbox
                  className="min-w-0 flex-1"
                  checked={mediaIds.includes(item.id)}
                  onCheckedChange={() => toggleMedia(item.id)}
                  label={
                    <span className="bloco-callout inline-block min-w-0 max-w-full flex-1 truncate text-fg">
                      {item.name}
                      {/* Contexto para leitor de tela: o nome sozinho nao diz o que a midia e. */}
                      <span className="sr-only"> — midia para publicar</span>
                    </span>
                  }
                  ariaLabel={`Selecionar midia ${item.name}`}
                />
                <span className="bloco-micro shrink-0">
                  {item.kind === "video" ? "Video" : "Imagem"} · {item.meta}
                </span>
              </div>
            ))}
          </div>
        )}
      </Field>

      <Field
        label="Agendar para"
        htmlFor="social-composer-schedule"
        hint="Horario local do programa (America/Sao_Paulo). A conversao para UTC e feita em duas passadas por causa do DST."
      >
        <Input
          id="social-composer-schedule"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </Field>

      {error ? (
        <p role="alert" className="bloco-caption text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button icon={<Send className="h-4 w-4" aria-hidden />} onClick={schedule} disabled={Boolean(error)}>
          Agendar publicacao
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setCaption("");
            setHashtags("");
            setMediaIds([]);
            setScheduledAt("");
          }}
        >
          Limpar
        </Button>
      </div>
    </div>
  );

  const instagramMissing = connectors.find((c) => c.id === "instagram")?.status !== "provisioned";

  return (
    <BlockFrame
      state={state}
      className={className}
        recipe={socialComposerRecipe}
        
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Agendador-Instagram"
          title="Composer de publicacao"
          description="Monte o post (carrossel ou Reels), revise o preview e agende. Nada e publicado direto daqui: tudo passa pelo agendador."
        />

        {instagramMissing ? (
          <Callout
            tone="warn"
            title="Instagram ainda nao conectado"
            action={
              <Button size="sm" variant="outline" onClick={() => onRequestConnector?.("instagram")}>
                Solicitar acesso
              </Button>
            }
          >
            O agendamento so fica disponivel depois que o dono da plataforma autorizar as contas do Instagram. Aqui voce
            pode deixar o rascunho pronto.
          </Callout>
        ) : null}

        {data.accounts.length === 0 ? (
          <EmptyState
            icon={<Instagram className="h-5 w-5" aria-hidden />}
            title="Sem conta conectada"
            description="Conecte uma conta do Instagram antes de compor uma publicacao."
          />
        ) : variant === "preview" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge tone="accent" icon={FORMAT_INFO[format].icon}>
                {FORMAT_INFO[format].label}
              </Badge>
              <Badge tone="outline">{selectedAccount?.handle ?? "—"}</Badge>
              {scheduledAt ? (
                <Badge tone="info" icon={<CalendarClock className="h-3 w-3" aria-hidden />}>
                  {scheduledAt.replace("T", " ")}
                </Badge>
              ) : null}
            </div>
            {preview}
          </div>
        ) : variant === "split" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel tone="solid" padding="md">
              {form}
            </Panel>
            <div className="flex flex-col items-center gap-3">
              <span className="bloco-micro">Preview</span>
              {preview}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <Panel tone="solid" padding="md" className="w-full lg:w-1/2">
              {form}
            </Panel>
            <div className="flex w-full flex-col items-center gap-3 lg:w-1/2">
              <span className="bloco-micro">Preview</span>
              {preview}
            </div>
          </div>
        )}

        <Callout tone="info" icon={<Hash className="h-4 w-4" aria-hidden />} title="Limites que a interface respeita">
          Carrossel aceita ate 10 midias, Reels aceita um video de ate 60s e a legenda vai ate {MAX_CAPTION} caracteres.
          Publicar nunca acontece no horario local do servidor — a conversao para UTC leva em conta o DST.
        </Callout>
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Preview                                                              */
/* ------------------------------------------------------------------ */

function PostPreview({
  handle,
  format,
  caption,
  hashtags,
  media,
}: {
  handle: string;
  format: SocialPostFormat;
  caption: string;
  hashtags: string[];
  media: SocialMediaItem[];
}) {
  const isReels = format === "reels";

  return (
    <div
      className={
        isReels
          ? "w-full max-w-[280px] overflow-hidden rounded-[var(--r-xl)] border border-border bg-surface-strong shadow-[var(--shadow-3)]"
          : "w-full max-w-[380px] overflow-hidden rounded-[var(--r-xl)] border border-border bg-surface-strong shadow-[var(--shadow-3)]"
      }
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
          <Instagram className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="bloco-callout min-w-0 flex-1 truncate font-medium text-fg">{handle}</span>
        <span className="bloco-micro ml-auto">{FORMAT_INFO[format].label}</span>
      </div>

      {isReels ? (
        <div className="flex aspect-[9/16] items-center justify-center bg-surface-active">
          {media.length > 0 ? (
            <span className="bloco-caption px-4 text-center">
              <Video className="mx-auto mb-2 h-6 w-6" aria-hidden />
              {media[0]?.name}
            </span>
          ) : (
            <span className="bloco-caption px-4 text-center">
              <Video className="mx-auto mb-2 h-6 w-6" aria-hidden />
              Sem video selecionado
            </span>
          )}
        </div>
      ) : (
        <div
          className={
            media.length > 1
              ? "grid aspect-square grid-cols-2 gap-0.5 bg-surface-active"
              : "flex aspect-square items-center justify-center bg-surface-active"
          }
        >
          {media.length === 0 ? (
            <span className="bloco-caption px-4 text-center">
              <Image className="mx-auto mb-2 h-6 w-6" aria-hidden />
              Sem midia selecionada
            </span>
          ) : (
            media.map((item) => (
              <span key={item.id} className="bloco-caption truncate px-3 py-2 text-center">
                {item.name}
              </span>
            ))
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 px-3 py-3">
        <p className="bloco-callout line-clamp-4 whitespace-pre-line text-fg">
          {caption || "Sua legenda aparece aqui."}
        </p>
        {hashtags.length > 0 ? (
          <p className="bloco-caption text-accent-ink">{hashtags.map((t) => `#${t}`).join(" ")}</p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Validacao                                                           */
/* ------------------------------------------------------------------ */

function validate(input: {
  format: SocialPostFormat;
  caption: string;
  mediaIds: string[];
  accountId: string;
  data: SocialComposerData;
}): string | null {
  if (!input.accountId) return "Escolha a conta que vai publicar.";
  if (input.format !== "reels" && input.caption.trim().length === 0) return "Escreva a legenda.";
  if (input.mediaIds.length === 0) return "Selecione ao menos uma midia.";
  if (input.mediaIds.length > FORMAT_INFO[input.format].maxMedia) {
    return `${FORMAT_INFO[input.format].label} aceita ate ${FORMAT_INFO[input.format].maxMedia} midia(s).`;
  }
  if (input.format === "reels") {
    const selected = input.data.media.filter((m) => input.mediaIds.includes(m.id));
    if (selected.some((m) => m.kind !== "video")) return "Reels aceita apenas video.";
  }
  return null;
}
