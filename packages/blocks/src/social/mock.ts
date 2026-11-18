import type { SocialAccountsData } from "./social-accounts.js";
import type { SocialAgendaData } from "./social-agenda.js";
import type { SocialAutomationsData } from "./social-automations.js";
import type { SocialComposerData } from "./social-composer.js";
import type { SocialLogsData } from "./social-logs.js";
import type { SocialPostDetailData } from "./social-post-detail.js";

/**
 * Dados ficticios do dominio social (Agendador-Instagram).
 * Contas e pessoas de exemplo, datas ISO, nada real.
 */

/* ------------------------------------------------------------------ */
/* social-accounts                                                      */
/* ------------------------------------------------------------------ */

export const socialAccountsMock: SocialAccountsData = {
  accounts: [
    { id: "acc_01", username: "exemplo.agencia", accountType: "Comercial", status: "active", tokenDaysLeft: null, webhooksSubscribed: true },
    { id: "acc_02", username: "exemplo.clinica", accountType: "Comercial", status: "active", tokenDaysLeft: 5, webhooksSubscribed: false },
    { id: "acc_03", username: "exemplo.estetica.harmonizacao", accountType: "Criador de conteúdo", status: "reauth", tokenDaysLeft: null, webhooksSubscribed: true },
  ],
  setup: {
    callbackUrl: "https://exemplo.vercel.app/api/instagram/callback",
    webhookUrl: "https://exemplo.vercel.app/api/instagram/webhook",
  },
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
      name: "Link da avaliação",
      active: true,
      account: "exemplo.clinica",
      trigger: "comment",
      scopeText: "todos os posts",
      matchMode: "contains",
      keywords: ["quero", "valor", "agenda"],
      excludeKeywords: ["golpe", "caro"],
      dmText: "Oi {usuario}! Aqui está o link para agendar sua avaliação: https://exemplo.com/agenda. Qualquer dúvida, é só responder esta mensagem.",
      publicReplies: 3,
      stats: { matched: 48, sent: 41, skipped: 6, error: 1 },
    },
    {
      id: "aut_02",
      name: "Guia gratuito",
      active: false,
      account: "exemplo.agencia",
      trigger: "comment",
      scopeText: "post agendado (começa quando for publicado)",
      matchMode: "exact",
      keywords: ["guia"],
      excludeKeywords: [],
      dmText: "Prontinho! Segue o guia em PDF.",
      publicReplies: 0,
      stats: { matched: 0, sent: 0, skipped: 0, error: 0 },
    },
    {
      id: "aut_03",
      name: "Resposta do direct",
      active: true,
      account: "exemplo.clinica",
      trigger: "dm",
      scopeText: "mensagens diretas",
      matchMode: "contains",
      keywords: ["horário", "endereço"],
      excludeKeywords: [],
      dmText: "Atendemos de segunda a sexta, das 9h às 18h. Endereço: Rua Exemplo, 123.",
      publicReplies: 0,
      stats: { matched: 12, sent: 12, skipped: 0, error: 0 },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* social-logs                                                          */
/* ------------------------------------------------------------------ */

export const socialLogsMock: SocialLogsData = {
  entries: [
    { id: "log_01", at: "2026-11-18T14:12:00.000Z", account: "exemplo.clinica", automation: "Link da avaliação", from: "maria.exemplo", fromIsUsername: true, text: "Quero saber o valor", status: "sent" },
    { id: "log_02", at: "2026-11-18T13:40:00.000Z", account: "exemplo.clinica", automation: "Link da avaliação", from: "maria.exemplo", fromIsUsername: true, text: "quero!!", status: "skipped" },
    { id: "log_03", at: "2026-11-18T12:05:00.000Z", account: "exemplo.clinica", automation: "Resposta do direct", from: "17841400000000001", fromIsUsername: false, text: "Qual o horário de vocês?", status: "pending" },
    { id: "log_04", at: "2026-11-17T22:31:00.000Z", account: "exemplo.agencia", automation: null, from: "joao.exemplo", fromIsUsername: true, text: "agenda", status: "error", error: "A Meta recusou a mensagem: passou o prazo de 7 dias do comentário." },
  ],
};

/* ------------------------------------------------------------------ */
/* social-agenda                                                        */
/* ------------------------------------------------------------------ */

export const socialAgendaMock: SocialAgendaData = {
  accounts: [
    { id: "acc_01", username: "exemplo.agencia", href: "#conta-1" },
    { id: "acc_02", username: "exemplo.clinica", href: "#conta-2" },
  ],
  activeAccountId: null,
  allAccountsHref: "#todas",
  newPostHref: "#novo",
  accountsHref: "#contas",
  upcoming: [
    {
      key: "2026-11-19",
      day: "19",
      weekday: "qui",
      month: "nov",
      posts: [
        { id: "p1", href: "#p1", time: "09:00", account: "exemplo.clinica", formatLabel: "Carrossel · 4 imagens", caption: "Cinco cuidados antes da sua primeira avaliação", thumb: null, mediaCount: 4, status: "scheduled" },
        { id: "p2", href: "#p2", time: "18:30", account: "exemplo.agencia", formatLabel: "Reels (também no feed)", caption: "Bastidores da sessão de fotos do mês", thumb: null, mediaCount: 1, status: "processing" },
      ],
    },
    {
      key: "2026-11-20",
      day: "20",
      weekday: "sex",
      month: "nov",
      posts: [
        { id: "p3", href: "#p3", time: "12:00", account: "exemplo.clinica", formatLabel: "Post único", caption: "Agenda aberta para dezembro", thumb: null, mediaCount: 1, status: "error", message: "A imagem tem proporção 9:16, que o feed não aceita. Use Story ou recorte para 4:5." },
        { id: "p4", href: "#p4", time: "20:00", account: "exemplo.clinica", formatLabel: "Story (imagem)", caption: "", isStory: true, thumb: null, mediaCount: 1, status: "scheduled", message: "Aguardando a cota diária da Meta." },
      ],
    },
  ],
  history: [
    {
      key: "2026-11-17",
      day: "17",
      weekday: "ter",
      month: "nov",
      posts: [
        { id: "p5", href: "#p5", time: "10:00", account: "exemplo.agencia", formatLabel: "Carrossel · 6 imagens", caption: "Como montamos uma identidade visual em 4 semanas", thumb: null, mediaCount: 6, status: "published", permalink: "https://www.instagram.com/p/EXEMPLO/" },
        { id: "p6", href: "#p6", time: "15:00", account: "exemplo.clinica", formatLabel: "Post único", caption: "Feriado: não teremos atendimento", thumb: null, mediaCount: 1, status: "canceled" },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* social-post-detail                                                   */
/* ------------------------------------------------------------------ */

export const socialPostDetailMock: SocialPostDetailData = {
  post: {
    id: "8d7b2a52-0c1e-4b8a-9f00-000000000001",
    account: "exemplo.clinica",
    status: "error",
    formatLabel: "Carrossel · 3 imagens",
    scheduledAt: "2026-11-20T15:00:00.000Z",
    attempts: 2,
    containerStatus: "ERROR",
    message: "A Meta não conseguiu baixar a imagem 2. Confira se o arquivo ainda existe e tente de novo.",
    caption: "Cinco cuidados antes da sua primeira avaliação.\n\n#estetica #avaliacao",
    media: [],
    automations: ["quero, valor (começa quando o post for publicado)"],
  },
};

/* ------------------------------------------------------------------ */
/* Agregado                                                             */
/* ------------------------------------------------------------------ */

export const socialMock = {
  accounts: socialAccountsMock,
  composer: socialComposerMock,
  automations: socialAutomationsMock,
  logs: socialLogsMock,
  agenda: socialAgendaMock,
  postDetail: socialPostDetailMock,
};
