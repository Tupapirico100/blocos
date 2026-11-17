import { defineBlock } from "@blocos/core";

/**
 * Registro de atendimento clinico — extraido de:
 *  - CRM-Nutricionista: src/app/[locale]/pacientes/[id]/ClinicalHistory.tsx
 *  - CRM-HOF: src/app/[locale]/patients/[id]/page.tsx
 */
export const clinicalEntryRecipe = defineBlock({
  id: "clinical-entry",
  name: "Registro de atendimento clinico",
  domain: "clinico",
  summary:
    "Registro de consulta ou medida no prontuario, com portao de consentimento: sem consentimento de tratamento vigente a gravacao fica bloqueada.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/pacientes/[id]/ClinicalHistory.tsx",
    "CRM-HOF: src/app/[locale]/patients/[id]/page.tsx",
  ],
  ports: [
    {
      id: "clinicalEntriesRepository",
      label: "Repositorio de registros clinicos",
      contract:
        "Grava consultas e medidas do paciente. A gravacao exige consentimento de tratamento vigente e guarda a versao do plano em uso.",
      methods: [
        "createConsultation(patientId, entry): ClinicalEntry",
        "createMeasure(patientId, entry): ClinicalEntry",
        "hasTreatmentConsent(patientId): boolean",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "clinical.entry.create",
      title: "Gravar atendimento",
      description:
        "Use quando o usuario registrar uma consulta ou uma medida no prontuario. Nao execute sem consentimento de tratamento vigente — nesse caso a gravacao esta bloqueada.",
      http: { method: "POST", path: "/pacientes/:id/registros" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa, provisionado pelo dono da plataforma.",
      ownerOnly: true,
    },
  ],
  rules: [
    "Prontuario exige consentimento de tratamento vigente — sem ele a gravacao fica bloqueada.",
    "Planos alimentares sao versionados: o registro guarda a versao do plano vigente no momento.",
    "Consentimento de tratamento (art. 11) e de marketing (art. 7) sao separados.",
    "Dado de saude (consulta, medida, plano) nunca vai para log, URL ou telemetria.",
    "Fuso America/Sao_Paulo: a conversao local<->UTC faz duas passadas por causa do DST.",
  ],
  variants: [
    {
      id: "form",
      label: "Formulario",
      intent: "Registrar consulta ou medida com todos os campos de uma vez.",
      tradeoff: "Exige rolagem em telas pequenas.",
    },
    {
      id: "wizard",
      label: "Wizard",
      intent: "Guiar o profissional por passos, com revisao antes de gravar.",
      tradeoff: "Mais cliques para um registro simples.",
    },
    {
      id: "inline",
      label: "Linha",
      intent: "Registro rapido durante o atendimento, sem sair da tela.",
      tradeoff: "Cabem poucos campos — o resto fica para o formulario.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
  sensitive: true,
});
