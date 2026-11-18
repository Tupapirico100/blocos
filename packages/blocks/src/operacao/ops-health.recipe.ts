import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * ops-health — saude da operacao.
 *
 * Extraido de `CRM-Nutricionista: src/instrumentation.ts`
 * e `CRM-Nutricionista: src/core/observability/scrub.ts`.
 */

export const opsBackupRunInput = z.object({
  /** Escopo do backup. Vazio = backup completo do programa. */
  scope: z.enum(["full", "incremental"]).optional().default("full"),
});

export const opsHealthRecipe = defineBlock({
  id: "ops-health",
  name: "Saude da operacao",
  domain: "operacao",
  summary:
    "Estado da operacao: allowlist de instrumentacao, ultimo backup, filas em andamento e webhooks com falha.",
  origins: [
    "CRM-Nutricionista: src/instrumentation.ts",
    "CRM-Nutricionista: src/core/observability/scrub.ts",
  ],
  ports: [
    {
      id: "instrumentation",
      label: "Instrumentacao",
      contract:
        "Allowlist de campos que podem sair para telemetria e a lista de campos removidos pelo scrub antes de gravar.",
      methods: ["allowlist(): { allowed: string[]; scrubbed: string[]; sampleRate: number }"],
      connectors: [],
      mockable: true,
    },
    {
      id: "backupService",
      label: "Servico de backup",
      contract: "Dispara e consulta backups. Devolve horario, duracao, tamanho e destino — nunca conteudo.",
      methods: ["run(scope): BackupResult", "last(): BackupResult"],
      connectors: ["storage", "database"],
      mockable: true,
    },
    {
      id: "queueInspector",
      label: "Inspetor de filas",
      contract: "Contadores por fila: esperando, em andamento e com falha.",
      methods: ["queues(): OpsQueue[]"],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "deliveryInspector",
      label: "Inspetor de entregas",
      contract: "Webhooks que esgotaram o backoff e seguem para inspecao manual.",
      methods: ["failed(): OpsFailedWebhook[]"],
      connectors: ["webhooks"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "ops.backup.run",
      title: "Rodar backup",
      description:
        "Use quando o dono da plataforma pedir um backup imediato do programa. O backup e disparado em segundo plano e o resultado aparece na tela de saude da operacao.",
      input: opsBackupRunInput,
      http: { method: "POST", path: "/ops/backup" },
      permissions: ["platform_owner"],
      connectors: ["storage", "database"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Origem do backup e das contagens de fila.",
      env: ["DATABASE_URL", "DATABASE_BACKUP_BUCKET"],
      ownerOnly: true,
    },
    {
      id: "storage",
      label: "Storage",
      kind: "storage",
      description: "Destino dos arquivos de backup.",
      env: ["STORAGE_BUCKET", "STORAGE_REGION"],
      ownerOnly: true,
    },
    {
      id: "webhooks",
      label: "Webhooks de saida",
      kind: "webhook",
      description: "Origem das entregas com falha exibidas nesta tela.",
      env: ["WEBHOOK_SIGNING_SECRET"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Instrumentacao e allowlist: somente os campos explicitamente permitidos saem para a telemetria.",
    "O scrub remove segredo e dado de saude antes de qualquer gravacao — inclusive no backup e na telemetria.",
    "O backup e acao do dono da plataforma; o dono do consultorio apenas visualiza o ultimo resultado.",
    "Fila parada acima do limite e incidente operacional: a tela destaca o item mais antigo esperando.",
    "Webhook que esgotou o backoff (1m -> 5m -> 15m -> 1h -> 6h -> 24h) vai para inspecao manual.",
    "Nenhuma tela de operacao mostra conteudo de prontuario, token ou chave de API.",
  ],
  emptyAction: { id: "ops.backup.run", label: "Executar backup" },
  defaultVariant: "cards",
  variants: [
    {
      id: "cards",
      label: "Cartoes",
      intent: "Um panorama rapido do estado da operacao",
      tradeoff: "Detalhe de fila e checagem fica resumido",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Auditar checagens e filas linha a linha",
      tradeoff: "Nao mostra a sequencia temporal",
    },
    {
      id: "timeline",
      label: "Linha do tempo",
      intent: "Entender a ordem dos eventos recentes",
      tradeoff: "Perde as contagens exatas das filas",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
