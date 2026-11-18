import * as React from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  EmptyState,
  KeyValue,
  Panel,
  SectionHeader,
} from "@blocos/ui";
import { CalendarClock, Instagram, KeyRound, Link2, Plus, ShieldCheck, TriangleAlert } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { daysUntilSocial, formatSocialDateTime } from "./format.js";
import { socialAccountsRecipe } from "./social-accounts.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

export type SocialTokenStatus = "valid" | "expiring" | "expired" | "revoked";

export interface SocialPostSummary {
  id: string;
  title: string;
  format: "post" | "carrossel" | "reels";
  publishedAt: string;
}

export interface SocialAccount {
  id: string;
  /** Handle publico da conta (ex.: @exemplo.clinica). */
  handle: string;
  displayName: string;
  avatarUrl?: string;
  /** Estado do token de longa duracao do Instagram. */
  tokenStatus: SocialTokenStatus;
  /** ISO — expiracao do token. */
  tokenExpiresAt: string;
  /** Nome da variavel de ambiente que guarda o token. NUNCA o token. */
  tokenRef: string;
  connectedAt: string;
  followers?: number;
  lastPost?: SocialPostSummary;
}

export interface SocialAccountsData {
  accounts: SocialAccount[];
}

export type SocialAccountsVariant = "cards" | "grid";

/* ------------------------------------------------------------------ */
/* Helpers de apresentacao                                             */
/* ------------------------------------------------------------------ */

const tokenLabel: Record<SocialTokenStatus, string> = {
  valid: "Token valido",
  expiring: "Expirando",
  expired: "Expirado",
  revoked: "Revogado",
};

const tokenTone: Record<SocialTokenStatus, "success" | "warn" | "danger"> = {
  valid: "success",
  expiring: "warn",
  expired: "danger",
  revoked: "danger",
};

const formatLabel: Record<SocialPostSummary["format"], string> = {
  post: "Post",
  carrossel: "Carrossel",
  reels: "Reels",
};

function expiryHint(account: SocialAccount): string {
  const days = daysUntilSocial(account.tokenExpiresAt);
  if (days === null) return "Expiracao desconhecida";
  if (days < 0) return `Expirou ha ${Math.abs(days)} dia(s)`;
  if (days === 0) return "Expira hoje";
  if (days === 1) return "Expira amanha";
  return `Expira em ${days} dias`;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                               */
/* ------------------------------------------------------------------ */

export function SocialAccounts(props: BlockProps<SocialAccountsData, SocialAccountsVariant>) {
  const { data, onAction, variant = "cards", state = "success", connectors = [], onRequestConnector, className } = props;

  const accounts = data.accounts;
  const hasAccounts = accounts.length > 0;

  return (
    <BlockFrame
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className={className}
      loading={
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bloco-skeleton h-40 w-full" />
          <div className="bloco-skeleton h-40 w-full" />
        </div>
      }
        recipe={socialAccountsRecipe}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Agendador-Instagram"
          title="Contas conectadas"
          description="Cada conta usa um token de longa duracao do Instagram Graph API. A tela nunca mostra o token — apenas a referencia da variavel de ambiente e a data de expiracao."
          actions={
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="h-4 w-4" aria-hidden />}
              onClick={() => onAction?.("social.connect", {})}
            >
              Conectar
            </Button>
          }
        />

        {!hasAccounts ? (
          <EmptyState
            icon={<Instagram className="h-5 w-5" aria-hidden />}
            title="Nenhuma conta conectada"
            description="Conecte uma conta do Instagram para publicar e automatizar respostas."
            action={
              /* O CTA principal da tela ja e o botao "Conectar" do cabecalho. */
              <Button
                variant="secondary"
                size="md"
                icon={<Link2 className="h-4 w-4" aria-hidden />}
                onClick={() => onAction?.("social.connect", {})}
              >
                Conectar conta
              </Button>
            }
          />
        ) : variant === "cards" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} onAction={onAction} />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {accounts.map((account) => (
              <AccountTile key={account.id} account={account} onAction={onAction} />
            ))}
          </div>
        )}

        <Callout
          tone="info"
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          title="Credencial por referencia"
        >
          A tela expoe apenas <span className="bloco-mono">tokenRef</span> (nome da variavel de ambiente). O valor do
          token vive no cofre do dono da plataforma e nunca trafega pela interface, por log ou por URL.
        </Callout>
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacoes                                                           */
/* ------------------------------------------------------------------ */

