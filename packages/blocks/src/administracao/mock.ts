import type { AdminPlatformData } from "./admin-platform.js";
import type { OfficeSettingsData } from "./office-settings.js";
import type { OfficeTeamData } from "./office-team.js";

/* ------------------------------------------------------------------ */
/* Dados ficticios do dominio de administracao                          */
/* Consultorios, pessoas e telefones sao inventados (@exemplo.com.br).   */
/* ------------------------------------------------------------------ */

/** Painel do dono da plataforma. */
export const adminPlatformMock: AdminPlatformData = {
  viewer: {
    name: "Helena Duarte",
    email: "helena.duarte@exemplo.com.br",
    isPlatformOwner: true,
  },
  metrics: {
    activeOffices: 12,
    members: 47,
    leadsToday: 83,
    conversations: 29,
  },
  offices: [
    {
      id: "ofc_4c21",
      name: "Consultório Aurora Nutrição",
      city: "São Paulo/SP",
      status: "active",
      members: 6,
      leadsToday: 14,
      channel: {
        connected: true,
        provider: "Cloud API (Meta)",
        phone: "+5511987654321",
      },
      createdAt: "2025-02-11T10:00:00-03:00",
    },
    {
      id: "ofc_8b73",
      name: "Consultório Vila Nova",
      city: "Curitiba/PR",
      status: "active",
      members: 4,
      leadsToday: 9,
      channel: {
        connected: true,
        provider: "Evolution API",
        phone: "+5541999887766",
      },
      createdAt: "2025-04-02T09:30:00-03:00",
    },
    {
      id: "ofc_1d54",
      name: "Consultório Serra Azul",
      city: "Belo Horizonte/MG",
      status: "trial",
      members: 2,
      leadsToday: 3,
      channel: { connected: false },
      createdAt: "2025-11-05T14:20:00-03:00",
    },
    {
      id: "ofc_7f09",
      name: "Consultório Boa Vista",
      city: "Recife/PE",
      status: "suspended",
      members: 3,
      leadsToday: 0,
      channel: {
        connected: true,
        provider: "Baileys",
        phone: "+5581991234567",
      },
      createdAt: "2025-01-19T16:45:00-03:00",
    },
  ],
};

/** Equipe de um consultório, incluindo o acesso do dono da plataforma. */
export const officeTeamMock: OfficeTeamData = {
  office: { id: "ofc_4c21", name: "Consultório Aurora Nutrição" },
  viewerRole: "owner",
  members: [
    {
      id: "mem_01",
      name: "Mariana Albuquerque",
      email: "mariana.albuquerque@exemplo.com.br",
      phone: "+5511987654321",
      role: "owner",
      accessSource: "member",
      status: "active",
      joinedAt: "2025-02-11T10:05:00-03:00",
    },
    {
      id: "mem_02",
      name: "Rafael Nogueira",
      email: "rafael.nogueira@exemplo.com.br",
      phone: "+5511991122334",
      role: "nutritionist",
      accessSource: "member",
      status: "active",
      joinedAt: "2025-03-04T08:15:00-03:00",
    },
    {
      id: "mem_03",
      name: "Beatriz Fontes",
      email: "beatriz.fontes@exemplo.com.br",
      role: "receptionist",
      accessSource: "member",
      status: "active",
      joinedAt: "2025-05-27T11:40:00-03:00",
    },
    {
      id: "mem_04",
      name: "Camila Rezende",
      email: "camila.rezende@exemplo.com.br",
      role: "nutritionist",
      accessSource: "member",
      status: "invited",
      joinedAt: "2025-11-12T09:00:00-03:00",
    },
    {
      id: "mem_05",
      name: "Helena Duarte",
      email: "helena.duarte@exemplo.com.br",
      phone: "+5511995001122",
      role: "owner",
      accessSource: "platform",
      status: "active",
      joinedAt: "2025-02-11T10:06:00-03:00",
    },
  ],
  invites: [
    {
      id: "inv_01",
      email: "diego.siqueira@exemplo.com.br",
      role: "receptionist",
      tokenPreview: "••••9f3a",
      createdAt: "2025-11-14T15:10:00-03:00",
      expiresAt: "2025-11-21T15:10:00-03:00",
      status: "pending",
    },
    {
      id: "inv_02",
      email: "tatiane.moraes@exemplo.com.br",
      role: "nutritionist",
      tokenPreview: "••••2c1e",
      createdAt: "2025-11-02T13:00:00-03:00",
      expiresAt: "2025-11-09T13:00:00-03:00",
      status: "accepted",
    },
  ],
};

/** Configuracoes de um consultorio com provedor de WhatsApp nao oficial. */
export const officeSettingsMock: OfficeSettingsData = {
  office: { id: "ofc_4c21", name: "Consultório Aurora Nutrição" },
  channels: [
    {
      id: "whatsapp",
      label: "WhatsApp",
      connected: true,
      provider: "Evolution API",
      identifier: "+5511987654321",
      connectedAt: "2025-06-10T09:00:00-03:00",
    },
    {
      id: "instagram",
      label: "Instagram",
      connected: false,
    },
  ],
  whatsapp: {
    provider: "non_official",
    providerLabel: "Evolution API (provedor intermediário)",
    official: false,
  },
  riskVersion: "risco-whatsapp-nao-oficial@2025-11",
  riskAcceptance: {
    version: "risco-whatsapp-nao-oficial@2025-09",
    acceptedBy: "Helena Duarte",
    acceptedAt: "2025-09-18T14:32:00-03:00",
  },
  schedule: {
    timezone: "America/Sao_Paulo",
    hours: [
      { day: "Segunda-feira", enabled: true, start: "08:00", end: "18:00" },
      { day: "Terça-feira", enabled: true, start: "08:00", end: "18:00" },
      { day: "Quarta-feira", enabled: true, start: "08:00", end: "18:00" },
      { day: "Quinta-feira", enabled: true, start: "08:00", end: "18:00" },
      { day: "Sexta-feira", enabled: true, start: "08:00", end: "17:00" },
      { day: "Sábado", enabled: false, start: "09:00", end: "12:00" },
      { day: "Domingo", enabled: false, start: "09:00", end: "12:00" },
    ],
  },
  webhook: {
    url: "https://app.exemplo.com.br/hooks/aurora",
    active: true,
    secretRef: "WEBHOOK_SECRET_REF",
    lastDeliveryAt: "2025-11-17T11:58:00-03:00",
  },
};

/** Mesmos dados com o WhatsApp oficial e o risco aceito na versao vigente. */
export const officeSettingsOfficialMock: OfficeSettingsData = {
  ...officeSettingsMock,
  channels: [
    {
      ...officeSettingsMock.channels[0]!,
      provider: "Cloud API (Meta)",
    },
    officeSettingsMock.channels[1]!,
  ],
  whatsapp: {
    provider: "cloud_api",
    providerLabel: "WhatsApp Cloud API (Meta)",
    official: true,
  },
  riskAcceptance: {
    version: "risco-whatsapp-nao-oficial@2025-11",
    acceptedBy: "Helena Duarte",
    acceptedAt: "2025-11-10T10:05:00-03:00",
  },
};

export const administracaoMocks = {
  adminPlatform: adminPlatformMock,
  officeTeam: officeTeamMock,
  officeSettings: officeSettingsMock,
  officeSettingsOfficial: officeSettingsOfficialMock,
};

export default administracaoMocks;
