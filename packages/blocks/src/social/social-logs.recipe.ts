import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * social-logs — logs de publicacao e interacao do Instagram.
 *
 * Extraido de `Agendador-Instagram: src/app/(app)/logs/page.tsx`.
 */

export const logRetryInput = z.object({
  id: z.string().min(1, "Informe o id do registro que falhou."),
});

export const socialLogsRecipe = defineBlock({
  id: "social-logs",
  name: "Logs de publicacao",
  domain: "social",
  summary:
    "Historico de publicacoes e interacoes do Instagram, com nivel, conta, acao, status e data, e reexecucao de falhas.",
  origins: ["Agendador-Instagram: src/app/(app)/logs/page.tsx"],
  ports: [
    {
      id: "socialLogsRepository",
      label: "Repositorio de logs",
      contract:
        "Historico paginado por conta e nivel. Nao devolve token, legenda completa nem dado de paciente.",
      methods: ["list(filter): SocialLogEntry[]", "retry(id): SocialLogEntry"],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "publishQueue",
      label: "Fila de publicacao",
      contract: "Reexecuta uma publicacao que falhou, respeitando a chave deterministica de dedup da Meta.",
      methods: ["enqueue(accountId, postId): Task", "findById(taskId): Task | null"],
      connectors: ["instagram"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "log.retry",
      title: "Reexecutar publicacao",
      description:
        "Use quando o usuario pedir para reexecutar uma publicacao ou interacao que falhou. A reexecucao usa a mesma chave de dedup, entao nao duplica entrega.",
      input: logRetryInput,
      http: { method: "POST", path: "/social/logs/:id/retry" },
      permissions: ["owner", "nutritionist", "receptionist"],
      connectors: ["instagram"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "instagram",
      label: "Instagram Graph API",
      kind: "api",
      description: "Destino das publicacoes reexecutadas.",
      env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],
      ownerOnly: true,
    },
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Guarda o historico de logs.",
      env: ["DATABASE_URL"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Log nunca carrega token, legenda completa, mensagem de paciente ou dado de saude.",
    "A fila de eventos da Meta usa chave deterministica (dedup): reexecutar nao cria publicacao duplicada.",
    "Nivel `error` e aviso de operacao; `warn` e informativo e nao interrompe o fluxo.",
    "Somente registros com falha sao reexecutaveis — a interface nao oferece retry em sucesso.",
    "Toda entrada tem data ISO para correlacao com a fila e com o console do agente.",
  ],
  defaultVariant: "table",
  variants: [
    {
      id: "table",
      label: "Tabela",
      intent: "Varrer muitos registros e filtrar por nivel",
      tradeoff: "A mensagem aparece resumida",
    },
    {
      id: "timeline",
      label: "Linha do tempo",
      intent: "Ler a sequencia do que aconteceu",
      tradeoff: "Mostra menos registros por tela",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
