import { defineBlock } from "@blocos/core";

/**
 * Consentimentos do paciente — extraido de:
 *  - CRM-Nutricionista: src/app/[locale]/pacientes/[id]/consentimentos/ConsentPanel.tsx
 *  - CRM-HOF: src/app/[locale]/patients/[id]/consents/page.tsx
 */
export const consentPanelRecipe = defineBlock({
  id: "consent-panel",
  name: "Painel de consentimentos",
  domain: "atendimento",
  summary:
    "Consentimentos de tratamento e marketing do paciente, com versao do texto aceito, canal e data da concessao.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/pacientes/[id]/consentimentos/ConsentPanel.tsx",
    "CRM-HOF: src/app/[locale]/patients/[id]/consents/page.tsx",
  ],
  ports: [
    {
      id: "consentsRepository",
      label: "Repositorio de consentimentos",
      contract:
        "Concessoes e revogacoes por paciente, com snapshot do texto aceito, versao do texto e canal.",
      methods: [
        "listByPatient(patientId): ConsentRecord[]",
        "latest(patientId, kind): ConsentRecord | null",
        "grant(patientId, kind, textVersion, channel): ConsentRecord",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "consent.grant",
      title: "Registrar consentimento",
      description:
        "Use para registrar a concessao de tratamento ou marketing. Registre apenas o texto vigente do consultorio: o registro guarda um snapshot do texto aceito.",
      http: { method: "POST", path: "/pacientes/:id/consentimentos" },
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
    "Consentimento de tratamento (art. 11) e de marketing (art. 7) sao separados: um nao substitui o outro.",
    "O registro guarda um snapshot do texto aceito, com a versao vigente do consultorio.",
    "Prontuario exige consentimento de tratamento vigente — nao da para gravar sem.",
    "Consentimento e dado sensivel: nunca vai para log, URL ou telemetria.",
  ],
  emptyAction: { id: "consent.grant", label: "Registrar consentimento" },
  defaultVariant: "table",
  variants: [
    {
      id: "cards",
      label: "Cartoes",
      intent: "Dois cartoes independentes, um por tipo de consentimento, com a situacao atual.",
      tradeoff: "Mostra o texto aceito em resumo, sem historico.",
    },
    {
      id: "timeline",
      label: "Timeline",
      intent: "Linha do tempo das concessoes e revogacoes.",
      tradeoff: "Difícil comparar os dois tipos lado a lado.",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Lista densa para conferir canal, versao e data de cada concessao.",
      tradeoff: "Perde o destaque da situacao vigente.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
