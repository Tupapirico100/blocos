import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * social-accounts — contas do Instagram conectadas.
 *
 * Extraido de `Agendador-Instagram: src/app/(app)/accounts/page.tsx`.
 * Nao trava sem o conector: esta e justamente a tela que conecta a primeira conta.
 */

export const socialConnectInput = z.object({
  /** Conta a reconectar. Ausente = iniciar um novo fluxo de conexao. */
  accountId: z.string().optional(),
});

export const socialAccountInput = z.object({
  accountId: z.string().uuid("Conta invalida."),
});

export const socialAccountsRecipe = defineBlock({
  id: "social-accounts",
  name: "Contas do Instagram",
  domain: "social",
  summary:
    "Contas profissionais do Instagram conectadas pelo login da Meta, com validade do login, webhooks e o passo a passo do painel da Meta.",
  origins: ["Agendador-Instagram: src/app/(app)/accounts/page.tsx", "Agendador-Instagram: src/app/(app)/accounts/actions.ts"],
  ports: [
    {
      id: "instagramAccounts",
      label: "Contas do Instagram",
      contract:
        "Lista as contas conectadas com status, validade do login e webhooks. Nunca devolve o token: ele fica cifrado no banco.",
      methods: ["list(): SocialAccount[]", "subscribeWebhooks(accountId): void", "remove(accountId): void"],
      connectors: ["instagram", "database", "storage"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "social.connect",
      title: "Conectar conta do Instagram",
      description:
        "Use quando o usuario pedir para conectar ou reconectar uma conta. Leva ao login unificado da Meta (GET /api/instagram/connect); a volta cria ou atualiza a conta.",
      input: socialConnectInput,
      http: { method: "GET", path: "/api/instagram/connect" },
      permissions: ["owner"],
      connectors: ["instagram"],
      states: ["success", "error"],
    },
    {
      id: "social.subscribe",
      title: "Ativar webhooks",
      description:
        "Use quando os webhooks de uma conta estiverem desligados. Assina comments e messages (POST /{ig}/subscribed_apps) para as automacoes receberem os eventos.",
      input: socialAccountInput,
      http: { method: "POST", path: "/accounts/:accountId/subscribe" },
      permissions: ["owner"],
      connectors: ["instagram"],
      states: ["success", "error"],
    },
    {
      id: "social.remove",
      title: "Remover conta",
      description:
        "Use quando o usuario confirmar a remocao de uma conta. Apaga os arquivos da conta no storage; posts, automacoes e registros saem em cascata.",
      input: socialAccountInput,
      http: { method: "DELETE", path: "/accounts/:accountId" },
      permissions: ["owner"],
      connectors: ["database", "storage"],
      states: ["success", "error"],
    },
  ],
  connectors: [
    {
      id: "instagram",
      label: "Instagram Graph API",
      kind: "api",
      description: "Login unificado da Meta (Facebook Login for Business com config_id) em graph.facebook.com.",
      env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET", "INSTAGRAM_LOGIN_CONFIG_ID"],
      howTo:
        "Crie o app na Meta com o caso de uso de mensagens e conteudo no Instagram, registre o redirect /api/instagram/callback e preencha as variaveis.",
      ownerOnly: true,
    },
    { id: "database", label: "Banco de dados", kind: "database", description: "Postgres (Supabase), so a service role.", ownerOnly: true },
    { id: "storage", label: "Storage", kind: "storage", description: "Bucket com as midias de cada conta.", ownerOnly: true },
  ],
  rules: [
    "Remover conta sempre passa por confirmacao: posts, automacoes e arquivos da conta saem junto.",
    "Token de usuario do sistema nao vence (tokenDaysLeft null); conta recusada pela Meta vira `reauth` e pede Reconectar.",
    "Webhooks desligados = automacoes sem comentarios: a tela diz isso em texto, nao so em cor.",
    "Nenhum token ou segredo aparece na tela, no log ou na URL.",
  ],
  emptyAction: { id: "social.connect", label: "Conectar conta do Instagram" },
  defaultVariant: "cards",
  variants: [
    {
      id: "cards",
      label: "Cartoes",
      intent: "Uma conta por linha, com status e acoes a direita",
      tradeoff: "Ocupa mais altura com muitas contas",
    },
    {
      id: "grid",
      label: "Grade",
      intent: "Varrer muitas contas de clientes de uma vez",
      tradeoff: "Cada cartao fica mais estreito",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
  sensitive: true,
});
