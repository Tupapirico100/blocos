import { defineBlock } from "@blocos/core";

/**
 * office-settings — configuracao do consultorio.
 *
 * Canais conectados, provedor de WhatsApp em uso (com aceite de risco do
 * provedor nao-oficial), horario de atendimento e webhook de saida.
 * Conectores de WhatsApp e webhooks sao owner-only: so o dono do programa
 * provisiona.
 */
export const officeSettingsRecipe = defineBlock({
  id: "office-settings",
  name: "Configurações do consultório",
  domain: "administracao",
  summary:
    "Canais conectados, provedor de WhatsApp com aceite de risco, horário de atendimento e webhook de saída.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/consultorios/[officeId]/webhook/WebhookPanel.tsx",
    "CRM-Nutricionista: src/app/[locale]/admin/consultorios/[officeId]/AdminOfficePanel.tsx",
  ],
  ports: [
    {
      id: "channelService",
      label: "Servico de canais",
      contract: "Canais do consultorio e o provedor de WhatsApp em uso.",
      methods: [
        "list(officeId): Channel[]",
        "connect(officeId, channel): Channel",
        "disconnect(officeId, channel): void",
        "whatsappProvider(officeId): { provider: string; official: boolean }",
      ],
      connectors: ["database", "whatsapp"],
      mockable: true,
    },
    {
      id: "riskRegistry",
      label: "Registro de aceite de risco",
      contract: "Versao vigente do texto de risco e aceite registrado do dono.",
      methods: [
        "currentVersion(provider): string",
        "getAcceptance(officeId): { version: string; acceptedBy: string; acceptedAt: string } | null",
        "accept(officeId, version, acceptedBy): { version: string; acceptedBy: string; acceptedAt: string }",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "scheduleService",
      label: "Servico de horario",
      contract: "Janela de atendimento por dia da semana, no fuso America/Sao_Paulo.",
      methods: [
        "get(officeId): { timezone: string; hours: ScheduleDay[] }",
        "save(officeId, hours): { timezone: string; hours: ScheduleDay[] }",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "webhookDispatcher",
      label: "Despachante de webhooks",
      contract: "Entrega eventos de saida para a URL configurada, com segredo por referencia.",
      methods: [
        "get(officeId): { url: string; active: boolean; secretRef: string } | null",
        "save(officeId, input): { url: string; active: boolean; secretRef: string }",
        "test(officeId, url): { ok: boolean; status: number }",
      ],
      connectors: ["database", "webhooks"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "office.settings.channel.connect",
      title: "Conectar canal",
      description:
        "Use quando o usuario clicar em 'Conectar' num canal. Abre o fluxo de conexao do provedor — no WhatsApp oficial o cadastro do numero e feito pela Meta.",
      http: { method: "POST", path: "/offices/:officeId/channels/:channel/connect" },
      permissions: ["owner", "platform_admin"],
      connectors: ["database", "whatsapp"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "office.settings.channel.disconnect",
      title: "Desconectar canal",
      description:
        "Use quando o usuario clicar em 'Desconectar' num canal conectado. Interrompe o atendimento naquele canal e mantem o historico.",
      http: { method: "POST", path: "/offices/:officeId/channels/:channel/disconnect" },
      permissions: ["owner", "platform_admin"],
      connectors: ["database", "whatsapp"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "office.settings.risk.accept",
      title: "Aceitar risco do provedor não oficial",
      description:
        "Use quando o usuario clicar em 'Aceitar o risco'. Registra o aceite com a versao vigente do texto de risco, quem aceitou e quando — o registro guarda o snapshot do texto aceito.",
      http: { method: "POST", path: "/offices/:officeId/risk-acceptance" },
      permissions: ["owner", "platform_admin"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "office.settings.schedule.save",
      title: "Salvar horário de atendimento",
      description:
        "Use quando o usuario clicar em 'Salvar horario'. Grava a janela diaria de atendimento no fuso America/Sao_Paulo — a conversao local/UTC faz duas passadas por causa do horario de verao.",
      http: { method: "PUT", path: "/offices/:officeId/schedule" },
      permissions: ["owner", "receptionist"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "office.settings.webhook.save",
      title: "Salvar webhook de saída",
      description:
        "Use quando o usuario clicar em 'Salvar webhook'. Valida a URL (HTTPS com IP publico, guarda de SSRF) e guarda o segredo apenas por referencia (`secretRef` = nome da variavel de ambiente).",
      http: { method: "PUT", path: "/offices/:officeId/webhook" },
      permissions: ["owner"],
      connectors: ["database", "webhooks"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "office.settings.webhook.test",
      title: "Enviar teste de webhook",
      description:
        "Use quando o usuario clicar em 'Enviar teste'. Dispara um evento de teste na URL configurada e devolve o status da entrega.",
      http: { method: "POST", path: "/offices/:officeId/webhook/test" },
      permissions: ["owner"],
      connectors: ["database", "webhooks"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa: canais, horarios, riscos aceitos e webhooks.",
      ownerOnly: true,
    },
    {
      id: "whatsapp",
      label: "WhatsApp (Cloud API)",
      kind: "whatsapp",
      description: "Conexao do numero do consultorio com a Meta (ou provedor intermediario autorizado).",
      env: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
      ownerOnly: true,
    },
    {
      id: "webhooks",
      label: "Webhooks de saída",
      kind: "webhook",
      description: "Entrega de eventos do consultorio para sistemas externos.",
      env: ["WEBHOOK_SECRET_REF"],
      ownerOnly: true,
    },
  ],
  rules: [
    "O provedor de WhatsApp nao-oficial so entra em operacao depois que o dono aceita o texto de risco vigente.",
    "O aceite de risco guarda a versao do texto, quem aceitou e quando — nada de edicao silenciosa do texto.",
    "O segredo do webhook e guardado por referencia (`secretRef` = nome da variavel de ambiente) e nunca e devolvido a interface.",
    "Webhook de saida exige HTTPS e IP publico (guard de SSRF); enderecos internos e privados sao bloqueados.",
    "Retry do webhook: 1m -> 5m -> 15m -> 1h -> 6h -> 24h.",
    "O horario de atendimento e sempre America/Sao_Paulo; a conversao local/UTC faz DUAS passadas por causa do DST.",
    "A janela de 24h vale para mensagem livre; fora dela, so template aprovado.",
    "Nenhum dado de saude (consulta, medida, plano alimentar) trafega no payload do webhook.",
  ],
  variants: [
    {
      id: "sections",
      label: "Seções",
      intent: "Tudo empilhado em secoes, do canal ao webhook",
      tradeoff: "Pagina longa: e preciso rolar para achar o webhook",
    },
    {
      id: "tabs",
      label: "Abas",
      intent: "Uma aba por assunto, com foco no que esta em uso",
      tradeoff: "Esconde os demais assuntos e complica a comparacao",
    },
    {
      id: "cards",
      label: "Cartões",
      intent: "Um cartao por assunto, lado a lado em telas largas",
      tradeoff: "Cartoes lado a lado ficam estreitos e quebram o layout em telas pequenas",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});

export default officeSettingsRecipe;
