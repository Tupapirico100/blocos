import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * agent-console — console do agente (Claude).
 *
 * Extraido de `CRM-Nutricionista: src/app/[locale]/agente/AgentPanel.tsx`
 * e `CRM-Nutricionista: src/core/agent/tools.ts`.
 */

export const agentToggleInput = z.object({
  enabled: z.boolean(),
});

export const agentMessageInput = z.object({
  text: z.string().min(1, "Escreva a mensagem antes de enviar."),
});

export const agentPromptUpdateInput = z.object({
  prompt: z.string().min(1, "O prompt nao pode ficar vazio."),
});

export const agentConsoleRecipe = defineBlock({
  id: "agent-console",
  name: "Console do agente",
  domain: "operacao",
  summary:
    "Conversa, prompt e allowlist de ferramentas do agente, com o controle do dono para ligar ou desligar o atendimento automatico.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/agente/AgentPanel.tsx",
    "CRM-Nutricionista: src/core/agent/tools.ts",
  ],
  ports: [
    {
      id: "agentService",
      label: "Servico do agente",
      contract:
        "Executa o agente com a allowlist de ferramentas e devolve a resposta. A tool allowlist e fixa no servidor — a interface nao amplia.",
      methods: ["run(input): AgentAnswer", "status(): AgentStatus"],
      connectors: ["anthropic"],
      mockable: true,
    },
    {
      id: "agentTools",
      label: "Allowlist de ferramentas",
      contract:
        "As quatro ferramentas autorizadas: buscar agenda, oferecer slots, registrar atendimento e consultar lead. Qualquer outra chamada e recusada.",
      methods: ["list(): AgentTool[]", "isAllowed(toolId): boolean"],
      connectors: [],
      mockable: true,
    },
    {
      id: "agentConversations",
      label: "Conversas do agente",
      contract: "Historico de mensagens por canal. Guarda a conversa, nunca dado de saude.",
      methods: ["list(conversationId): AgentMessage[]", "append(conversationId, message): AgentMessage"],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "agentPromptRepository",
      label: "Prompt versionado",
      contract: "Prompt atual e versao. Alterar exige o dono da plataforma e grava a nova versao.",
      methods: ["get(): { prompt: string; version: number }", "update(prompt): { prompt: string; version: number }"],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "agent.toggle",
      title: "Ligar ou desligar o agente",
      description:
        "Use quando o dono da plataforma quiser ativar ou pausar o atendimento automatico. Desligar mantem prompt, historico e allowlist.",
      input: agentToggleInput,
      http: { method: "PATCH", path: "/agente/status" },
      permissions: ["platform_owner"],
      connectors: ["anthropic"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "agent.message",
      title: "Enviar mensagem ao agente",
      description:
        "Use para simular uma conversa e conferir o comportamento do agente antes de ligar o atendimento automatico.",
      input: agentMessageInput,
      permissions: ["platform_owner", "owner"],
      connectors: ["anthropic"],
      states: ["success", "error"],
    },
    {
      id: "agent.prompt.update",
      title: "Atualizar o prompt do agente",
      description:
        "Use quando o dono da plataforma quiser mudar a instrucao do agente. A mudanca cria uma nova versao do prompt e vale para as conversas seguintes.",
      input: agentPromptUpdateInput,
      http: { method: "PUT", path: "/agente/prompt" },
      permissions: ["platform_owner"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "anthropic",
      label: "Anthropic (Claude)",
      kind: "llm",
      description: "Modelo que executa o agente do consultorio.",
      env: ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"],
      howTo:
        "Crie a chave no painel da Anthropic e cadastre no cofre da plataforma. A chave nunca aparece no console.",
      ownerOnly: true,
      riskVersion: "v1",
    },
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Guarda prompt versionado, conversas e configuracao do agente.",
      env: ["DATABASE_URL"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Allowlist fixa de 4 ferramentas: buscar agenda, oferecer slots, registrar atendimento e consultar lead.",
    "O agente so responde a quem esta na lista de permitidos (Regra 11) e dentro da janela de 24h.",
    "O agente comeca desligado; quem liga e desliga e o dono da plataforma.",
    "Prompt e versionado: mudanca grava nova versao e vale para as conversas seguintes.",
    "O agente nao registra dado de saude — apenas agendamento, atendimento e lead.",
    "A chave da Anthropic nunca e exibida: a interface so mostra o nome da variavel de ambiente.",
  ],
  variants: [
    {
      id: "chat",
      label: "Conversa",
      intent: "Testar o agente como se fosse um paciente",
      tradeoff: "Nao mostra o prompt em edicao",
    },
    {
      id: "cards",
      label: "Cartoes",
      intent: "Revisar capacidades, prompt e o controle do dono",
      tradeoff: "Nao permite simular uma conversa",
    },
    {
      id: "logs",
      label: "Logs",
      intent: "Auditar as execucoes recentes do agente",
      tradeoff: "Nao mostra a conversa completa",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden", "not-provisioned"],
  sensitive: true,
});
