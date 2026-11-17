import { defineBlock } from "@blocos/core";

/**
 * Quadro de leads — extraido de:
 *  - CRM-Nutricionista: src/app/[locale]/leads/page.tsx
 *  - CRM-Nutricionista: src/app/[locale]/leads/KanbanBoard.tsx
 *  - CRM-HOF: src/app/[locale]/leads/page.tsx
 */
export const leadsBoardRecipe = defineBlock({
  id: "leads-board",
  name: "Quadro de leads",
  domain: "atendimento",
  summary:
    "Leads por etapa, com atribuicao do primeiro toque, etiqueta de origem e movimento de etapa.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/leads/page.tsx",
    "CRM-Nutricionista: src/app/[locale]/leads/KanbanBoard.tsx",
    "CRM-HOF: src/app/[locale]/leads/page.tsx",
  ],
  ports: [
    {
      id: "leadsRepository",
      label: "Repositorio de leads",
      contract:
        "Leads do consultorio com origem do PRIMEIRO toque, paginacao por cursor e valor em centavos.",
      methods: [
        "listByStage(stage, cursor): Lead[]",
        "listByFirstTouch(cursor): Lead[]",
        "moveStage(id, stage): Lead",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "lead.move",
      title: "Mover lead",
      description:
        "Use quando o usuario mover um lead de etapa (botao mover no quadro ou na tabela). Move apenas entre new, qualified e customer.",
      http: { method: "POST", path: "/leads/:id/stage" },
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
    "Estagio fixo de lead: new -> qualified -> customer.",
    "A origem do lead e a do PRIMEIRO toque, nao a do ultimo clique.",
    "Relatorio por origem conta PESSOAS; por anuncio conta CLIQUES.",
    "Dinheiro sempre em centavos; estorno devolve o lead para a etapa anterior.",
    "Todo mundo que fala com o paciente e employee: o entry point do agente e unico por consultorio.",
  ],
  variants: [
    {
      id: "board",
      label: "Quadro",
      intent: "Trabalho visual por etapa, com o lead arrastavel entre colunas.",
      tradeoff: "Mostra poucos leads por vez.",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Lista densa para volume alto de leads.",
      tradeoff: "Perde a leitura visual do funil.",
    },
    {
      id: "timeline",
      label: "Timeline",
      intent: "Ver a ordem cronologica do primeiro toque e a atribuicao.",
      tradeoff: "Nao move lead de etapa.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
