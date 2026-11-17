/**
 * Dominio operacao — blocos de infraestrutura e acesso do programa.
 */

export { WebhooksPanel } from "./webhooks-panel.js";
export type {
  WebhookDeliveryStatus,
  WebhookEndpoint,
  WebhookGuard,
  WebhooksData,
  WebhooksVariant,
} from "./webhooks-panel.js";
export { webhooksRecipe, webhookToggleInput } from "./webhooks-panel.recipe.js";

export { AgentConsole } from "./agent-console.js";
export type {
  AgentConsoleData,
  AgentConsoleVariant,
  AgentLogEntry,
  AgentMessage,
  AgentTool,
  AgentToolId,
} from "./agent-console.js";
export {
  agentConsoleRecipe,
  agentMessageInput,
  agentPromptUpdateInput,
  agentToggleInput,
} from "./agent-console.recipe.js";

export { OpsHealth } from "./ops-health.js";
export type {
  OpsCheck,
  OpsCheckStatus,
  OpsFailedWebhook,
  OpsHealthData,
  OpsHealthVariant,
  OpsQueue,
} from "./ops-health.js";
export { opsBackupRunInput, opsHealthRecipe } from "./ops-health.recipe.js";

export { IntegrationManifest } from "./integration-manifest.js";
export type {
  IntegrationManifestData,
  IntegrationManifestVariant,
  ManifestConnector,
  ManifestConnectorId,
  ManifestConnectorStatus,
} from "./integration-manifest.js";
export { connectorProvisionInput, integrationManifestRecipe } from "./integration-manifest.recipe.js";

export {
  agentConsoleMock,
  integrationManifestMock,
  operacaoMock,
  opsHealthMock,
  webhooksMock,
} from "./mock.js";