function AccountCard({
  account,
  onAction,
}: {
  account: SocialAccount;
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  const needsReconnect = account.tokenStatus === "expired" || account.tokenStatus === "revoked";

  return (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar name={account.displayName} src={account.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="bloco-headline truncate" title={account.displayName}>{account.displayName}</p>
          <p className="bloco-caption truncate" title={account.handle}>{account.handle}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tokenTone[account.tokenStatus]} icon={<KeyRound className="h-3 w-3" aria-hidden />}>
          {tokenLabel[account.tokenStatus]}
        </Badge>
        {needsReconnect ? (
          <span className="bloco-caption">Token expirado — reconecte a conta.</span>
        ) : null}
      </div>

      <KeyValue
        columns={2}
        items={[
          {
            /* O rotulo pode cair em coluna estreita: break-words evita que a
               palavra mais longa atravesse a borda da coluna. */
            label: <span className="break-words">Expiracao do token</span>,
            value: (
              <span className="flex min-w-0 flex-col break-words">
                <span className="break-words">{formatSocialDateTime(account.tokenExpiresAt)}</span>
                <span className="bloco-caption break-words">{expiryHint(account)}</span>
              </span>
            ),
          },
          {
            label: <span className="break-words">Ultima publicacao</span>,
            value: account.lastPost ? (
              <span className="flex min-w-0 flex-col break-words">
                <span className="truncate" title={account.lastPost.title}>
                  {account.lastPost.title}
                </span>
                <span className="bloco-caption break-words">
                  {formatLabel[account.lastPost.format]} · {formatSocialDateTime(account.lastPost.publishedAt)}
                </span>
              </span>
            ) : (
              <span className="bloco-caption break-words">Nenhuma publicacao ainda</span>
            ),
          },
        ]}
      />

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="bloco-micro truncate" title={account.tokenRef}>
          {account.tokenRef}
        </span>
        {needsReconnect ? (
          <Button
            size="sm"
            variant="secondary"
            icon={<Link2 className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => onAction?.("social.connect", { accountId: account.id })}
          >
            Reconectar
          </Button>
        ) : (
          <span className="bloco-caption min-w-0 truncate" title={`Conectada em ${formatSocialDateTime(account.connectedAt)}`}>
            Conectada em {formatSocialDateTime(account.connectedAt)}
          </span>
        )}
      </div>
    </Panel>
  );
}

function AccountTile({
  account,
  onAction,
}: {
  account: SocialAccount;
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
}) {
  const needsReconnect = account.tokenStatus === "expired" || account.tokenStatus === "revoked";

  return (
    <Panel tone="outline" padding="sm" className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Avatar name={account.displayName} src={account.avatarUrl} size={28} />
        <span className="bloco-callout min-w-0 flex-1 truncate font-medium text-fg" title={account.handle}>{account.handle}</span>
        <span
          aria-hidden
          className={
            account.tokenStatus === "valid"
              ? "h-2 w-2 rounded-full bg-success"
              : account.tokenStatus === "expiring"
                ? "h-2 w-2 rounded-full bg-warn"
                : "h-2 w-2 rounded-full bg-danger"
          }
        />
      </div>

      <span className="bloco-micro">
        {account.tokenStatus === "valid" ? "Token valido" : tokenLabel[account.tokenStatus]} · {expiryHint(account)}
      </span>

      <span className="bloco-caption truncate">
        <CalendarClock className="mr-1 inline h-3 w-3" aria-hidden />
        {account.lastPost ? `${formatLabel[account.lastPost.format]} · ${formatSocialDateTime(account.lastPost.publishedAt)}` : "Sem publicacoes"}
      </span>

      {needsReconnect ? (
        <Button
          size="sm"
          variant="secondary"
          icon={<TriangleAlert className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => onAction?.("social.connect", { accountId: account.id })}
        >
          Reconectar
        </Button>
      ) : null}
    </Panel>
  );
}
