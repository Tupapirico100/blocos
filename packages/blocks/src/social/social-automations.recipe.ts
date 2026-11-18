import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * social-automations — automacoes de resposta (comentario/direct -> direct).
 *
 * Extraido de `Agendador-Instagram: src/app/(app)/automations/page.tsx`,
 * `src/lib/automations/{handle,stats,message}.ts`.
 * O formulario de criacao fica no app (passos numerados + grade de posts).
 */

export const automationToggleInput = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});

export const automationDeleteInput = z.object({
  id: z.string().uuid(),
});

export const socialAutomationsRecipe = defineBlock({
  id: "social-automations",
  name: "Automações de resposta",
  domain: "social",
  summary:
    "Automações que respondem no direct quem comenta uma palavra-chave (ou escreve no direct), com palavras de exclusão, respostas públicas em rodízio, números por automação e pausar/excluir.",
  origins: [
    "Agendador-Instagram: src/app/(app)/automations/page.tsx",
    "Agendador-Instagram: src/lib/automations/handle.ts",
    "Agendador-Instagram: src/lib/automations/stats.ts",
  ],
  ports: [
    {
      id: "automationsRepository",
      label: "Automações",
      contract: "Automações por conta, com contadores agregados de automation_logs (casaram, enviadas, ignoradas, erro).",
      methods: ["list(): SocialAutomation[]", "setActive(id, active): void", "remove(id): void"],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "automation.toggle",
      title: "Pausar ou ativar automação",
      description: "Use quando o usuario pedir para pausar ou religar uma automação. Pausada, ela nao responde ninguem; os registros ficam.",
      input: automationToggleInput,
      http: { method: "POST", path: "/automations/:id/active" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "automation.delete",
      title: "Excluir automação",
      description: "Use quando o usuario confirmar a exclusao de uma automação. Sempre passa por confirmacao.",
      input: automationDeleteInput,
      http: { method: "DELETE", path: "/automations/:id" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "automation.create",
      title: "Nova automação",
      description: "Use quando o usuario quiser criar uma automação: leva ao formulario de criacao do app.",
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success"],
    },
  ],
  connectors: [
    { id: "database", label: "Banco de dados", kind: "database", description: "Postgres (Supabase), so a service role.", ownerOnly: true },
  ],
  rules: [
    "Cada pessoa recebe a mesma automação uma vez so (as repetições contam como 'já tinham recebido').",
    "Só 1 resposta privada por comentário (regra da Meta): com várias automações valendo, ganha a do post específico, depois a mais antiga.",
    "Palavras de exclusão deixam o comentário para resposta pessoal.",
    "Várias respostas públicas são sorteadas a cada comentário (respostas sempre iguais a Meta marca como spam).",
    "Excluir sempre pede confirmação; pausar é reversível.",
  ],
  emptyAction: { id: "automation.create", label: "Nova automação" },
  defaultVariant: "flow",
  variants: [
    {
      id: "list",
      label: "Lista",
      intent: "Conferir muitas automações em pouco espaço",
      tradeoff: "Não mostra o texto do direct",
    },
    {
      id: "cards",
      label: "Cartões",
      intent: "Ler cada automação inteira, com o direct",
      tradeoff: "Mostra menos automações por tela",
    },
    {
      id: "flow",
      label: "Fluxo",
      intent: "Ver o caminho: quem comenta, o que recebe no direct e a resposta pública",
      tradeoff: "Ocupa mais altura",
    },
  ],
  states: ["loading", "success", "empty", "error"],
});
