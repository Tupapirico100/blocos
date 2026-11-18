import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * integration-manifest — manifesto de conexoes do programa.
 *
 * Este e o UNICO lugar onde um conector e provisionado, e so o dono da
 * plataforma pode fazer isso.
 *
 * Extraido de `CRM-Nutricionista: src/app/[locale]/admin/page.tsx`
 * e `CRM-HOF: src/lib/env.ts`.
 */

export const connectorProvisionInput = z.object({
  connectorId: z.enum([
    "whatsapp",
    "anthropic",
    "instagram",
    "meta_ads",
    "webhooks",
    "storage",
    "email",
    "pdf",
    "database",
  ]),
});

export const integrationManifestRecipe = defineBlock({
  id: "integration-manifest",
  name: "Manifesto de conexoes",
  domain: "operacao",
  summary:
    "Todos os conectores do programa, com status, quem pode provisionar, as variaveis de ambiente esperadas (nome) e o que cada um destrava.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/admin/page.tsx",
    "CRM-HOF: src/lib/env.ts",
  ],
  ports: [
    {
      id: "connectorRegistry",
      label: "Registro de conectores",
      contract:
        "Lista os conectores do programa com status, quem pode provisionar e as variaveis esperadas. Devolve apenas NOMES de variavel — nenhum valor.",
      methods: ["list(): ManifestConnector[]", "provision(connectorId): ConnectorState"],
      connectors: [],
      mockable: true,
    },
    {
      id: "envCatalog",
      label: "Catalogo de variaveis de ambiente",
      contract:
        "Para cada conector, os nomes das variaveis que o runtime le do cofre. Nunca devolve o valor de nenhuma delas.",
      methods: ["expected(connectorId): string[]"],
      connectors: [],
      mockable: true,
    },
    {
      id: "connectorProvisioner",
      label: "Provisionador de conectores",
      contract:
        "Executa o provisionamento no cofre do dono da plataforma. Recusa qualquer ator que nao seja o dono da plataforma.",
      methods: ["provision(connectorId, actor): ConnectorState"],
      connectors: ["database", "storage", "whatsapp", "anthropic", "instagram", "meta_ads", "webhooks", "email", "pdf"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "connector.provision",
      title: "Provisionar conector",
      description:
        "Use quando o dono da plataforma quiser ativar uma conexao do programa (WhatsApp, Anthropic, Instagram, Meta Ads, webhooks, storage, email, pdf ou banco). E a unica forma de provisionar conector em todo o sistema — nenhum outro bloco cria ou altera credencial.",
      input: connectorProvisionInput,
      http: { method: "POST", path: "/admin/connectors/:connectorId/provision" },
      permissions: ["platform_owner"],
      connectors: [],
      states: ["success", "error", "forbidden", "not-provisioned"],
    },
  ],
  connectors: [
    {
      id: "whatsapp",
      label: "WhatsApp (Cloud API)",
      kind: "whatsapp",
      description: "Canal de atendimento do consultorio.",
      env: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_VERIFY_TOKEN"],
      ownerOnly: true,
    },
    {
      id: "anthropic",
      label: "Anthropic (Claude)",
      kind: "llm",
      description: "Agente automatico do consultorio.",
      env: ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"],
      ownerOnly: true,
    },
    {
      id: "instagram",
      label: "Instagram Graph API",
      kind: "api",
      description: "Publicacao e automacoes de resposta.",
      env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET", "INSTAGRAM_REDIRECT_URI"],
      ownerOnly: true,
    },
    {
      id: "meta_ads",
      label: "Meta Ads",
      kind: "api",
      description: "Anuncios e leitura de cliques para atribuicao.",
      env: ["META_ADS_ACCESS_TOKEN", "META_ADS_ACCOUNT_ID"],
      ownerOnly: true,
    },
    {
      id: "webhooks",
      label: "Webhooks de saida",
      kind: "webhook",
      description: "Entrega de eventos para sistemas externos.",
      env: ["WEBHOOK_SIGNING_SECRET", "WEBHOOK_TIMEOUT_MS"],
      ownerOnly: true,
    },
    {
      id: "storage",
      label: "Storage",
      kind: "storage",
      description: "Midias, anexos e backups.",
      env: ["STORAGE_BUCKET", "STORAGE_REGION", "STORAGE_ACCESS_KEY"],
      ownerOnly: true,
    },
    {
      id: "email",
      label: "Email",
      kind: "api",
      description: "Envio de e-mail transacional e templates.",
      env: ["EMAIL_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO"],
      ownerOnly: true,
    },
    {
      id: "pdf",
      label: "PDF",
      kind: "api",
      description: "Geracao de documentos e relatorios.",
      env: ["PDF_API_KEY", "PDF_TEMPLATE_DIR"],
      ownerOnly: true,
    },
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa, com RLS por consultorio.",
      env: ["DATABASE_URL", "DATABASE_BACKUP_BUCKET"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Acesso de implementacao e SO do dono da plataforma — o manifesto e o unico lugar onde `connector.provision` acontece.",
    "O dono da plataforma tem acesso total ao consultorio; o dono do consultorio (owner) so opera o operacional.",
    "O acesso `platform` nao pode ser removido nem rebaixado pelo dono do consultorio.",
    "Somente NOMES de variaveis de ambiente aparecem no manifesto; valores vivem no cofre e nunca saem dele.",
    "Todos os conectores sao owner-only: API, WhatsApp, LLM, webhooks, storage, email, pdf e banco de dados.",
    "Um conector sem provisionar bloqueia os blocos que dependem dele — o bloqueio aparece no proprio bloco, com pedido de acesso.",
    "Nenhum conector grava ou envia dado de saude do paciente.",
  ],
  emptyAction: { id: "connector.provision", label: "Provisionar conector" },
  defaultVariant: "cards",
  variants: [
    {
      id: "cards",
      label: "Cartoes",
      intent: "Ver o que cada conector destrava, com folga",
      tradeoff: "Mostra menos conectores por tela",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Conferir o manifesto inteiro de uma vez",
      tradeoff: "O que destrava fica resumido em uma linha",
    },
    {
      id: "checklist",
      label: "Checklist",
      intent: "Separar o que ja esta pronto do que falta",
      tradeoff: "Duas listas exigem rolagem para ter a visao completa",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden", "not-provisioned"],
  sensitive: true,
});
