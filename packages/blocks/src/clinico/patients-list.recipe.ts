import { defineBlock } from "@blocos/core";

/**
 * Lista de pacientes — extraido de:
 *  - CRM-Nutricionista: src/app/[locale]/pacientes/page.tsx
 *  - CRM-HOF: src/app/[locale]/patients/page.tsx
 */
export const patientsListRecipe = defineBlock({
  id: "patients-list",
  name: "Lista de pacientes",
  domain: "clinico",
  summary:
    "Pacientes do consultorio com busca por nome, contato, situacao do consentimento de tratamento e ultima consulta.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/pacientes/page.tsx",
    "CRM-HOF: src/app/[locale]/patients/page.tsx",
  ],
  ports: [
    {
      id: "patientsRepository",
      label: "Repositorio de pacientes",
      contract:
        "Pacientes do consultorio com contato, situacao do consentimento de tratamento e data da ultima consulta. Paginado por cursor.",
      methods: [
        "list(cursor, query): PatientSummary[]",
        "findByName(query): PatientSummary[]",
        "get(id): PatientSummary | null",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "patient.open",
      title: "Abrir paciente",
      description:
        "Use quando o usuario abrir um paciente a partir da lista para ver o prontuario. Nao carrega dado de saude na URL.",
      http: { method: "GET", path: "/pacientes/:id" },
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
    "Prontuario exige consentimento de tratamento vigente — a lista sinaliza quem nao pode ter gravacao.",
    "Consentimento de tratamento e de marketing sao separados.",
    "Dado de saude (consulta, medida, plano) nunca vai para log, URL ou telemetria.",
    "Todo mundo que fala com o paciente e employee; o dono do consultorio opera o operacional.",
  ],
  defaultVariant: "table",
  variants: [
    {
      id: "table",
      label: "Tabela",
      intent: "Lista densa para conferir muitos pacientes com busca por nome.",
      tradeoff: "Consome mais largura de tela.",
    },
    {
      id: "cards",
      label: "Cartoes",
      intent: "Ler paciente a paciente, com destaque para o consentimento.",
      tradeoff: "Mostra menos pacientes por tela.",
    },
    {
      id: "grid",
      label: "Grade",
      intent: "Panorama rapido do carteiramento, com acao de abrir em um clique.",
      tradeoff: "Cada paciente mostra apenas o essencial.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
