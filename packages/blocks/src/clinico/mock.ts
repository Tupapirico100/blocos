/**
 * Dados ficticios do dominio clinico.
 * Pacientes, medidas e planos inventados; nenhum dado real de paciente.
 * Telefones em E.164, datas em ISO (UTC) e dinheiro em centavos.
 */

import type { PatientsListData } from "./patients-list.js";
import type { PatientChartData } from "./patient-chart.js";
import type { ClinicalEntryData } from "./clinical-entry.js";

/* ------------------------------------------------------------------ */
/* Pacientes                                                            */
/* ------------------------------------------------------------------ */

export const patientsListMock: PatientsListData = {
  patients: [
    {
      id: "pat_001",
      name: "Ana Beatriz Souza",
      phone: "+5511987654321",
      email: "ana.souza@example.com",
      treatmentConsent: "vigente",
      lastVisitAt: "2025-03-12T13:00:00.000Z",
      birthDate: "1988-07-21",
      tags: ["Reeducacao alimentar"],
    },
    {
      id: "pat_002",
      name: "Carlos Eduardo Lima",
      phone: "+5521998877665",
      email: "carlos.lima@example.com",
      treatmentConsent: "vigente",
      lastVisitAt: "2025-02-10T14:00:00.000Z",
      birthDate: "1979-11-03",
      tags: ["Emagrecimento"],
    },
    {
      id: "pat_003",
      name: "Juliana Prado",
      phone: "+5516999123456",
      email: "juliana.prado@example.com",
      treatmentConsent: "revogado",
      lastVisitAt: "2025-01-22T14:30:00.000Z",
      birthDate: "1992-03-18",
      tags: ["Gestacao de peso"],
    },
    {
      id: "pat_004",
      name: "Rafael Nogueira",
      phone: "+5541999988776",
      email: "rafael.nogueira@example.com",
      treatmentConsent: "ausente",
      lastVisitAt: "2025-03-08T15:00:00.000Z",
      birthDate: "1995-09-09",
    },
    {
      id: "pat_005",
      name: "Mariana Alves Rocha",
      phone: "+5531987654322",
      email: "mariana.rocha@example.com",
      treatmentConsent: "vigente",
      lastVisitAt: "2025-03-13T17:30:00.000Z",
      birthDate: "1985-01-27",
      tags: ["Performance"],
    },
    {
      id: "pat_006",
      name: "Thiago Marques",
      phone: "+5535998877664",
      email: "thiago.marques@example.com",
      treatmentConsent: "vigente",
      lastVisitAt: "2025-03-06T18:00:00.000Z",
      birthDate: "1990-12-12",
      tags: ["Reeducacao alimentar"],
    },
    {
      id: "pat_007",
      name: "Larissa Moreira",
      phone: "+5517987654323",
      email: "larissa.moreira@example.com",
      treatmentConsent: "ausente",
      birthDate: "2001-05-30",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Prontuario de um paciente ficticio                                    */
/* ------------------------------------------------------------------ */

export const patientChartMock: PatientChartData = {
  patient: {
    id: "pat_001",
    name: "Ana Beatriz Souza",
    phone: "+5511987654321",
    birthDate: "1988-07-21",
  },
  treatmentConsent: {
    grantedAt: "2025-03-12T12:20:00.000Z",
    textVersion: "tratamento-v3",
  },
  consultations: [
    {
      id: "con_001",
      at: "2025-03-12T13:00:00.000Z",
      kind: "consulta",
      professional: "Marina Alencar — Nutricionista",
      summary: "Retorno da avaliacao. Mantido o plano alimentar v2 e ajustada a distribuicao das refeicoes.",
    },
    {
      id: "con_002",
      at: "2025-02-20T14:00:00.000Z",
      kind: "evolucao",
      professional: "Marina Alencar — Nutricionista",
      summary: "Acompanhamento mensal: relato de maior energia e sono melhor.",
    },
    {
      id: "con_003",
      at: "2025-02-03T13:30:00.000Z",
      kind: "plano",
      professional: "Marina Alencar — Nutricionista",
      summary: "Publicada a versao v2 do plano alimentar.",
    },
    {
      id: "con_004",
      at: "2025-01-16T15:00:00.000Z",
      kind: "consulta",
      professional: "Marina Alencar — Nutricionista",
      summary: "Primeira consulta. Anamnese e plano inicial.",
    },
  ],
  measures: [
    { id: "med_001", at: "2025-01-16T15:05:00.000Z", weightKg: 84.2, bodyFatPct: 31.4, waistCm: 92 },
    { id: "med_002", at: "2025-02-03T13:35:00.000Z", weightKg: 82.6, bodyFatPct: 30.2, waistCm: 90 },
    { id: "med_003", at: "2025-02-20T14:05:00.000Z", weightKg: 81.9, bodyFatPct: 29.5, waistCm: 89 },
    { id: "med_004", at: "2025-03-12T13:05:00.000Z", weightKg: 80.8, bodyFatPct: 28.7, waistCm: 88 },
  ],
  mealPlan: {
    version: "v3",
    updatedAt: "2025-03-12T13:10:00.000Z",
    author: "Marina Alencar — Nutricionista",
    summary:
      "Plano de refeicoes em 5 pontos com proteina no cafe e no lanche da tarde, hidratos distribuidos ao longo do dia.",
    active: true,
  },
  financial: {
    totalCents: 960000,
    paidCents: 640000,
    pendingCents: 320000,
  },
};

/* ------------------------------------------------------------------ */
/* Registro de atendimento (exemplos: com e sem consentimento)           */
/* ------------------------------------------------------------------ */

export const clinicalEntryMock: ClinicalEntryData = {
  patient: { id: "pat_001", name: "Ana Beatriz Souza" },
  kind: "consulta",
  hasTreatmentConsent: true,
  treatmentConsent: {
    grantedAt: "2025-03-12T12:20:00.000Z",
    textVersion: "tratamento-v3",
  },
  professionals: [
    "Marina Alencar — Nutricionista",
    "Pedro Lins — Nutricionista",
    "Sofia Bastos — Educadora alimentar",
  ],
  defaultProfessional: "Marina Alencar — Nutricionista",
  lastMeasures: {
    weightKg: 80.8,
    bodyFatPct: 28.7,
    waistCm: 88,
  },
};

/** Mesmo paciente, porem SEM consentimento de tratamento vigente. */
export const clinicalEntryBlockedMock: ClinicalEntryData = {
  patient: { id: "pat_004", name: "Rafael Nogueira" },
  kind: "medida",
  hasTreatmentConsent: false,
  treatmentConsent: null,
  professionals: ["Marina Alencar — Nutricionista"],
  defaultProfessional: "Marina Alencar — Nutricionista",
};

/* ------------------------------------------------------------------ */
/* Pacote completo                                                      */
/* ------------------------------------------------------------------ */

export const clinicoMock = {
  patientsList: patientsListMock,
  patientChart: patientChartMock,
  clinicalEntry: clinicalEntryMock,
  clinicalEntryBlocked: clinicalEntryBlockedMock,
};

export type ClinicoMock = typeof clinicoMock;
