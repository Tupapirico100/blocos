import { defineBlock } from "@blocos/core";

/**
 * Prontuario do paciente — extraido de:
 *  - CRM-Nutricionista: src/app/[locale]/pacientes/[id]/ClinicalHistory.tsx
 *  - CRM-HOF: src/app/[locale]/patients/[id]/page.tsx
 */
export const patientChartRecipe = defineBlock({
  id: "patient-chart",
  name: "Prontuario do paciente",
  domain: "clinico",
  summary:
    "Evolucao do paciente em linha do tempo, com serie de medidas, versao vigente do plano alimentar e aviso de gravacao bloqueada sem consentimento.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/pacientes/[id]/ClinicalHistory.tsx",
    "CRM-HOF: src/app/[locale]/patients/[id]/page.tsx",
  ],
  ports: [
    {
      id: "chartRepository",
      label: "Repositorio de prontuario",
      contract:
        "Consultas, medidas e plano alimentar do paciente. Planos e consentimentos sao versionados; a leitura devolve a versao vigente.",
      methods: [
        "listConsultations(patientId): ChartConsultation[]",
        "listMeasures(patientId): ChartMeasure[]",
        "getActivePlan(patientId): MealPlanVersion | null",
        "getTreatmentConsent(patientId): ConsentSnapshot | null",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "patient.chart.open",
      title: "Abrir prontuario",
      description:
        "Use quando o usuario abrir o prontuario completo do paciente a partir deste bloco. Nao expoe dado de saude em URL ou log.",
      http: { method: "GET", path: "/pacientes/:id/prontuario" },
      readOnly: true,
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["database"],
      states: ["success", "error"],
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
    "Prontuario exige consentimento de tratamento vigente — sem ele, a gravacao fica bloqueada.",
    "Planos alimentares sao versionados: a versao ativa e a que vale; as anteriores sao apenas historico.",
    "Consentimento de tratamento (art. 11) e de marketing (art. 7) sao separados.",
    "NUNCA renderizar dado de saude (consulta, medida, plano) em log, URL ou telemetria.",
    "Dinheiro sempre em centavos.",
  ],
  variants: [
    {
      id: "timeline",
      label: "Timeline",
      intent: "Ler a evolucao do paciente em ordem cronologica.",
      tradeoff: "Fica ruim para comparar series de medidas.",
    },
    {
      id: "sections",
      label: "Blocos",
      intent: "Consultas, medidas, plano e financeiro lado a lado na mesma tela.",
      tradeoff: "Exige rolagem para ver tudo.",
    },
    {
      id: "tabs",
      label: "Abas",
      intent: "Focar uma secao por vez, com o prontuario sempre em uma aba so.",
      tradeoff: "Troca de aba para comparar secoes.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
  sensitive: true,
});
