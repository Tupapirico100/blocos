import { defineAction, defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * Receita do bloco "finance-overview" (CRM-Nutricionista).
 *
 * Dinheiro em centavos; a taxa de comparecimento vem do status da agenda.
 */

export const financeOverviewRecipe = defineBlock({
  id: "finance-overview",
  name: "Visao financeira",
  domain: "financeiro",
  summary: "Receita do mes, ticket medio e taxa de comparecimento em centavos, no formato BRL.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/financeiro/page.tsx",
    "CRM-Nutricionista: src/core/services/finance.ts",
  ],
  ports: [
    {
      id: "financeRepository",
      label: "Repositorio financeiro",
      contract: "Receita por dia e por pacote, com valores em centavos.",
      methods: [
        "revenueByDay(month): FinanceDayEntry[]",
        "revenueByPackage(month): FinancePackageRow[]",
        "summary(month): FinanceSummary",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "attendanceRepository",
      label: "Repositorio de comparecimento",
      contract: "Conta sessoes agendadas e comparecidas no mes, pelo status da agenda.",
      methods: ["attendanceRate(month): number", "scheduledSessions(month): number"],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    defineAction({
      id: "finance.export",
      title: "Exportar visao financeira",
      description:
        "Exporta o resumo financeiro do mes em CSV. Use quando o responsavel pedir a planilha do periodo.",
      input: z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/),
        format: z.enum(["csv", "xlsx"]).optional(),
      }),
      http: { method: "GET", path: "/financeiro/export" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa (pagamentos e atendimentos).",
      ownerOnly: true,
    },
  ],
  rules: [
    "Dinheiro em centavos, sempre: nunca ponto flutuante. A formatacao em BRL acontece so na borda (UI).",
    "A taxa de comparecimento vem do status da agenda (compareceu x sessoes agendadas).",
    "Estorno devolve o lead e nao soma receita.",
    "O resumo nao carrega dado de saude: apenas valor, quantidade e status.",
    "O dono da plataforma tem acesso total ao consultorio; o dono do consultorio opera o operacional.",
  ],
  defaultVariant: "chart",
  variants: [
    {
      id: "cards",
      label: "Cards",
      intent: "Leitura rapida dos indicadores do mes.",
      tradeoff: "Nao mostra a evolucao dia a dia.",
    },
    {
      id: "chart",
      label: "Grafico",
      intent: "Ver a receita por dia e comparar com a taxa de comparecimento.",
      tradeoff: "Com muitos dias, as barras ficam finas.",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Conferir dia a dia e pacote a pacote.",
      tradeoff: "Perde a visao de tendencia.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
