import * as React from "react";
import { Badge, Button, Callout, ConfirmDialog, EmptyState, Panel, SectionHeader } from "@blocos/ui";
import { AtSign, Instagram, Link2, Plug, RefreshCw, Trash2, Webhook } from "lucide-react";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { socialAccountsRecipe } from "./social-accounts.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type SocialAccountStatus = "active" | "reauth";

export interface SocialAccount {
  id: string;
  /** Sem o "@". */
  username: string;
  /** "Comercial", "Criador de conteudo"... */
  accountType?: string | null;
  /** `reauth` = a Meta recusou o login: precisa reconectar. */
  status: SocialAccountStatus;
  /** Dias ate o login vencer. `null` = sem prazo (token de usuario do sistema). */
  tokenDaysLeft: number | null;
  /** Webhooks de comentario e direct assinados para a conta. */
  webhooksSubscribed: boolean;
}

export interface SocialAccountsData {
  accounts: SocialAccount[];
  /** URLs para o passo a passo do painel da Meta. Ausente = passo a passo escondido. */
  setup?: { callbackUrl: string | null; webhookUrl: string | null };
}

export type SocialAccountsVariant = "cards" | "grid";

/** Acima disso o login e tratado como "sem prazo" (token sem validade). */
const NO_EXPIRY_DAYS = 3650;

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialAccounts(props: BlockProps<SocialAccountsData, SocialAccountsVariant>) {
  const { data, onAction, variant = "cards", state = "success", connectors, onRequestConnector, className } = props;
  const [removing, setRemoving] = React.useState<SocialAccount | null>(null);

  const connect = () => void onAction?.("social.connect", {});

  return (
    <BlockFrame
      recipe={socialAccountsRecipe}
      onAction={onAction}
      requires={[]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
    >
      <div className="flex flex-col gap-5">
        {data.accounts.length === 0 ? (
          <EmptyState
            icon={<Instagram className="h-5 w-5" aria-hidden />}
            title="Nenhuma conta conectada"
            description="A conta precisa ser Comercial ou Criador de conteúdo e, enquanto o app da Meta estiver em desenvolvimento, estar adicionada como testadora."
            action={
              <Button icon={<Plug className="h-4 w-4" aria-hidden />} onClick={connect}>
                Conectar conta do Instagram
              </Button>
            }
          />
        ) : (
          <div className={variant === "grid" ? "@container" : undefined}>
            <ul
              className={
                variant === "grid"
                  ? "grid grid-cols-1 gap-3 @[560px]:grid-cols-2 @[880px]:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {data.accounts.map((account) => (
                <li key={account.id}>
                  <AccountCard
                    account={account}
                    compact={variant === "grid"}
                    onAction={onAction}
                    onRemove={() => setRemoving(account)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.setup ? <MetaSetup callbackUrl={data.setup.callbackUrl} webhookUrl={data.setup.webhookUrl} /> : null}
      </div>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => (open ? null : setRemoving(null))}
        title={removing ? `Remover @${removing.username}?` : "Remover conta"}
        description="Os posts, as automações e os arquivos dessa conta também saem. Para voltar, conecte de novo."
        confirmLabel="Remover conta"
        onConfirm={() => {
          if (removing) void onAction?.("social.remove", { accountId: removing.id });
          setRemoving(null);
        }}
      />
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Cartao da conta                                                     */
/* ------------------------------------------------------------------ */

function loginText(account: SocialAccount): string {
  if (account.status !== "active") return "Precisa reconectar";
  if (account.tokenDaysLeft === null || account.tokenDaysLeft > NO_EXPIRY_DAYS) return "Login sem prazo de validade";
  return `Login vence em ${Math.max(account.tokenDaysLeft, 0)} dias (reconecte antes)`;
}

function AccountCard({
  account,
  compact,
  onAction,
  onRemove,
}: {
  account: SocialAccount;
  compact: boolean;
  onAction?: BlockProps<SocialAccountsData>["onAction"];
  onRemove: () => void;
}) {
  const handle = `@${account.username}`;
  const needsReauth = account.status !== "active";
  const expiring =
    !needsReauth && account.tokenDaysLeft !== null && account.tokenDaysLeft <= 7 && account.tokenDaysLeft <= NO_EXPIRY_DAYS;

  return (
    <Panel tone="solid" padding="md" className="flex h-full flex-col gap-3">
      <div className={compact ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"}>
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
            <AtSign className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="bloco-headline inline-block max-w-full truncate" title={handle}>
              {handle}
            </p>
            <p className="bloco-caption text-fg-muted">{account.accountType || "Conta profissional"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {needsReauth ? (
            <Badge tone="danger">Reconectar</Badge>
          ) : expiring ? (
            <Badge tone="warn">Login vencendo</Badge>
          ) : (
            <Badge tone="success">Ativa</Badge>
          )}
          <Badge tone={account.webhooksSubscribed ? "info" : "outline"}>
            {account.webhooksSubscribed ? "Webhooks ativos" : "Webhooks desligados"}
          </Badge>
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        <li className="bloco-callout text-fg-secondary">{loginText(account)}</li>
        {!account.webhooksSubscribed ? (
          <li className="bloco-callout text-fg-secondary">As automações não recebem comentários enquanto os webhooks estiverem desligados.</li>
        ) : null}
      </ul>

      {needsReauth ? (
        <div role="alert">
          <Callout tone="danger">A Meta recusou o login desta conta. Clique em Reconectar.</Callout>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {needsReauth ? (
          <Button
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => void onAction?.("social.connect", { accountId: account.id })}
            aria-label={`Reconectar ${handle}`}
          >
            Reconectar
          </Button>
        ) : null}
        {!needsReauth && !account.webhooksSubscribed ? (
          <Button
            size="sm"
            variant="secondary"
            icon={<Webhook className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => void onAction?.("social.subscribe", { accountId: account.id })}
            aria-label={`Ativar webhooks de ${handle}`}
          >
            Ativar webhooks
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="danger-ghost"
          icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
          onClick={onRemove}
          aria-label={`Remover ${handle}`}
        >
          Remover
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Passo a passo da Meta                                               */
/* ------------------------------------------------------------------ */

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bloco-mono rounded-[var(--r-sm)] bg-surface-active px-1.5 py-0.5 break-all text-fg">{children}</code>;
}

function MetaSetup({ callbackUrl, webhookUrl }: { callbackUrl: string | null; webhookUrl: string | null }) {
  const missing = "defina APP_URL primeiro";
  return (
    <Panel tone="outline" padding="md">
      <details className="group">
        <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 rounded-[var(--r-sm)] bloco-headline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <Link2 className="h-4 w-4 text-fg-muted" aria-hidden />
          Configuração no painel da Meta
          <span className="bloco-caption ml-auto text-fg-muted group-open:hidden">mostrar</span>
          <span className="bloco-caption ml-auto hidden text-fg-muted group-open:inline">esconder</span>
        </summary>
        <div className="mt-4">
          <SectionHeader
            title="Passo a passo"
            description="Feito uma vez por app. Contas novas só precisam do botão Conectar."
          />
          <ol className="mt-3 flex list-decimal flex-col gap-2.5 pl-5 bloco-callout text-fg-secondary">
            <li>
              Em developers.facebook.com, crie um app com o caso de uso <strong className="text-fg">Administrar mensagens e conteúdo no Instagram</strong>. Apps novos usam o login unificado.
            </li>
            <li>
              Na configuração da API com login unificado, registre a URL de redirecionamento: <Code>{callbackUrl ?? missing}</Code>
            </li>
            <li>
              Copie o Identificador de configuração para <Code>INSTAGRAM_LOGIN_CONFIG_ID</Code>, o ID do app para <Code>INSTAGRAM_APP_ID</Code> e a chave secreta do app (Configurações &gt; Básico) para <Code>INSTAGRAM_APP_SECRET</Code>.
            </li>
            <li>
              Se o login não trouxer nenhuma conta, adicione o produto Facebook Login for Business e inclua <Code>business_management</Code> na configuração de login.
            </li>
            <li>
              Em Webhooks (objeto Instagram), use a URL <Code>{webhookUrl ?? missing}</Code> e o mesmo token da variável <Code>INSTAGRAM_WEBHOOK_VERIFY_TOKEN</Code>. Ative <Code>comments</Code> e <Code>messages</Code>.
            </li>
            <li>
              Em modo de desenvolvimento, só contas com papel no app (testadoras) funcionam. Para contas de clientes, o app precisa de App Review e do modo <strong className="text-fg">Live</strong>.
            </li>
          </ol>
        </div>
      </details>
    </Panel>
  );
}
