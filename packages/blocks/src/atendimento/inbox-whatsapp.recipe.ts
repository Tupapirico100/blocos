import { defineBlock } from "@blocos/core";

/**
 * Caixa de entrada do WhatsApp — extraido de:
 *  - CRM-Nutricionista: src/app/[locale]/canal/page.tsx
 *  - CRM-HOF: src/app/[locale]/canal/page.tsx
 */
export const inboxWhatsappRecipe = defineBlock({
  id: "inbox-whatsapp",
  name: "Caixa de entrada do WhatsApp",
  domain: "atendimento",
  summary:
    "Conversas do WhatsApp com janela de 24h, lista de permitidos, resposta rapida e envio de template.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/canal/page.tsx",
    "CRM-HOF: src/app/[locale]/canal/page.tsx",
  ],
  ports: [
    {
      id: "messagingGateway",
      label: "Gateway de mensagens",
      contract:
        "Leitura das conversas do numero do consultorio e envio de mensagem livre ou template aprovado pela Cloud API.",
      methods: [
        "listConversations(cursor): Conversation[]",
        "listMessages(conversationId, cursor): ChatMessage[]",
        "sendText(conversationId, body): ChatMessage",
        "sendTemplate(conversationId, templateId): ChatMessage",
      ],
      connectors: ["whatsapp"],
      mockable: true,
    },
    {
      id: "allowedContactsRepository",
      label: "Lista de permitidos",
      contract:
        "Numeros liberados para receber atendimento. Quem inicia o contato entra na lista automaticamente.",
      methods: ["isAllowed(phone): boolean", "allow(phone): AllowedContact", "list(): AllowedContact[]"],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "message.send",
      title: "Enviar mensagem",
      description:
        "Use para responder dentro da janela de 24h, a um contato que esteja na lista de permitidos. Fora da janela, use message.template.",
      http: { method: "POST", path: "/canal/mensagens" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["whatsapp", "database"],
      states: ["success", "error"],
    },
    {
      id: "message.template",
      title: "Enviar template aprovado",
      description:
        "Use para falar com o contato fora da janela de 24h ou quando a mensagem exigir um template aprovado pela Meta.",
      http: { method: "POST", path: "/canal/templates" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["whatsapp"],
      states: ["success", "error"],
    },
    {
      id: "lead.allow",
      title: "Liberar contato",
      description:
        "Use quando o usuario liberar um contato para a lista de permitidos. Regra 11: so respondemos quem esta na lista.",
      http: { method: "POST", path: "/canal/permitidos" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["database"],
      states: ["success", "error"],
    },
  ],
  connectors: [
    {
      id: "whatsapp",
      label: "WhatsApp (Cloud API)",
      kind: "whatsapp",
      description:
        "Numero do WhatsApp do consultorio provisionado pela Meta. Apenas o dono da plataforma configura credenciais.",
      ownerOnly: true,
      riskVersion: "whatsapp-oficial-2025-01",
    },
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa, provisionado pelo dono da plataforma.",
      ownerOnly: true,
    },
  ],
  rules: [
    "Regra 11: so respondemos quem esta na lista de permitidos; quem inicia o contato entra na lista automaticamente.",
    "Janela de 24h: mensagem livre so dentro de 24h apos o cliente escrever. Fora disso, so template aprovado.",
    "A Fila de eventos da Meta usa chave deterministica (dedup) e nunca leva dado de saude.",
    "Todo mundo que fala com o paciente e employee: nao existe papel de 'atendente' separado.",
  ],
  variants: [
    {
      id: "split",
      label: "Dividido",
      intent: "Lista de conversas e painel do chat lado a lado, para triagem em tela grande.",
      tradeoff: "Ocupar mais largura de tela.",
    },
    {
      id: "stacked",
      label: "Empilhado",
      intent: "Lista acima e chat abaixo, para telas estreitas ou janelas laterais.",
      tradeoff: "A lista mostra menos conversas por vez.",
    },
    {
      id: "focus",
      label: "Foco",
      intent: "So a conversa ativa, para o atendente ja entrar respondendo.",
      tradeoff: "Perde a visao geral das outras conversas.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
