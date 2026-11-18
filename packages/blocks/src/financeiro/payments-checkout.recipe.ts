import { defineAction, defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * Receita do bloco "payments-checkout" (CRM-HOF).
 *
 * Regra herdada: dinheiro em centavos e estorno devolve o lead.
 */

export const paymentsCheckoutRecipe = defineBlock({
  id: "payments-checkout",
  name: "Pagamento e recibo",
  domain: "financeiro",
  summary: "Registra pagamento, emite o recibo do paciente e controla o estorno que devolve o lead.",
  origins: [
    "CRM-HOF: src/app/[locale]/payments/new/page.tsx",
    "CRM-HOF: src/app/[locale]/receipts/[acceptanceId]/page.tsx",
  ],
  ports: [
    {
      id: "paymentsRepository",
      label: "Repositorio de pagamentos",
      contract: "Pagamentos do consultorio com valor em centavos, forma de pagamento e situacao.",
      methods: [
        "create(input): Payment",
        "findById(id): Payment",
        "refund(id, reason): Payment",
        "listReceipts(officeId, from, to): Payment[]",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "receiptService",
      label: "Servico de recibo",
      contract: "Gera o recibo em PDF/HTML a partir do pagamento aceito.",
      methods: ["render(receiptId): Buffer", "printUrl(receiptId): string"],
      connectors: ["pdf", "database"],
      mockable: true,
    },
    {
      id: "leadService",
      label: "Servico de leads",
      contract: "Devolve o lead para a etapa new quando o pagamento e estornado.",
      methods: ["moveStage(leadId, stage): Lead", "findById(leadId): Lead"],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    defineAction({
      id: "payment.create",
      title: "Registrar pagamento",
      description:
        "Grava o pagamento aceito e emite o recibo. Use quando a forma de pagamento for confirmada; o valor entra em centavos.",
      input: z.object({
        patientName: z.string().optional(),
        packageId: z.string().optional(),
        packageName: z.string().optional(),
        methodId: z.string().min(1),
        amountCents: z.number().int().min(0),
      }),
      http: { method: "POST", path: "/payments" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
    defineAction({
      id: "payment.receipt",
      title: "Emitir recibo",
      description:
        "Gera o recibo do pagamento para imprimir ou baixar em PDF. Use quando o paciente pedir o comprovante.",
      input: z.object({
        id: z.string().min(1),
        format: z.enum(["print", "pdf"]),
      }),
      http: { method: "POST", path: "/payments/:id/receipt" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["pdf", "database"],
      states: ["success", "error"],
    }),
    defineAction({
      id: "payment.refund",
      title: "Estornar pagamento",
      description:
        "Estorna o valor e DEVOLVE O LEAD para a etapa new do funil. Use quando houver cancelamento, chargeback ou promessa nao cumprida — o estorno nunca acontece sozinho.",
      input: z.object({
        id: z.string().min(1),
        amountCents: z.number().int().min(0),
        reason: z.string().min(1),
        returnLead: z.literal(true),
        leadId: z.string().optional(),
      }),
      http: { method: "POST", path: "/payments/:id/refund" },
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
      description: "Postgres do programa (pagamentos, recibos e leads).",
      ownerOnly: true,
    },
    {
      id: "pdf",
      label: "Gerador de PDF",
      kind: "api",
      description: "Renderiza o recibo do paciente.",
      ownerOnly: true,
    },
  ],
  rules: [
    "Dinheiro em centavos, sempre: nunca ponto flutuante. A formatacao em BRL acontece so na borda (UI).",
    "Estorno devolve o lead: o lead volta para a etapa new do funil.",
    "Estagio fixo de lead: new -> qualified -> customer.",
    "Regra 11: so respondemos a quem esta na lista de permitidos.",
    "O recibo carrega nome e valor, nunca dado de saude.",
  ],
  emptyAction: { id: "payment.create", label: "Novo pagamento" },
  defaultVariant: "form",
  variants: [
    {
      id: "form",
      label: "Formulario",
      intent: "Registrar um pagamento novo com o minimo de atrito.",
      tradeoff: "Nao mostra o recibo gerado no mesmo passo.",
    },
    {
      id: "receipt",
      label: "Recibo",
      intent: "Conferir, imprimir ou baixar o recibo de um pagamento existente.",
      tradeoff: "Assume que o pagamento ja foi registrado.",
    },
    {
      id: "split",
      label: "Split",
      intent: "Registrar e conferir o recibo lado a lado.",
      tradeoff: "Usa mais espaco na tela.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
