import { defineAction, defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * Receita do bloco "meta-conversion" (CRM-HOF).
 *
 * Fila de eventos da Meta: chave deterministica de dedup e NUNCA dado de saude
 * no payload. O conector "meta_ads" e owner-only.
 */

export const metaConversionRecipe = defineBlock({
  id: "meta-conversion",
  name: "Fila de eventos da Meta",
  domain: "relatorios",
  summary:
    "Fila de eventos de conversao para a Meta, com chave deterministica de dedup e payload sem dado de saude.",
  origins: [
    "CRM-HOF: src/app/[locale]/meta/page.tsx",
    "CRM-HOF: src/core/services/meta-events.ts",
  ],
  ports: [
    {
      id: "metaEventsRepository",
      label: "Repositorio de eventos da Meta",
      contract: "Eventos na fila com chave de dedup, etapa, origem e status de envio.",
      methods: [
        "listQueued(status): MetaEvent[]",
        "markSent(id): MetaEvent",
        "markFailed(id, reason): MetaEvent",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "metaAdsProvider",
      label: "Provedor Meta Ads",
      contract: "Envia o evento para a Conversions API e devolve o resultado do envio.",
      methods: ["send(event): MetaSendResult", "retry(id): MetaSendResult"],
      connectors: ["meta_ads"],
      mockable: false,
    },
  ],
  actions: [
    defineAction({
      id: "meta.event.export",
      title: "Exportar fila da Meta",
      description:
        "Exporta os eventos que ainda nao foram enviados. Use para conference antes do envio em lote.",
      input: z.object({
        ids: z.array(z.string().min(1)).optional(),
        format: z.enum(["csv", "json"]).optional(),
      }),
      http: { method: "GET", path: "/meta/events/export" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
    defineAction({
      id: "meta.event.retry",
      title: "Reenviar evento com erro",
      description:
        "Reenvia os eventos que falharam na Conversions API. Use quando a credencial for corrigida ou a Meta pedir nova tentativa.",
      input: z.object({
        ids: z.array(z.string().min(1)).min(1),
      }),
      http: { method: "POST", path: "/meta/events/retry" },
      permissions: ["owner"],
      connectors: ["meta_ads", "database"],
      states: ["success", "error", "forbidden", "not-provisioned"],
    }),
  ],
  connectors: [
    {
      id: "meta_ads",
      label: "Meta Ads",
      kind: "api",
      description: "Meta Conversions API para envio dos eventos de conversao.",
      env: ["META_ACCESS_TOKEN", "META_PIXEL_ID"],
      ownerOnly: true,
    },
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa (fila de eventos).",
      ownerOnly: true,
    },
  ],
  rules: [
    "Opcionais (padrao igual ao de antes): status `expirado` e `recusado`, `reason` e `responseCode` por evento (com `showOutcome`), `showSource`, `canExport` e `canRetry` (desligue onde o endpoint nao existe — o bloco nunca oferece acao que o app nao tem), `showHeader`. Data e hora no fuso do `LocaleProvider`.",
    "A fila de eventos da Meta usa chave deterministica (dedup): o mesmo evento nao e enviado duas vezes.",
    "O payload NUNCA leva dado de saude (LGPD): sem consulta, medida ou plano alimentar.",
    "O estagio do evento segue o funil fixo: new -> qualified -> customer.",
    "A origem do evento e a do primeiro toque do lead.",
    "Somente o dono da plataforma provisiona o conector meta_ads; nenhum segredo trafega pelo bloco.",
  ],
  defaultVariant: "table",
  variants: [
    {
      id: "timeline",
      label: "Timeline",
      intent: "Acompanhar a fila em ordem cronologica e ver o que ainda nao saiu.",
      tradeoff: "Fica longa quando a fila acumula muitos eventos.",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Conferir evento, chave de dedup, estagio e origem com precisao.",
      tradeoff: "Perde a leitura de sequencia temporal.",
    },
    {
      id: "cards",
      label: "Cards",
      intent: "Varrer os eventos pendentes rapidamente.",
      tradeoff: "Ocupa mais espaco para a mesma informacao.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden", "not-provisioned"],
  sensitive: true,
});
