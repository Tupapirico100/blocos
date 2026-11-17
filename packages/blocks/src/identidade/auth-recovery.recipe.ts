import { defineBlock } from "@blocos/core";

/**
 * auth-recovery — recuperacao de senha e definicao de nova senha.
 *
 * Cobre o pedido do link (modo `request`) e o formulario de definicao com
 * medidor de forca (modo `set-password`).
 */
export const authRecoveryRecipe = defineBlock({
  id: "auth-recovery",
  name: "Recuperação de senha",
  domain: "identidade",
  summary: "Pedido de link de recuperacao e definicao de nova senha com medidor de forca.",
  origins: ["CRM-Nutricionista: src/app/[locale]/esqueci-senha/page.tsx"],
  ports: [
    {
      id: "recoveryRepository",
      label: "Repositorio de recuperacao",
      contract: "Links de uso unico, expiracao e estado da redefinicao de senha.",
      methods: [
        "createToken(userId): { tokenHash: string; expiresAt: string }",
        "consumeToken(tokenHash): { userId: string } | null",
        "updatePassword(userId, passwordHash): void",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "passwordPolicy",
      label: "Politica de senha",
      contract: "Regras minimas de senha e calculo de forca exibido no formulario.",
      methods: [
        "getPolicy(): { minLength: number; requireUpper: boolean; requireNumber: boolean; requireSymbol: boolean }",
        "score(password): { score: number; checks: { id: string; met: boolean }[] }",
      ],
      connectors: [],
      mockable: true,
    },
    {
      id: "mailer",
      label: "Envio de e-mail",
      contract: "Envia o link de recuperacao com expiracao e uso unico.",
      methods: ["sendRecoveryLink(email, link, expiresAt): void"],
      connectors: ["email"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "auth.recovery.request",
      title: "Pedir link de recuperacao",
      description:
        "Use quando o usuario pedir para redefinir a senha. Gera um token de uso unico, envia o link por e-mail e responde de forma identica para e-mails existentes e inexistentes.",
      http: { method: "POST", path: "/auth/recovery" },
      permissions: ["owner", "employee"],
      connectors: ["database", "email"],
      states: ["success", "error"],
    },
    {
      id: "auth.password.set",
      title: "Definir nova senha",
      description:
        "Use quando o usuario confirmar a nova senha no formulario de recuperacao. Valida a politica de senha e consome o token — o token vem da sessao do servidor, nunca do cliente.",
      http: { method: "POST", path: "/auth/password" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "auth.recovery.resend",
      title: "Reenviar link de recuperacao",
      description:
        "Use quando o usuario pedir um novo link sem esperar o primeiro. Invalida o token anterior e emite um novo.",
      http: { method: "POST", path: "/auth/recovery/resend" },
      permissions: ["owner", "employee"],
      connectors: ["database", "email"],
      states: ["success", "error"],
    },
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa: tokens de recuperacao e credenciais.",
      ownerOnly: true,
    },
    {
      id: "email",
      label: "E-mail transacional",
      kind: "api",
      description: "Envio do link de recuperacao de senha.",
      env: ["EMAIL_PROVIDER", "EMAIL_FROM"],
      ownerOnly: true,
    },
  ],
  rules: [
    "A resposta de recuperacao e a mesma para e-mail existente e inexistente: nao revela quem tem cadastro.",
    "O link de recuperacao tem expiracao curta, vale uma unica vez e invalida o token anterior.",
    "Senha e token de recuperacao nunca aparecem em log, URL ou telemetria.",
    "A nova senha precisa respeitar a politica do programa (tamanho minimo, maiuscula, numero).",
    "Redefinir a senha nao remove o segundo fator ja ativo nem amplia permissoes.",
    "Regra 11: a lista de permitidos e reavaliada no proximo login.",
    "Nenhum dado de saude (consulta, medida, plano alimentar) trafega por este fluxo.",
  ],
  variants: [
    {
      id: "form",
      label: "Formulário",
      intent: "Um formulario por vez, direto ao ponto",
      tradeoff: "Perde o contexto de segurança da marca",
    },
    {
      id: "steps",
      label: "Passos",
      intent: "Pedir link -> confirmar envio -> definir senha, com indicador de etapa",
      tradeoff: "Exige mais rolagem e cliques para voltar um passo",
    },
    {
      id: "split",
      label: "Dividida",
      intent: "Explicacao a esquerda e formulario a direita, com contexto de seguranca",
      tradeoff: "Ocupa duas colunas; em telas estreitas vira uma coluna so",
    },
  ],
  states: ["idle", "loading", "success", "empty", "error", "forbidden"],
  sensitive: true,
});

export default authRecoveryRecipe;
