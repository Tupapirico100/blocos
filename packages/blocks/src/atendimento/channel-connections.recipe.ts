import { defineBlock } from "@blocos/core";

/**
 * Conexoes de canal do consultorio — extraido de:
 *  - CRM-Nutricionista: src/core/channels/providers.ts
 *  - CRM-HOF: src/core/messaging/providers.ts
 */
export const channelConnectionsRecipe = defineBlock({
  id: "channel-connections",
  name: "Conexoes de canal",
  domain: "atendimento",
  summary:
    "Provedores de canal do consultorio (oficial, nao-oficial auto-hospedado e hospedado), com aceite de risco versionado e status da WABA.",
  origins: [
    "CRM-Nutricionista: src/core/channels/providers.ts",
    "CRM-HOF: src/core/messaging/providers.ts",
  ],
  ports: [
    {
      id: "channelRegistry",
      label: "Registro de provedores de canal",
      contract:
        "Provedores conectados ao consultorio, com o tipo (oficial, auto-hospedado, hospedado), o numero, o status da WABA e o aceite de risco versionado.",
      methods: [
        "list(): ChannelConnection[]",
        "get(id): ChannelConnection | null",
        "reconnect(id): ChannelConnection",
      ],
      connectors: ["whatsapp", "database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "channel.reconnect",
      title: "Reconectar canal",
      description:
        "Use quando o dono do consultorio pedir para reconectar ou reautorizar um canal ja cadastrado. Nao expoe segredos no bloco.",
      http: { method: "POST", path: "/canal/conexoes/:id/reconectar" },
      permissions: ["owner"],
      connectors: ["whatsapp"],
      states: ["success", "error"],
    },
  ],
  connectors: [
    {
      id: "whatsapp",
      label: "WhatsApp (Cloud API)",
      kind: "whatsapp",
      description:
        "Credenciais da Meta (token, WABA e verified phone). Apenas o dono da plataforma pode provisionar.",
      env: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
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
    "Bloco owner-only: a conexao de canal e do dono do consultorio.",
    "Provedor nao-oficial (auto-hospedado) exige aceite de risco versionado: versao, quem aceitou e quando.",
    "Provedor hospedado por terceiro e um caso de risco maior: o aceite tambem precisa estar versionado.",
    "Acesso platform (dono da plataforma) nao pode ser removido nem rebaixado pelo dono do consultorio.",
    "Credencial e segredo: nunca vai para log, URL ou telemetria.",
  ],
  variants: [
    {
      id: "cards",
      label: "Cartoes",
      intent: "Ver provedor, aceite de risco e status da WABA com detalhe por conexao.",
      tradeoff: "Com varias conexoes, exige rolagem.",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Conferir todas as conexoes do consultorio em uma linha por canal.",
      tradeoff: "O snapshot do texto de risco fica resumido a uma linha.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
  sensitive: true,
});
