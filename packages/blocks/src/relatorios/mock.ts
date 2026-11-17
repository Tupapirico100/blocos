import type { MetaConversionData } from "./meta-conversion.js";
import type { ReportsFunnelData } from "./reports-funnel.js";

/**
 * Dados ficticios do dominio "relatorios" para o catalogo.
 * O funil conta PESSOAS; os cliques aparecem separados. Nenhum dado real de paciente.
 */

export const reportsFunnelMock: ReportsFunnelData = {
  stages: [
    { id: "new", label: "Novo lead", peopleCount: 428 },
    { id: "qualified", label: "Qualificado", peopleCount: 186 },
    { id: "customer", label: "Cliente", peopleCount: 71 },
  ],
  period: { from: "2024-03-01", to: "2024-03-31" },
  bySource: [
    { source: "Instagram", peopleCount: 152, clicks: 1340 },
    { source: "Google Ads", peopleCount: 118, clicks: 2210 },
    { source: "Indicacao", peopleCount: 96, clicks: 0 },
    { source: "WhatsApp", peopleCount: 41, clicks: 0 },
    { source: "Site", peopleCount: 21, clicks: 460 },
  ],
};

export const metaEvents = [
  {
    id: "evt-9001",
    event: "Lead",
    dedupKey: "a7f3c1e2b9d04816",
    stage: "new" as const,
    source: "Instagram",
    occurredAt: "2024-03-12T10:44:00-03:00",
    status: "enviado" as const,
    valueCents: 28000,
    attempts: 1,
  },
  {
    id: "evt-9002",
    event: "Contato",
    dedupKey: "c04b77e51a2f4d93",
    stage: "new" as const,
    source: "Google Ads",
    occurredAt: "2024-03-12T11:05:00-03:00",
    status: "enviado" as const,
    attempts: 1,
  },
  {
    id: "evt-9003",
    event: "Lead",
    dedupKey: "e58d0c9b77a14e2f",
    stage: "qualified" as const,
    source: "Indicacao",
    occurredAt: "2024-03-12T13:20:00-03:00",
    status: "pendente" as const,
    valueCents: 96000,
    attempts: 0,
  },
  {
    id: "evt-9004",
    event: "Compra",
    dedupKey: "91fa2c8d4e6b03a7",
    stage: "customer" as const,
    source: "WhatsApp",
    occurredAt: "2024-03-12T14:02:00-03:00",
    status: "erro" as const,
    valueCents: 176000,
    attempts: 3,
  },
  {
    id: "evt-9005",
    event: "Lead",
    dedupKey: "3c8e5d21ba97f406",
    stage: "new" as const,
    source: "Site",
    occurredAt: "2024-03-13T08:35:00-03:00",
    status: "pendente" as const,
    attempts: 0,
  },
  {
    id: "evt-9006",
    event: "Contato",
    dedupKey: "b62d9047fc1a83e5",
    stage: "qualified" as const,
    source: "Instagram",
    occurredAt: "2024-03-13T09:12:00-03:00",
    status: "enviado" as const,
    attempts: 1,
  },
];

export const metaConversionMock: MetaConversionData = {
  events: metaEvents,
  period: { from: "2024-03-01", to: "2024-03-31" },
};

export const relatoriosMocks = {
  "reports-funnel": reportsFunnelMock,
  "meta-conversion": metaConversionMock,
};
