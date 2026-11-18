import { defineBlock } from "@blocos/core";

/**
 * auth-two-factor — painel de segundo fator do usuario.
 *
 * Mostra o fator TOTP (QR ilustrativo + chave), os codigos de recuperacao e a
 * remocao do fator. Nenhum segredo trafega em log, URL ou telemetria.
 */
export const authTwoFactorRecipe = defineBlock({
  id: "auth-two-factor",
  name: "Verificação em duas etapas",
  domain: "identidade",
  summary: "Painel do segundo fator TOTP, codigos de recuperacao e remocao do fator.",
  origins: ["CRM-Nutricionista: src/app/[locale]/seguranca/2fa/MfaPanel.tsx"],
  ports: [
    {
      id: "twoFactorRepository",
      label: "Repositorio de fatores",
      contract: "Fatores de segundo fator e codigos de recuperacao do usuario.",
      methods: [
        "listFactors(userId): TwoFactorFactor[]",
        "getFactor(userId): TwoFactorFactor | null",
        "removeFactor(userId, factorId): void",
        "regenerateRecoveryCodes(userId): RecoveryCode[]",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "challengeService",
      label: "Servico de desafio",
      contract: "Valida o codigo TOTP informado e marca o desafio como consumido.",
      methods: [
        "verify(userId, code): { ok: boolean; challengeId: string }",
        "pending(userId): { challengeId: string; expiresAt: string } | null",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "auth.twoFactor.verify",
      title: "Verificar codigo do segundo fator",
      description:
        "Use quando o usuario confirmar o codigo de 6 digitos do autenticador. Valida o codigo TOTP, consome o desafio pendente e, em caso de sucesso, ativa o segundo fator.",
      http: { method: "POST", path: "/auth/two-factor/verify" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "auth.twoFactor.remove",
      title: "Remover fator de segundo fator",
      description:
        "Use quando o usuario clicar em 'Remover fator'. Exclui o fator e os codigos de recuperacao; o login passa a exigir apenas e-mail e senha.",
      http: { method: "DELETE", path: "/auth/two-factor" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "auth.twoFactor.copySecret",
      title: "Copiar chave de configuracao",
      description:
        "Use quando o usuario pedir para copiar a chave TOTP exibida no painel. A chave vai para a area de transferencia do proprio navegador — nunca para log ou telemetria.",
      permissions: ["owner", "employee"],
      connectors: [],
      states: ["success", "error"],
    },
    {
      id: "auth.twoFactor.copyRecoveryCodes",
      title: "Copiar codigos de recuperacao",
      description:
        "Use quando o usuario pedir para copiar os codigos de recuperacao ainda nao usados. Cada codigo funciona uma unica vez.",
      permissions: ["owner", "employee"],
      connectors: [],
      states: ["success", "error"],
    },
    {
      id: "auth.twoFactor.regenerateRecoveryCodes",
      title: "Gerar novos codigos de recuperacao",
      description:
        "Use quando o usuario pedir novos codigos de recuperacao. Invalida todos os codigos anteriores antes de emitir a nova lista.",
      http: { method: "POST", path: "/auth/two-factor/recovery-codes" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error"],
    },
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa: fatores TOTP e codigos de recuperacao.",
      ownerOnly: true,
    },
    {
      id: "email",
      label: "E-mail transacional",
      kind: "api",
      description: "Avisos de seguranca (fator adicionado, fator removido, codigos regenerados).",
      env: ["EMAIL_PROVIDER", "EMAIL_FROM"],
      ownerOnly: true,
    },
  ],
  rules: [
    "O segredo TOTP e os codigos de recuperacao nunca aparecem em log, URL ou telemetria.",
    "Cada codigo de recuperacao vale uma unica vez; gerar uma nova lista invalida a anterior.",
    "Remover o segundo fator e uma operacao sensivel: o usuario e avisado por e-mail.",
    "O segundo fator do dono da plataforma nao pode ser removido por terceiros.",
    "Regra 11: a lista de permitidos e reavaliada a cada login — remover o fator nao amplia permissao.",
    "Nenhum dado de saude (consulta, medida, plano alimentar) e exibido neste painel.",
  ],
  defaultVariant: "cards",
  variants: [
    {
      id: "cards",
      label: "Cartões",
      intent: "Fator e codigos de recuperacao lado a lado, com leitura de dois blocos",
      tradeoff: "Em telas estreitas os dois cartoes empilham e a rolagem fica longa",
    },
    {
      id: "inline",
      label: "Coluna",
      intent: "Tudo em uma coluna unica, para painel lateral ou drawer",
      tradeoff: "Exige mais rolagem para ir do fator aos codigos de recuperacao",
    },
    {
      id: "steps",
      label: "Passos",
      intent: "Fluxo guiado: verificar -> desafio -> confirmar",
      tradeoff: "Esconde as opcoes; exige mais cliques para voltar a um cartao anterior",
    },
  ],
  states: ["idle", "loading", "success", "empty", "error", "forbidden"],
  sensitive: true,
});

export default authTwoFactorRecipe;
