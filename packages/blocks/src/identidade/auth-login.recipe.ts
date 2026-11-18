import { defineBlock } from "@blocos/core";

/**
 * auth-login — tela de entrada no programa.
 *
 * Cobre o passo de credenciais e o desafio de 2FA (`data.step === "2fa"`).
 * A tela nunca busca: recebe `data` resolvido e devolve intencao por `onAction`.
 */
export const authLoginRecipe = defineBlock({
  id: "auth-login",
  name: "Login",
  domain: "identidade",
  summary: "Entrada por e-mail e senha (ou so senha, em painel de um operador), com desafio de segundo fator em 6 digitos.",
  origins: ["CRM-Nutricionista: src/app/[locale]/login/page.tsx", "Agendador-Instagram: src/app/login/page.tsx"],
  ports: [
    {
      id: "identityRepository",
      label: "Repositorio de identidade",
      contract: "Usuarios do programa, status do segundo fator e desafios pendentes.",
      methods: [
        "findByEmail(email): User | null",
        "getFactorStatus(userId): { enabled: boolean; method: 'totp' | 'sms' | 'email' }",
        "createChallenge(userId, method): { challengeId: string; destinationMasked: string; expiresAt: string }",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "sessionService",
      label: "Servico de sessao",
      contract: "Valida credenciais, emite cookie de sessao e devolve o consultorio ativo.",
      methods: [
        "signIn(email, password): { userId: string; officeId: string; roles: string[] }",
        "verifySecondFactor(challengeId, code): { sessionId: string }",
        "signOut(sessionId): void",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "auth.login",
      title: "Entrar",
      description:
        "Use quando o usuario enviar e-mail e senha (ou so a senha, com data.passwordOnly) no formulario de login. Valida as credenciais, cria a sessao e responde com o consultorio ativo. Se o segundo fator estiver ativo, devolva o desafio em vez de criar a sessao.",
      http: { method: "POST", path: "/auth/login" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "auth.twoFactor.verify",
      title: "Verificar codigo de 2FA",
      description:
        "Use quando o usuario informar o codigo de 6 digitos do segundo fator. Consome o desafio pendente e conclui o login; codigo invalido devolve erro sem revelar se o fator existe.",
      http: { method: "POST", path: "/auth/two-factor/verify" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "auth.twoFactor.resend",
      title: "Reenviar codigo de 2FA",
      description:
        "Use quando o usuario pedir um novo codigo do segundo fator. Gera um desafio novo e invalida o anterior.",
      http: { method: "POST", path: "/auth/two-factor/resend" },
      permissions: ["owner", "employee"],
      connectors: ["database", "email"],
      states: ["success", "error"],
    },
    {
      id: "auth.twoFactor.cancel",
      title: "Cancelar desafio de 2FA",
      description:
        "Use quando o usuario voltar para a etapa de credenciais a partir do desafio de 2FA. Descarta o desafio pendente.",
      http: { method: "POST", path: "/auth/two-factor/cancel" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "auth.recovery.request",
      title: "Pedir link de recuperacao",
      description:
        "Use quando o usuario clicar em 'Esqueci minha senha'. Envia um link de uso unico por e-mail, sempre com a mesma resposta para e-mails existentes e inexistentes.",
      http: { method: "POST", path: "/auth/recovery" },
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
      description: "Postgres do programa: usuarios, fatores e desafios de 2FA.",
      ownerOnly: true,
    },
    {
      id: "email",
      label: "E-mail transacional",
      kind: "api",
      description: "Envio dos links de recuperacao de senha e dos avisos de 2FA.",
      env: ["EMAIL_PROVIDER", "EMAIL_FROM"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Regra 11: so respondemos quem esta na lista de permitidos — quem nao autenticou nao recebe nada do consultorio.",
    "A resposta de recuperacao de senha e a mesma para e-mail existente e inexistente: nao revela quem tem cadastro.",
    "Senha, codigo de 2FA e token de sessao nunca aparecem em log, URL ou telemetria.",
    "Desafio de 2FA tem validade curta e uso unico; um codigo verificado nao pode ser reaproveitado.",
    "Nenhum dado de saude (consulta, medida, plano alimentar) trafega pela tela de login.",
    "Com data.passwordOnly o payload de auth.login leva so { password }; o servidor aplica limite de tentativas por IP.",
  ],
  defaultVariant: "centered",
  variants: [
    {
      id: "split",
      label: "Dividida",
      intent: "Tela de entrada de marca, com metade marca e metade formulario",
      tradeoff: "Ocupa meia viewport; some o contexto da marca em telas pequenas",
    },
    {
      id: "centered",
      label: "Centralizada",
      intent: "Cartao unico flutuante, sem painel de marca ao lado",
      tradeoff: "Perde o espaco de comunicacao da marca",
    },
    {
      id: "minimal",
      label: "Minima",
      intent: "Apenas os campos, para embutir em outra tela ou modal",
      tradeoff: "Nao carrega marca, cabecalho ou link de suporte",
    },
  ],
  states: ["idle", "loading", "success", "empty", "error", "forbidden"],
  sensitive: true,
});

export default authLoginRecipe;
