import { defineAction, defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * Receita do bloco "packages-pricing" (CRM-HOF).
 *
 * Dinheiro em centavos, sempre. Formato em BRL na borda (UI).
 */

export const packagesPricingRecipe = defineBlock({
  id: "packages-pricing",
  name: "Pacotes e precos",
  domain: "financeiro",
  summary: "Pacotes de atendimento com preco em centavos, numero de sessoes, validade e situacao.",
  origins: [
    "CRM-HOF: src/app/[locale]/packages/page.tsx",
    "CRM-HOF: src/app/[locale]/service-packages/page.tsx",
  ],
  ports: [
    {
      id: "packagesRepository",
      label: "Repositorio de pacotes",
      contract: "Pacotes do consultorio com preco em centavos, sessoes e validade.",
      methods: [
        "list(officeId): ServicePackage[]",
        "save(pkg): ServicePackage",
        "setActive(id, active): ServicePackage",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "billingService",
      label: "Servico de cobranca",
      contract: "Calcula parcelas e vincula a compra a um lead.",
      methods: ["quote(packageId, installments): Quote", "charge(quote): Payment"],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    defineAction({
      id: "package.save",
      title: "Salvar pacote",
      description:
        "Cria ou atualiza um pacote de atendimento. Use quando o responsavel definir preco (em centavos), numero de sessoes e validade.",
      input: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        priceCents: z.number().int().min(0),
        sessions: z.number().int().min(1),
        validDays: z.number().int().min(0).optional(),
        active: z.boolean().optional(),
      }),
      http: { method: "PUT", path: "/packages/:id" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
    defineAction({
      id: "package.toggleActive",
      title: "Ativar ou desativar pacote",
      description:
        "Liga ou desliga a oferta de um pacote. Use quando o pacote deixa de ser vendido, sem apagar o historico.",
      input: z.object({
        id: z.string().min(1),
        active: z.boolean(),
      }),
      http: { method: "PATCH", path: "/packages/:id/status" },
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
      description: "Postgres do programa (pacotes, precos e vendas).",
      ownerOnly: true,
    },
  ],
  rules: [
    "Dinheiro em centavos, sempre: nunca ponto flutuante. A formatacao em BRL acontece so na borda (UI).",
    "Pacote inativo continua no historico de vendas — desativar nao apaga.",
    "Estorno devolve o lead: o pacote comprado entra na mesma regra de estorno do pagamento.",
    "O preco do pacote nao carrega dado de saude em log, URL ou telemetria.",
  ],
  emptyAction: { id: "package.save", label: "Novo pacote" },
  defaultVariant: "cards",
  variants: [
    {
      id: "cards",
      label: "Cards",
      intent: "Comparar pacotes lado a lado com destaque para o preco.",
      tradeoff: "Fica rolavel quando ha muitos pacotes.",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Lista densa para operar varios pacotes de uma vez.",
      tradeoff: "O preco perde o destaque visual.",
    },
    {
      id: "split",
      label: "Split",
      intent: "Lista a esquerda e detalhe do pacote selecionado a direita.",
      tradeoff: "Exige um clique para ver os detalhes.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
