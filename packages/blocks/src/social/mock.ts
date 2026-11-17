import type { SocialAccountsData } from "./social-accounts.js";
import type { SocialAutomationsData } from "./social-automations.js";
import type { SocialComposerData } from "./social-composer.js";
import type { SocialLogsData } from "./social-logs.js";

/**
 * Dados ficticios do dominio social (Agendador-Instagram).
 * Nomes de exemplo, datas ISO, nada real de paciente.
 */

/* ------------------------------------------------------------------ */
/* social-accounts                                                      */
/* ------------------------------------------------------------------ */

export const socialAccountsMock: SocialAccountsData = {
  accounts: [
    {
      id: "acc_01",
      handle: "@exemplo.nutricao",
      displayName: "Consultorio Exemplo",
      tokenStatus: "valid",
      tokenExpiresAt: "2026-04-18T21:00:00.000Z",
      tokenRef: "INSTAGRAM_TOKEN_EXEMPLO_01",
      connectedAt: "2026-01-18T21:00:00.000Z",
      followers: 2480,
      lastPost: {
        id: "post_91",
        title: "Como montar um prato com 3 cores",
        format: "carrossel",
        publishedAt: "2026-03-28T13:30:00.000Z",
      },
    },
    {
      id: "acc_02",
      handle: "@exemplo.clinica",
      displayName: "Clinica Exemplo Pilates",
      tokenStatus: "expiring",
      tokenExpiresAt: "2026-03-08T21:00:00.000Z",
      tokenRef: "INSTAGRAM_TOKEN_EXEMPLO_02",
      connectedAt: "2025-11-08T21:00:00.000Z",
      followers: 940,
      lastPost: {
        id: "post_88",
        title: "Agendamento aberto para a semana que vem",
        format: "reels",
        publishedAt: "2026-03-02T19:45:00.000Z",
      },
    },
    {
      id: "acc_03",
      handle: "@exemplo.receitas",
      displayName: "Receitas Exemplo",
      tokenStatus: "expired",
      tokenExpiresAt: "2026-02-20T21:00:00.000Z",
      tokenRef: "INSTAGRAM_TOKEN_EXEMPLO_03",
      connectedAt: "2025-09-20T21:00:00.000Z",
      followers: 512,
    },
    {
      id: "acc_04",
      handle: "@exemplo.bemestar",
      displayName: "Bem-estar Exemplo",
      tokenStatus: "valid",
      tokenExpiresAt: "2026-05-02T21:00:00.000Z",
      tokenRef: "INSTAGRAM_TOKEN_EXEMPLO_04",
      connectedAt: "2026-02-02T21:00:00.000Z",
      followers: 3180,
      lastPost: {
        id: "post_85",
        title: "Cinco itens que sempre levamos na consulta",
        format: "post",
        publishedAt: "2026-03-01T12:00:00.000Z",
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* social-composer                                                      */
/* ------------------------------------------------------------------ */

export const socialComposerMock: SocialComposerData = {
  accounts: [
    { id: "acc_01", handle: "@exemplo.nutricao", displayName: "Consultorio Exemplo" },
    { id: "acc_02", handle: "@exemplo.clinica", displayName: "Clinica Exemplo Pilates" },
    { id: "acc_04", handle: "@exemplo.bemestar", displayName: "Bem-estar Exemplo" },
  ],
  media: [
    { id: "med_01", kind: "image", name: "prato-colorido.jpg", meta: "1,2 MB" },
    { id: "med_02", kind: "image", name: "mesa-consultorio.jpg", meta: "980 KB" },
    { id: "med_03", kind: "image", name: "card-agenda.png", meta: "420 KB" },
    { id: "med_04", kind: "video", name: "roteiro-almoco.mp4", meta: "38 s" },
    { id: "med_05", kind: "image", name: "detalhe-armario.jpg", meta: "760 KB" },
  ],
  draft: {
    accountId: "acc_01",
    format: "carrossel",
    caption:
      "Montar um prato colorido nao precisa ser dificil: escolha um alimento de cada cor e comece por um que voce ja gosta.",
    hashtags: ["nutricao", "consultorio", "prato"],
    mediaIds: ["med_01", "med_02"],
    scheduledAt: "2026-03-10T09:00",
  },
};

/* ------------------------------------------------------------------ */
/* social-automations                                                   */
/* ------------------------------------------------------------------ */

export const socialAutomationsMock: SocialAutomationsData = {
  automations: [
    {
      id: "aut_01",
      name: "Boas-vindas em comentario",
      active: true,
      accountHandle: "@exemplo.nutricao",
      trigger: { type: "comentario", value: "*", match: "contem" },
      action: { type: "responder", value: "Ola! Obrigado por escrever. Nos falamos por aqui." },
      createdAt: "2026-01-20T14:00:00.000Z",
      hits: 132,
      lastTriggeredAt: "2026-03-05T18:20:00.000Z",
    },
    {
      id: "aut_02",
      name: "Duvida sobre agenda",
      active: true,
      accountHandle: "@exemplo.nutricao",
      trigger: { type: "palavra-chave", value: "agenda", match: "contem" },
      action: { type: "agendar", value: "Consultorio abre as agendas de terca a sexta, das 8h as 18h." },
      createdAt: "2026-02-02T10:30:00.000Z",
      hits: 47,
      lastTriggeredAt: "2026-03-04T16:05:00.000Z",
    },
    {
      id: "aut_03",
      name: "Mencao vira lead",
      active: true,
      accountHandle: "@exemplo.clinica",
      trigger: { type: "mencao", value: "@exemplo.nutricao", match: "exata" },
      action: { type: "marcar", value: "lead" },
      createdAt: "2026-02-11T09:15:00.000Z",
      hits: 8,
      lastTriggeredAt: "2026-03-01T11:40:00.000Z",
    },
    {
      id: "aut_04",
      name: "Confirmacao de agendamento",
      active: false,
      accountHandle: "@exemplo.bemestar",
      trigger: { type: "palavra-chave", value: "confirmo", match: "exata" },
      action: { type: "responder", value: "Agendamento confirmado. ate breve!" },
      createdAt: "2025-12-05T17:45:00.000Z",
      hits: 21,
      lastTriggeredAt: "2026-01-30T20:10:00.000Z",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* social-logs                                                          */
/* ------------------------------------------------------------------ */

export const socialLogsMock: SocialLogsData = {
  logs: [
    {
      id: "log_501",
      level: "info",
      accountHandle: "@exemplo.nutricao",
      action: "Publicacao agendada",
      message: "Carrossel de 2 midias agendado para 10/03 as 09:00.",
      createdAt: "2026-03-05T12:04:00.000Z",
      status: "concluido",
    },
    {
      id: "log_502",
      level: "warn",
      accountHandle: "@exemplo.clinica",
      action: "Token proximo do limite",
      message: "O token desta conta expira em poucos dias. Reconecte para nao perder publicacoes.",
      createdAt: "2026-03-05T09:12:00.000Z",
      status: "pendente",
    },
    {
      id: "log_503",
      level: "error",
      accountHandle: "@exemplo.receitas",
      action: "Publicacao rejeitada",
      message: "A API recusou o upload da midia. Reexecute depois de conferir o formato do arquivo.",
      createdAt: "2026-03-04T15:48:00.000Z",
      status: "falhou",
      retryable: true,
    },
    {
      id: "log_504",
      level: "info",
      accountHandle: "@exemplo.bemestar",
      action: "Comentario respondido",
      message: "Regra de boas-vindas respondeu um comentario em @exemplo.bemestar.",
      createdAt: "2026-03-04T11:03:00.000Z",
      status: "concluido",
    },
    {
      id: "log_505",
      level: "warn",
      accountHandle: "@exemplo.nutricao",
      action: "Fila de publicacao lenta",
      message: "A fila de publicacao passou de 20 tarefas. O agendador vai processar em ordem.",
      createdAt: "2026-03-03T18:22:00.000Z",
      status: "pendente",
    },
    {
      id: "log_506",
      level: "error",
      accountHandle: "@exemplo.nutricao",
      action: "Reels rejeitado",
      message: "O video excede o limite de 60 segundos.",
      createdAt: "2026-03-02T20:31:00.000Z",
      status: "falhou",
      retryable: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Pacote                                                              */
/* ------------------------------------------------------------------ */

export const socialMock = {
  accounts: socialAccountsMock,
  composer: socialComposerMock,
  automations: socialAutomationsMock,
  logs: socialLogsMock,
};
