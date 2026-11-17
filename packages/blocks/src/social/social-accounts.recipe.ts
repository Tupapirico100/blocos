import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * social-accounts — contas do Instagram conectadas.
 *
 * Extraido de `Agendador-Instagram: src/app/(app)/accounts/page.tsx`.
 * O bloco e owner-only: `requires={["instagram"]}` no BlockFrame.
 */

export const socialConnectInput = z.object({
  /** Conta a reconectar. Ausente = iniciar um novo fluxo de conexao. */
  accountId: z.string().optional(),
  /** Login publico da conta quando a conexao ja vem autorizada. */
  instagramUserId: z.string().optional(),
});

export const socialAccountsRecipe = defineBlock({
  id: "social-accounts",
  name: "Contas do Instagram",
  domain: "social",
  summary:
    "Contas do Instagram conectadas, com status e expiracao do token de longa duracao e a ultima publicacao de cada conta.",
  origins: ["Agendador-Instagram: src/app/(app)/accounts/page.tsx"],
  ports: [
    {
      id: "instagramAccounts",
      label: "Contas do Instagram",
      contract:
        "Lista as contas conectadas com token, status e expiracao. Nunca devolve o valor do token — apenas a referencia (secretRef).",
      methods: [
        "list(officeId): SocialAccount[]",
        "connect(input): SocialAccount",
        "disconnect(accountId): void",
      ],
      connectors: ["instagram"],
      mockable: true,
    },
    {
      id: "instagramPosts",
      label: "Ultimas publicacoes",
      contract: "Ultima publicacao por conta, para contextualizar o estado do perfil.",
      methods: ["lastByAccount(accountId): SocialPostSummary | null"],
      connectors: ["instagram"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "social.connect",
      title: "Conectar conta do Instagram",
      description:
        "Use quando o usuario pedir para conectar, reconectar ou autorizar uma conta do Instagram. Sem `accountId` inicia um novo fluxo de autorizacao; com `accountId` refaz a autorizacao da conta existente.",
      input: socialConnectInput,
      http: { method: "POST", path: "/social/instagram/connect" },
      permissions: ["platform_owner"],
      connectors: ["instagram"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "instagram",
      label: "Instagram Graph API",
      kind: "api",
      description:
        "Contas do Instagram usadas para publicar. O dono da plataforma faz a autorizacao e guarda o token de longa duracao.",
      env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET", "INSTAGRAM_REDIRECT_URI"],
      howTo:
        "Registre o app na Meta, configure o redirect URI e autorize cada conta pelo fluxo OAuth. O token resultante fica no cofre; a interface so enxerga a referencia.",
      ownerOnly: true,
      riskVersion: "v1",
    },
  ],
  rules: [
    "Somente o dono da plataforma conecta contas: a interface pede acesso, nunca provisiona.",
    "O token de longa duracao do Instagram expira em cerca de 60 dias — a UI avisa antes da expiracao.",
    "Desconectar uma conta nao apaga o historico de publicacoes nem os logs.",
    "Nenhum token, secret ou valor de credencial aparece na tela, no log ou na URL — apenas `tokenRef`.",
    "Reconectar uma conta expirada nao cria uma conta duplicada: reaproveita o mesmo registro.",
  ],
  variants: [
    {
      id: "cards",
      label: "Cartoes",
      intent: "Ver conta, expiracao e ultima publicacao com folga",
      tradeoff: "Ocupa bastante altura; mostra menos contas por tela",
    },
    {
      id: "grid",
      label: "Grade",
      intent: "Varrer muitas contas de uma vez",
      tradeoff: "Cada conta perde o detalhe do ultimo post",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden", "not-provisioned"],
  sensitive: true,
});
