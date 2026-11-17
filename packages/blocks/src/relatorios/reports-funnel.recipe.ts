import { defineAction, defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * Receita do bloco "reports-funnel" (CRM-Nutricionista).
 *
 * Regra herdada: lead = pessoa, clique = toque. Relatorio por origem conta
 * PESSOAS; por anuncio conta CLIQUES. A origem e a do primeiro toque.
 */

export const reportsFunnelRecipe = defineBlock({
  id: "reports-funnel",
  name: "Funil de conversao",
  domain: "relatorios",
  summary: "Funil new -> qualified -> customer contando PESSOAS, com origem atribuida pelo primeiro toque.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/relatorios/page.tsx",
    "CRM-Nutricionista: src/core/services/reports.ts",
  ],
  ports: [
    {
      id: "reportsRepository",
      label: "Repositorio de relatorios",
      contract: "Contagem de pessoas por etapa e por origem no periodo.",
      methods: [
        "funnel(from, to): FunnelStage[]",
        "peopleBySource(from, to): FunnelSourceRow[]",
        "clicksBySource(from, to): { source: string; clicks: number }[]",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "exportService",
      label: "Servico de exportacao",
      contract: "Gera o relatorio em CSV/XLSX sem dados de saude.",
      methods: ["export(report, params): Buffer"],
      connectors: ["storage"],
      mockable: true,
    },
  ],
  actions: [
    defineAction({
      id: "report.export",
      title: "Exportar relatorio",
      description:
        "Exporta o funil de conversao do periodo. Use quando o responsavel pedir os numeros por etapa ou por origem; a exportacao conta PESSOAS, nao cliques.",
      input: z.object({
        report: z.string().min(1),
        from: z.string().min(8),
        to: z.string().min(8),
        format: z.enum(["csv", "xlsx", "pdf"]).optional(),
        unit: z.enum(["people", "clicks"]).optional(),
      }),
      http: { method: "GET", path: "/relatorios/export" },
      permissions: ["owner"],
      connectors: ["storage"],
      states: ["success", "error", "forbidden"],
    }),
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa (leads, touches e eventos).",
      ownerOnly: true,
    },
    {
      id: "storage",
      label: "Storage",
      kind: "storage",
      description: "Guarda o arquivo exportado para download.",
      ownerOnly: true,
    },
  ],
  rules: [
    "Lead = pessoa; clique = toque. Relatorio por origem conta PESSOAS; por anuncio conta CLIQUES.",
    "Atribuicao do primeiro toque: a origem de um lead e a do primeiro contato, nao a ultima.",
    "Estagio fixo de lead: new -> qualified -> customer.",
    "Estorno devolve o lead: o paciente volta para a etapa new e o funil reflete isso.",
    "O relatorio nao expoe dado de saude: contagens e origens, nunca conteudo de atendimento.",
  ],
  variants: [
    {
      id: "funnel",
      label: "Funil",
      intent: "Ler a queda entre as etapas e a taxa de conversao.",
      tradeoff: "Com muitas origens, o grafico perde o detalhe.",
    },
    {
      id: "cards",
      label: "Cards",
      intent: "Mostrar o numero de pessoas por etapa.",
      tradeoff: "Perde a leitura proporcional entre as etapas.",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Conferir os numeros exatos por etapa e por origem.",
      tradeoff: "Exige leitura ativa para ver a tendencia.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
