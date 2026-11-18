import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * webhooks-panel — webhooks de saida do programa.
 *
 * Extraido de `CRM-Nutricionista: src/app/[locale]/consultorios/[officeId]/webhook/WebhookPanel.tsx`
 * e `CRM-HOF: src/app/[locale]/webhooks/page.tsx`.
 */

export const webhookToggleInput = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export const webhooksRecipe = defineBlock({
  id: "webhooks-panel",
  name: "Webhooks de saida",
  domain: "operacao",
  summary:
    "Endpoints de saida do programa, com eventos assinados, segredo por referencia, tentativas, backoff e status da ultima entrega.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/consultorios/[officeId]/webhook/WebhookPanel.tsx",
    "CRM-HOF: src/app/[locale]/webhooks/page.tsx",
  ],
  ports: [
    {
      id: "webhooksRepository",
      label: "Repositorio de webhooks",
      contract:
        "CRUD dos endpoints de saida. Devolve `secretRef` (nome da env var), nunca o segredo. A validacao de destino vive fora do repositorio.",
      methods: [
        "listByOffice(officeId): WebhookEndpoint[]",
        "toggle(id, active): WebhookEndpoint",
        "register(input): WebhookEndpoint",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "webhookGuard",
      label: "Guard de destino (SSRF)",
      contract:
        "Valida o endpoint antes de qualquer envio: exige HTTPS e resolucao para IP publico. Recusa loopback, rede privada e endereco interno.",
      methods: ["check(url): { https: boolean; publicIp: boolean }"],
      connectors: [],
      mockable: true,
    },
    {
      id: "webhookDispatcher",
      label: "Despachante de webhooks",
      contract:
        "Entrega o evento e aplica o backoff 1m -> 5m -> 15m -> 1h -> 6h -> 24h. Depois da ultima tentativa marca o evento como falho.",
      methods: ["deliver(webhookId, event): DeliveryResult", "retry(webhookId, eventId): DeliveryResult"],
      connectors: ["webhooks"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "webhook.toggle",
      title: "Ativar ou desativar webhook",
      description:
        "Use quando o usuario quiser pausar ou retomar o envio de eventos para um endpoint. Desativar mantem a configuracao e o historico de entregas.",
      input: webhookToggleInput,
      http: { method: "PATCH", path: "/webhooks/:id" },
      permissions: ["platform_owner", "owner"],
      connectors: ["webhooks"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "webhook.preview",
      title: "Ver previa do envio",
      description:
        "Use quando o usuario quiser ver o corpo e a assinatura que seriam enviados a um endpoint, SEM enviar nada. So aparece quando `data.canPreview` e verdadeiro (CRM-HOF).",
      input: z.object({ id: z.string().min(1) }),
      permissions: ["platform_owner", "owner"],
      connectors: ["database"],
      readOnly: true,
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "webhooks",
      label: "Webhooks de saida",
      kind: "webhook",
      description:
        "Entrega de eventos do programa para sistemas externos, com assinatura por segredo e reexecucao com backoff.",
      env: ["WEBHOOK_SIGNING_SECRET", "WEBHOOK_TIMEOUT_MS"],
      howTo:
        "Cadastre o endpoint e informe o nome da variavel de ambiente que guarda o segredo. O painel nunca recebe o valor.",
      ownerOnly: true,
      riskVersion: "v1",
    },
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Guarda os endpoints e o historico de entregas.",
      env: ["DATABASE_URL"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Guard de SSRF: somente HTTPS e IP publico — loopback, rede privada e endereco interno sao recusados antes do envio.",
    "O segredo e sempre por referencia (`secretRef` = nome da env var); o valor nunca e renderizado, logado ou enviado pela UI.",
    "Backoff de reexecucao: 1m -> 5m -> 15m -> 1h -> 6h -> 24h; depois disso o evento e marcado como falho.",
    "Payload de saida nunca leva dado de saude do paciente, nem texto de prontuario.",
    "A URL do endpoint e validada de novo a cada entrega — DNS pode mudar depois do cadastro.",
    "A previa (`webhook.preview`) mostra o corpo e a assinatura que seriam enviados e NAO envia nada.",
    "Textos, datas e nomes de evento vem do `LocaleProvider` (chaves `webhooks.*`) e de `data.eventLabels`; sem eles, o padrao em pt-BR.",
  ],
  defaultVariant: "list",
  variants: [
    {
      id: "list",
      label: "Lista",
      intent: "Conferir todos os endpoints em tabela",
      tradeoff: "O encadeamento das etapas fica resumido",
    },
    {
      id: "flow",
      label: "Fluxo",
      intent: "Entender o caminho do evento: eventos, segredo, entrega",
      tradeoff: "Ocupa mais altura por endpoint",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
  sensitive: true,
});
