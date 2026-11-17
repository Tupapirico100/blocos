/**
 * Dados ficticios do dominio de atendimento.
 * Nomes, telefones e valores inventados; nenhum dado real de paciente.
 * Telefones em E.164, datas em ISO (UTC) e dinheiro em centavos.
 */

import type { LeadBoardData } from "./leads-board.js";
import type { InboxWhatsappData } from "./inbox-whatsapp.js";
import type { ConsentPanelData } from "./consent-panel.js";
import type { ChannelConnectionsData } from "./channel-connections.js";

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

export const leadsBoardMock: LeadBoardData = {
  stages: [
    { id: "new", label: "Novo", hint: "Chegou e ainda nao foi qualificado" },
    { id: "qualified", label: "Qualificado", hint: "Tem interesse confirmado" },
    { id: "customer", label: "Cliente", hint: "Virou paciente do consultorio" },
  ],
  leads: [
    {
      id: "lead_001",
      name: "Ana Beatriz Souza",
      phone: "+5511987654321",
      stage: "new",
      origin: "anuncio",
      valueCents: 48000,
      firstTouchAt: "2025-03-12T12:14:00.000Z",
      firstTouchChannel: "WhatsApp",
      firstTouchBy: "Marina Alencar",
      lastTouchAt: "2025-03-12T16:40:00.000Z",
    },
    {
      id: "lead_002",
      name: "Carlos Eduardo Lima",
      phone: "+5521998877665",
      stage: "new",
      origin: "organico",
      valueCents: 32000,
      firstTouchAt: "2025-03-13T09:02:00.000Z",
      firstTouchChannel: "Instagram",
      firstTouchBy: "Pedro Lins",
      lastTouchAt: "2025-03-13T09:02:00.000Z",
    },
    {
      id: "lead_003",
      name: "Mariana Alves Rocha",
      phone: "+5531987654322",
      stage: "new",
      origin: "indicacao",
      valueCents: 65000,
      firstTouchAt: "2025-03-13T18:27:00.000Z",
      firstTouchChannel: "WhatsApp",
      firstTouchBy: "Ana Beatriz Souza",
      lastTouchAt: "2025-03-14T10:05:00.000Z",
    },
    {
      id: "lead_004",
      name: "Rafael Nogueira",
      phone: "+5541999988776",
      stage: "qualified",
      origin: "anuncio",
      valueCents: 89000,
      firstTouchAt: "2025-03-08T14:05:00.000Z",
      firstTouchChannel: "WhatsApp",
      firstTouchBy: "Marina Alencar",
      lastTouchAt: "2025-03-12T11:30:00.000Z",
    },
    {
      id: "lead_005",
      name: "Juliana Prado",
      phone: "+5516999123456",
      stage: "qualified",
      origin: "organico",
      valueCents: 120000,
      firstTouchAt: "2025-03-06T19:48:00.000Z",
      firstTouchChannel: "Site",
      firstTouchBy: "Pedro Lins",
      lastTouchAt: "2025-03-11T15:20:00.000Z",
    },
    {
      id: "lead_006",
      name: "Thiago Marques",
      phone: "+5535998877664",
      stage: "qualified",
      origin: "indicacao",
      valueCents: 54000,
      firstTouchAt: "2025-03-10T13:12:00.000Z",
      firstTouchChannel: "WhatsApp",
      firstTouchBy: "Marina Alencar",
      lastTouchAt: "2025-03-13T08:15:00.000Z",
    },
    {
      id: "lead_007",
      name: "Camila Ferraz",
      phone: "+5521988776655",
      stage: "customer",
      origin: "anuncio",
      valueCents: 240000,
      firstTouchAt: "2025-02-18T15:30:00.000Z",
      firstTouchChannel: "WhatsApp",
      firstTouchBy: "Marina Alencar",
      lastTouchAt: "2025-03-12T17:45:00.000Z",
    },
    {
      id: "lead_008",
      name: "Bruno Tavares",
      phone: "+5534887766554",
      stage: "customer",
      origin: "indicacao",
      valueCents: 175000,
      firstTouchAt: "2025-01-29T11:08:00.000Z",
      firstTouchChannel: "WhatsApp",
      firstTouchBy: "Ana Beatriz Souza",
      lastTouchAt: "2025-03-05T12:00:00.000Z",
    },
    {
      id: "lead_009",
      name: "Larissa Moreira",
      phone: "+5517987654323",
      stage: "customer",
      origin: "organico",
      valueCents: 96000,
      firstTouchAt: "2025-02-02T10:22:00.000Z",
      firstTouchChannel: "Instagram",
      firstTouchBy: "Pedro Lins",
      lastTouchAt: "2025-03-09T09:40:00.000Z",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Caixa de entrada do WhatsApp                                         */
/* ------------------------------------------------------------------ */

export const inboxWhatsappMock: InboxWhatsappData = {
  /** Referencia fixa: 14/03/2025 15:00 (America/Sao_Paulo). */
  now: "2025-03-14T18:00:00.000Z",
  activeConversationId: "conv_001",
  quickReplies: [
    "Oi! Recebi sua mensagem, ja te explico.",
    "Posso te enviar os horarios de consulta?",
    "Quer que eu reserve uma avaliacao?",
  ],
  templates: [
    {
      id: "tpl_boas_vindas",
      name: "Boas-vindas",
      body: "Oi! Aqui e do consultorio. Recebemos sua mensagem e retornamos em breve.",
    },
    {
      id: "tpl_agendamento",
      name: "Agendamento",
      body: "Podemos marcar sua avaliacao. Qual o melhor dia e horario para voce?",
    },
    {
      id: "tpl_reforco",
      name: "Reforco de consulta",
      body: "Passando para lembrar da sua consulta. Precisa remarcar?",
    },
  ],
  conversations: [
    {
      id: "conv_001",
      name: "Ana Beatriz Souza",
      phone: "+5511987654321",
      lastMessage: "Boa tarde! Gostaria de saber os horarios de avaliacao.",
      lastMessageAt: "2025-03-14T17:12:00.000Z",
      /** Escreveu ha menos de 24h: mensagem livre liberada. */
      lastInboundAt: "2025-03-14T17:12:00.000Z",
      allowed: true,
      unread: 2,
      messages: [
        {
          id: "msg_001",
          direction: "out",
          body: "Ola! Aqui e do consultorio. Como podemos ajudar?",
          at: "2025-03-14T16:58:00.000Z",
        },
        {
          id: "msg_002",
          direction: "in",
          body: "Boa tarde! Gostaria de saber os horarios de avaliacao.",
          at: "2025-03-14T17:12:00.000Z",
        },
      ],
    },
    {
      id: "conv_002",
      name: "Carlos Eduardo Lima",
      phone: "+5521998877665",
      lastMessage: "Obrigado, ate mais!",
      lastMessageAt: "2025-03-11T15:40:00.000Z",
      /** Escreveu ha mais de 24h: so template aprovado. */
      lastInboundAt: "2025-03-11T15:40:00.000Z",
      allowed: true,
      messages: [
        {
          id: "msg_003",
          direction: "in",
          body: "Boa tarde, vi o anuncio e gostaria de saber mais.",
          at: "2025-03-11T15:38:00.000Z",
        },
        {
          id: "msg_004",
          direction: "out",
          body: "Ola Carlos! Sending infos em breve.",
          at: "2025-03-11T15:40:00.000Z",
          templateId: "tpl_boas_vindas",
        },
      ],
    },
    {
      id: "conv_003",
      name: "Desconhecido (numero novo)",
      phone: "+5531888999000",
      lastMessage: "Voce vende esse produto? Quero revender.",
      lastMessageAt: "2025-03-14T12:05:00.000Z",
      lastInboundAt: "2025-03-14T12:05:00.000Z",
      /** Regra 11: nao esta na lista de permitidos. */
      allowed: false,
      unread: 1,
      messages: [
        {
          id: "msg_005",
          direction: "in",
          body: "Voce vende esse produto? Quero revender.",
          at: "2025-03-14T12:05:00.000Z",
        },
      ],
    },
    {
      id: "conv_004",
      name: "Juliana Prado",
      phone: "+5516999123456",
      lastMessage: "Perfeito, ate quinta!",
      lastMessageAt: "2025-03-13T19:22:00.000Z",
      lastInboundAt: "2025-03-13T19:22:00.000Z",
      allowed: true,
      messages: [
        {
          id: "msg_006",
          direction: "out",
          body: "Podemos confirmar sua avaliacao na quinta as 9h.",
          at: "2025-03-13T19:10:00.000Z",
        },
        {
          id: "msg_007",
          direction: "in",
          body: "Perfeito, ate quinta!",
          at: "2025-03-13T19:22:00.000Z",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Consentimentos                                                        */
/* ------------------------------------------------------------------ */

export const consentPanelMock: ConsentPanelData = {
  patient: { id: "pat_001", name: "Ana Beatriz Souza" },
  currentTextVersions: { tratamento: "tratamento-v3", marketing: "marketing-v2" },
  consents: [
    {
      id: "cns_001",
      patientId: "pat_001",
      patientName: "Ana Beatriz Souza",
      kind: "tratamento",
      channel: "whatsapp",
      grantedAt: "2025-03-12T12:20:00.000Z",
      textVersion: "tratamento-v3",
      textSnapshot:
        "Autorizo o tratamento dos meus dados de saude para fins de atendimento, conforme a politica de privacidade do consultorio.",
    },
    {
      id: "cns_002",
      patientId: "pat_001",
      patientName: "Ana Beatriz Souza",
      kind: "marketing",
      channel: "whatsapp",
      grantedAt: "2025-03-12T12:22:00.000Z",
      textVersion: "marketing-v2",
      textSnapshot:
        "Autorizo o recebimento de comunicacoes de marketing e lembretes de consulta pelo WhatsApp.",
    },
    {
      id: "cns_003",
      patientId: "pat_002",
      patientName: "Carlos Eduardo Lima",
      kind: "tratamento",
      channel: "presencial",
      grantedAt: "2025-02-10T14:00:00.000Z",
      textVersion: "tratamento-v2",
      textSnapshot:
        "Autorizo o tratamento dos meus dados de saude para fins de atendimento, conforme a politica de privacidade do consultorio.",
    },
    {
      id: "cns_004",
      patientId: "pat_002",
      patientName: "Carlos Eduardo Lima",
      kind: "marketing",
      channel: "email",
      grantedAt: "2025-02-10T14:05:00.000Z",
      textVersion: "marketing-v1",
      textSnapshot: "Aceito receber novidades e lembretes por e-mail.",
      revokedAt: "2025-03-01T10:00:00.000Z",
    },
    {
      id: "cns_005",
      patientId: "pat_003",
      patientName: "Juliana Prado",
      kind: "tratamento",
      channel: "papel",
      grantedAt: "2025-01-22T09:30:00.000Z",
      textVersion: "tratamento-v2",
      textSnapshot:
        "Autorizo o tratamento dos meus dados de saude para fins de atendimento, conforme a politica de privacidade do consultorio.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Conexoes de canal                                                    */
/* ------------------------------------------------------------------ */

export const channelConnectionsMock: ChannelConnectionsData = {
  connections: [
    {
      id: "chl_001",
      provider: "WhatsApp Cloud API (Meta)",
      kind: "oficial",
      phoneNumber: "+5511987654321",
      status: "ativo",
      waba: {
        id: "102938475610293",
        name: "Consultorio Aurora - Atendimento",
        status: "Conectado",
        reviewStatus: "Aprovado",
      },
      riskAcceptance: null,
      notes: "Numero principal do consultorio.",
    },
    {
      id: "chl_002",
      provider: "WhatsApp auto-hospedado (Baileys)",
      kind: "auto-hospedado",
      phoneNumber: "+5531888999000",
      status: "pendente",
      riskAcceptance: {
        version: "risco-auto-hospedado-2025-01",
        acceptedBy: "Marina Alencar (dona do consultorio)",
        acceptedAt: "2025-01-14T13:00:00.000Z",
        note: "Uso apenas para respostas de contatos fora do horario comercial.",
      },
      notes: "Servidor proprio do consultorio.",
    },
    {
      id: "chl_003",
      provider: "Canal hospedado por terceiro",
      kind: "hospedado",
      phoneNumber: "+5516999123456",
      status: "erro",
      waba: {
        name: "Agendamento Aurora",
        status: "Sincronizacao pendente",
        reviewStatus: "Em revisao",
      },
      riskAcceptance: null,
      notes: "Revisao de risco pendente com o dono do consultorio.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Pacote completo                                                      */
/* ------------------------------------------------------------------ */

export const atendimentoMock = {
  leadsBoard: leadsBoardMock,
  inboxWhatsapp: inboxWhatsappMock,
  consentPanel: consentPanelMock,
  channelConnections: channelConnectionsMock,
};

export type AtendimentoMock = typeof atendimentoMock;
