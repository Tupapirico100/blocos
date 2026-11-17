import type { AgentConsoleData } from "./agent-console.js";
import type { IntegrationManifestData } from "./integration-manifest.js";
import type { OpsHealthData } from "./ops-health.js";
import type { WebhooksData } from "./webhooks-panel.js";

/**
 * Dados ficticios do dominio operacao.
 * Somente NOMES de variaveis de ambiente — nenhum valor de segredo.
 */

/* ------------------------------------------------------------------ */
/* webhooks-panel                                                       */
/* ------------------------------------------------------------------ */

export const webhooksMock: WebhooksData = {
  backoffSchedule: ["1m", "5m", "15m", "1h", "6h", "24h"],
  webhooks: [
    {
      id: "wh_01",
      url: "https://hooks.exemplo.com/consultorio/eventos",
      events: ["lead.created", "appointment.scheduled", "payment.confirmed"],
      secretRef: "WEBHOOK_SIGNING_SECRET_EXEMPLO",
      active: true,
      guard: { https: true, publicIp: true, checkedAt: "2026-03-05T12:00:00.000Z" },
      delivery: {
        attempts: 1,
        lastStatus: "ok",
        lastAttemptAt: "2026-03-05T11:58:00.000Z",
        httpStatus: 200,
      },
      backoffStep: 0,
    },
    {
      id: "wh_02",
      url: "https://erp.exemplo.com/webhook/atendimentos",
      events: ["appointment.scheduled", "attendance.recorded"],
      secretRef: "WEBHOOK_SIGNING_SECRET_ERP",
      active: true,
      guard: { https: true, publicIp: true, checkedAt: "2026-03-05T12:00:00.000Z" },
      delivery: {
        attempts: 4,
        lastStatus: "failed",
        lastAttemptAt: "2026-03-05T10:42:00.000Z",
        nextAttemptAt: "2026-03-05T16:42:00.000Z",
        httpStatus: 503,
        lastError: "O destino respondeu HTTP 503. Nova tentativa agendada pelo backoff.",
      },
      backoffStep: 3,
    },
    {
      id: "wh_03",
      url: "https://relatorio.exemplo.com/api/entradas",
      events: ["payment.confirmed"],
      secretRef: "WEBHOOK_SIGNING_SECRET_RELATORIO",
      active: false,
      guard: { https: true, publicIp: true, checkedAt: "2026-02-28T09:00:00.000Z" },
      delivery: {
        attempts: 0,
        lastStatus: "pending",
      },
      backoffStep: 0,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* agent-console                                                        */
/* ------------------------------------------------------------------ */

export const agentConsoleMock: AgentConsoleData = {
  agent: {
    enabled: true,
    status: "ativo",
    model: "claude-sonnet-4",
    promptVersion: 7,
    prompt:
      "Voce e o assistente do consultorio. Responda em portugues do Brasil, com tom corda e curto. " +
      "Consulte a agenda antes de oferecer horario. Nao invente informacao medica: se nao souber, pergunte. " +
      "Nao registre dado de saude fora do que a pessoa disser sobre a consulta.",
    lastRunAt: "2026-03-05T12:31:00.000Z",
    tools: [
      {
        id: "buscar_agenda",
        label: "Buscar agenda",
        description: "Consulta os horarios livres do profissional no dia pedido.",
        allowed: true,
      },
      {
        id: "oferecer_slots",
        label: "Oferecer slots",
        description: "Propoe ate tres horarios livres, respeitando folga e bloqueio.",
        allowed: true,
      },
      {
        id: "registrar_atendimento",
        label: "Registrar atendimento",
        description: "Grava o atendimento na agenda do consultorio.",
        allowed: true,
      },
      {
        id: "consultar_lead",
        label: "Consultar lead",
        description: "Le a etapa atual do lead e a origem do primeiro toque.",
        allowed: true,
      },
    ],
  },
  messages: [
    {
      id: "msg_01",
      role: "paciente",
      text: "Oi, tem horario para quinta de manha?",
      createdAt: "2026-03-05T12:28:00.000Z",
    },
    {
      id: "msg_02",
      role: "agente",
      text: "Oi! Para quinta de manha tenho 9h, 10h30 e 11h. Qual fica melhor para voce?",
      createdAt: "2026-03-05T12:28:20.000Z",
    },
    {
      id: "msg_03",
      role: "paciente",
      text: "10h30 funciona.",
      createdAt: "2026-03-05T12:29:10.000Z",
    },
    {
      id: "msg_04",
      role: "agente",
      text: "Combinado! Agendei para quinta as 10h30. Chega 10 minutinhos antes para o atendimento.",
      createdAt: "2026-03-05T12:29:30.000Z",
    },
    {
      id: "msg_05",
      role: "sistema",
      text: "Atendimento registrado. Lead permanece em `new` ate a primeira confirmacao.",
      createdAt: "2026-03-05T12:31:00.000Z",
    },
  ],
  logs: [
    {
      id: "alog_01",
      level: "info",
      message: "Turno concluido: 1 agendamento registrado, 0 leads novos.",
      createdAt: "2026-03-05T12:31:05.000Z",
    },
    {
      id: "alog_02",
      level: "info",
      message: "Tool `buscar_agenda` executada com sucesso.",
      createdAt: "2026-03-05T12:28:15.000Z",
    },
    {
      id: "alog_03",
      level: "warn",
      message: "Contato fora da janela de 24h: resposta com template aprovado.",
      createdAt: "2026-03-04T09:12:00.000Z",
    },
    {
      id: "alog_04",
      level: "error",
      message: "Tool `oferecer_slots` falhou: agenda indisponivel por 4s.",
      createdAt: "2026-03-03T15:47:00.000Z",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* ops-health                                                           */
/* ------------------------------------------------------------------ */

export const opsHealthMock: OpsHealthData = {
  instrumentation: {
    enabled: true,
    allowedFields: ["officeId", "route", "status", "durationMs", "correlationId"],
    scrubbedFields: ["phone", "email", "cpf", "measurement", "mealPlan", "accessToken"],
    sampleRate: 0.25,
  },
  lastBackup: {
    at: "2026-03-05T03:00:00.000Z",
    durationMs: 184000,
    status: "ok",
    sizeLabel: "2,4 GB",
    location: "Bucket de backup do programa",
  },
  queues: [
    {
      id: "q_01",
      name: "Fila de mensagens (WhatsApp)",
      pending: 12,
      processing: 2,
      failed: 0,
      oldestPendingAt: "2026-03-05T12:12:00.000Z",
    },
    {
      id: "q_02",
      name: "Fila de publicacoes (Instagram)",
      pending: 3,
      processing: 1,
      failed: 1,
      oldestPendingAt: "2026-03-04T20:05:00.000Z",
    },
    {
      id: "q_03",
      name: "Fila de webhooks de saida",
      pending: 4,
      processing: 0,
      failed: 2,
      oldestPendingAt: "2026-03-05T09:40:00.000Z",
    },
  ],
  failedWebhooks: [
    {
      id: "wh_02",
      url: "https://erp.exemplo.com/webhook/atendimentos",
      attempts: 4,
      lastError: "O destino respondeu HTTP 503.",
      lastAttemptAt: "2026-03-05T10:42:00.000Z",
    },
    {
      id: "wh_04",
      url: "https://parceiro.exemplo.com/eventos",
      attempts: 6,
      lastError: "Tempo limite excedido apos 6 tentativas — marcado como falho.",
      lastAttemptAt: "2026-03-04T22:10:00.000Z",
    },
  ],
  checks: [
    {
      id: "chk_01",
      label: "Banco de dados",
      status: "ok",
      detail: "Conexao com o Postgres do programa respondendo em 12ms.",
      at: "2026-03-05T12:40:00.000Z",
    },
    {
      id: "chk_02",
      label: "Fila de publicacoes",
      status: "warn",
      detail: "1 item com falha aguardando reexecucao manual.",
      at: "2026-03-05T12:40:00.000Z",
    },
    {
      id: "chk_03",
      label: "Entregas de webhook",
      status: "error",
      detail: "2 endpoints esgotaram o backoff e seguem para inspecao.",
      at: "2026-03-05T12:40:00.000Z",
    },
    {
      id: "chk_04",
      label: "Instrumentacao",
      status: "ok",
      detail: "Amostragem de 25% com 6 campos removidos pelo scrub.",
      at: "2026-03-05T12:40:00.000Z",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* integration-manifest                                                 */
/* ------------------------------------------------------------------ */

export const integrationManifestMock: IntegrationManifestData = {
  programName: "Aurora",
  viewer: { isPlatformOwner: true, name: "Dono da plataforma" },
  connectors: [
    {
      id: "whatsapp",
      label: "WhatsApp (Cloud API)",
      kind: "whatsapp",
      status: "provisioned",
      provisionedBy: "Dono da plataforma",
      env: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_VERIFY_TOKEN"],
      unlocks: ["Canal de atendimento", "Resposta em 24h", "Envio de confirmacao de agendamento"],
      howTo: "Numero de teste aprovado na Meta e token permanente guardado no cofre.",
    },
    {
      id: "anthropic",
      label: "Anthropic (Claude)",
      kind: "llm",
      status: "provisioned",
      provisionedBy: "Dono da plataforma",
      env: ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"],
      unlocks: ["Agente automatico", "Respostas de agenda", "Registro de atendimento"],
      howTo: "Chave criada no painel da Anthropic e vinculada ao programa.",
    },
    {
      id: "instagram",
      label: "Instagram Graph API",
      kind: "api",
      status: "provisioned",
      provisionedBy: "Dono da plataforma",
      env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET", "INSTAGRAM_REDIRECT_URI"],
      unlocks: ["Publicacao de posts", "Carrossel e Reels", "Automacoes de resposta"],
      howTo: "App registrado na Meta; cada conta e autorizada no fluxo OAuth.",
    },
    {
      id: "meta_ads",
      label: "Meta Ads",
      kind: "api",
      status: "missing",
      provisionedBy: "Dono da plataforma",
      env: ["META_ADS_ACCESS_TOKEN", "META_ADS_ACCOUNT_ID"],
      unlocks: ["Leitura de cliques", "Comparacao origem x lead", "Relatorio de anuncios"],
      howTo: "Conta de anuncios vinculada e token de leitura longa duracao.",
    },
    {
      id: "webhooks",
      label: "Webhooks de saida",
      kind: "webhook",
      status: "provisioned",
      provisionedBy: "Dono da plataforma",
      env: ["WEBHOOK_SIGNING_SECRET", "WEBHOOK_TIMEOUT_MS"],
      unlocks: ["Envio de eventos para fora", "Assinatura por segredo", "Reexecucao com backoff"],
      howTo: "Segredo gerado no cofre e referenciado por nome em cada endpoint.",
    },
    {
      id: "storage",
      label: "Storage",
      kind: "storage",
      status: "provisioned",
      provisionedBy: "Dono da plataforma",
      env: ["STORAGE_BUCKET", "STORAGE_REGION", "STORAGE_ACCESS_KEY"],
      unlocks: ["Midias das publicacoes", "Anexos do atendimento", "Backup do programa"],
      howTo: "Bucket criado com acesso restrito ao runtime do programa.",
    },
    {
      id: "email",
      label: "Email",
      kind: "api",
      status: "missing",
      provisionedBy: "Dono da plataforma",
      env: ["EMAIL_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO"],
      unlocks: ["Confirmacao de agendamento", "Lembretes", "Templates aprovados"],
      howTo: "Provedor de e-mail transacional configurado com remetente verificado.",
    },
    {
      id: "pdf",
      label: "PDF",
      kind: "api",
      status: "error",
      provisionedBy: "Dono da plataforma",
      env: ["PDF_API_KEY", "PDF_TEMPLATE_DIR"],
      unlocks: ["Relatorio de atendimento", "Documento para o paciente"],
      howTo: "Credencial do servico de PDF e modelos de template no storage.",
      message: "A credencial do servico de PDF expirou. Gere uma nova chave no cofre.",
    },
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      status: "provisioned",
      provisionedBy: "Dono da plataforma",
      env: ["DATABASE_URL", "DATABASE_BACKUP_BUCKET"],
      unlocks: ["Dados do consultorio", "Fila de eventos", "Backup"],
      howTo: "Postgres do programa com RLS por consultorio e backup diario.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Pacote                                                              */
/* ------------------------------------------------------------------ */

export const operacaoMock = {
  webhooks: webhooksMock,
  agent: agentConsoleMock,
  health: opsHealthMock,
  manifest: integrationManifestMock,
};
