import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * social-automations — regras de resposta automatica (gatilho -> acao).
 *
 * Extraido de `Agendador-Instagram: src/app/(app)/automations/page.tsx`
 * e `Agendador-Instagram: src/lib/automations/handle.ts`.
 */

export const automationToggleInput = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export const socialAutomationsRecipe = defineBlock({
  id: "social-automations",
  name: "Automacoes de resposta",
  domain: "social",
  summary:
    "Regras que ligam um gatilho (comentario, palavra-chave ou mencao) a uma acao (responder, marcar ou agendar), com liga/desliga por regra.",
  origins: [
    "Agendador-Instagram: src/app/(app)/automations/page.tsx",
    "Agendador-Instagram: src/lib/automations/handle.ts",
  ],
  ports: [
    {
      id: "automationsRepository",
      label: "Repositorio de automacoes",
      contract: "CRUD das regras por conta. Uma regra por (conta, gatilho).",
      methods: [
        "listByAccount(accountId): SocialAutomation[]",
        "toggle(id, active): SocialAutomation",
        "upsert(rule): SocialAutomation",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "automationRunner",
      label: "Executor de automacoes",
      contract:
        "Avalia o gatilho e aplica a acao. Retorna contagem de execucoes; nunca guarda a mensagem original do paciente.",
      methods: ["evaluate(accountId, event): AutomationResult | null"],
      connectors: ["instagram"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "automation.toggle",
      title: "Ligar ou desligar automacao",
      description:
        "Use quando o usuario quiser ativar ou pausar uma regra de resposta automatica. Desligar mantem a regra guardada e apenas impede novas respostas.",
      input: automationToggleInput,
      http: { method: "PATCH", path: "/social/automations/:id" },
      permissions: ["owner", "nutritionist", "receptionist"],
      connectors: [],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "instagram",
      label: "Instagram Graph API",
      kind: "api",
      description: "De onde vem o evento (comentario, mencao) que dispara a regra.",
      env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],
      ownerOnly: true,
    },
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Guarda as regras e a contagem de execucoes.",
      env: ["DATABASE_URL"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Regra 11: so respondemos a quem esta na lista de permitidos — a automacao nunca inicia conversa nova.",
    "Janela de 24h: fora da janela, somente template aprovado.",
    "Marcar cria LEAD, nao paciente: a automacao nao grava dado de saude.",
    "Uma regra por conta e gatilho; quando duas regras casam, vence a mais especifica.",
    "Regra desativada e preservada: religar nao perde historico de execucoes.",
    "O texto exato do comentario do paciente nao e persistido — a execucao guarda apenas contadores.",
  ],
  defaultVariant: "flow",
  variants: [
    {
      id: "list",
      label: "Lista",
      intent: "Conferir muitas regras em tabela",
      tradeoff: "O valor do gatilho e da acao fica truncado",
    },
    {
      id: "cards",
      label: "Cartoes",
      intent: "Ler cada regra inteira, com contexto",
      tradeoff: "Mostra menos regras por tela",
    },
    {
      id: "flow",
      label: "Fluxo",
      intent: "Entender o encadeamento gatilho -> acao",
      tradeoff: "Nao mostra o historico de execucoes em detalhe",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
