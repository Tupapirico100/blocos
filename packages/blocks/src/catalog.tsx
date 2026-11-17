import * as React from "react";
import type { BlockRecipe } from "@blocos/core";

/** Entrada do catalogo: a receita + o componente + os dados de demonstracao. */
export interface BlockCatalogEntry {
  /** id do bloco (igual ao recipe.id) */
  id: string;
  recipe: BlockRecipe;
  Component: React.ComponentType<any>;
  /** dados ficticios ja no formato que o bloco espera */
  mockData: unknown;
  /** conectores exigidos, quando o bloco precisa de um para funcionar */
  requires?: string[];
}

/* ------------------------------------------------------------------ */
/* Componentes                                                         */
/* ------------------------------------------------------------------ */
import { AdminPlatform } from "./administracao/admin-platform.js";
import { OfficeTeam } from "./administracao/office-team.js";
import { OfficeSettings } from "./administracao/office-settings.js";
import { AgendaBoard } from "./agenda/agenda-board.js";
import { Availability } from "./agenda/availability.js";
import { FollowUpTasks } from "./agenda/follow-up-tasks.js";
import { LeadsBoard } from "./atendimento/leads-board.js";
import { InboxWhatsapp } from "./atendimento/inbox-whatsapp.js";
import { ConsentPanel } from "./atendimento/consent-panel.js";
import { ChannelConnections } from "./atendimento/channel-connections.js";
import { PatientsList } from "./clinico/patients-list.js";
import { PatientChart } from "./clinico/patient-chart.js";
import { ClinicalEntry } from "./clinico/clinical-entry.js";
import { PackagesPricing } from "./financeiro/packages-pricing.js";
import { PaymentsCheckout } from "./financeiro/payments-checkout.js";
import { FinanceOverview } from "./financeiro/finance-overview.js";
import { AuthLogin } from "./identidade/auth-login.js";
import { AuthTwoFactor } from "./identidade/auth-two-factor.js";
import { AuthRecovery } from "./identidade/auth-recovery.js";
import { SocialAccounts } from "./social/social-accounts.js";
import { SocialComposer } from "./social/social-composer.js";
import { SocialAutomations } from "./social/social-automations.js";
import { SocialLogs } from "./social/social-logs.js";
import { WebhooksPanel } from "./operacao/webhooks-panel.js";
import { AgentConsole } from "./operacao/agent-console.js";
import { OpsHealth } from "./operacao/ops-health.js";
import { IntegrationManifest } from "./operacao/integration-manifest.js";
import { ReportsFunnel } from "./relatorios/reports-funnel.js";
import { MetaConversion } from "./relatorios/meta-conversion.js";

/* ------------------------------------------------------------------ */
/* Receitas                                                            */
/* ------------------------------------------------------------------ */
import { adminPlatformRecipe } from "./administracao/admin-platform.recipe.js";
import { officeTeamRecipe } from "./administracao/office-team.recipe.js";
import { officeSettingsRecipe } from "./administracao/office-settings.recipe.js";
import { agendaBoardRecipe } from "./agenda/agenda-board.recipe.js";
import { availabilityRecipe } from "./agenda/availability.recipe.js";
import { followUpTasksRecipe } from "./agenda/follow-up-tasks.recipe.js";
import { leadsBoardRecipe } from "./atendimento/leads-board.recipe.js";
import { inboxWhatsappRecipe } from "./atendimento/inbox-whatsapp.recipe.js";
import { consentPanelRecipe } from "./atendimento/consent-panel.recipe.js";
import { channelConnectionsRecipe } from "./atendimento/channel-connections.recipe.js";
import { patientsListRecipe } from "./clinico/patients-list.recipe.js";
import { patientChartRecipe } from "./clinico/patient-chart.recipe.js";
import { clinicalEntryRecipe } from "./clinico/clinical-entry.recipe.js";
import { packagesPricingRecipe } from "./financeiro/packages-pricing.recipe.js";
import { paymentsCheckoutRecipe } from "./financeiro/payments-checkout.recipe.js";
import { financeOverviewRecipe } from "./financeiro/finance-overview.recipe.js";
import { authLoginRecipe } from "./identidade/auth-login.recipe.js";
import { authTwoFactorRecipe } from "./identidade/auth-two-factor.recipe.js";
import { authRecoveryRecipe } from "./identidade/auth-recovery.recipe.js";
import { socialAccountsRecipe } from "./social/social-accounts.recipe.js";
import { socialComposerRecipe } from "./social/social-composer.recipe.js";
import { socialAutomationsRecipe } from "./social/social-automations.recipe.js";
import { socialLogsRecipe } from "./social/social-logs.recipe.js";
import { webhooksRecipe } from "./operacao/webhooks-panel.recipe.js";
import { agentConsoleRecipe } from "./operacao/agent-console.recipe.js";
import { opsHealthRecipe } from "./operacao/ops-health.recipe.js";
import { integrationManifestRecipe } from "./operacao/integration-manifest.recipe.js";
import { reportsFunnelRecipe } from "./relatorios/reports-funnel.recipe.js";
import { metaConversionRecipe } from "./relatorios/meta-conversion.recipe.js";

/* ------------------------------------------------------------------ */
/* Dados de demonstracao                                               */
/* ------------------------------------------------------------------ */
import { adminPlatformMock, officeTeamMock, officeSettingsMock } from "./administracao/mock.js";
import { agendaBoardMock, availabilityMock, followUpMock } from "./agenda/mock.js";
import {
  leadsBoardMock,
  inboxWhatsappMock,
  consentPanelMock,
  channelConnectionsMock,
} from "./atendimento/mock.js";
import { patientsListMock, patientChartMock, clinicalEntryMock } from "./clinico/mock.js";
import { packagesPricingMock, paymentsCheckoutMock, financeOverviewMock } from "./financeiro/mock.js";
import { authLoginMock, authTwoFactorMock, authRecoveryMock } from "./identidade/mock.js";
import {
  socialAccountsMock,
  socialComposerMock,
  socialAutomationsMock,
  socialLogsMock,
} from "./social/mock.js";
import {
  webhooksMock,
  agentConsoleMock,
  opsHealthMock,
  integrationManifestMock,
} from "./operacao/mock.js";
import { reportsFunnelMock, metaConversionMock } from "./relatorios/mock.js";

/** Todas as receitas, em ordem de dominio. */
export const allRecipes = [
  authLoginRecipe,
  authTwoFactorRecipe,
  authRecoveryRecipe,
  adminPlatformRecipe,
  officeTeamRecipe,
  officeSettingsRecipe,
  leadsBoardRecipe,
  inboxWhatsappRecipe,
  consentPanelRecipe,
  channelConnectionsRecipe,
  patientsListRecipe,
  patientChartRecipe,
  clinicalEntryRecipe,
  agendaBoardRecipe,
  availabilityRecipe,
  followUpTasksRecipe,
  packagesPricingRecipe,
  paymentsCheckoutRecipe,
  financeOverviewRecipe,
  reportsFunnelRecipe,
  metaConversionRecipe,
  socialAccountsRecipe,
  socialComposerRecipe,
  socialAutomationsRecipe,
  socialLogsRecipe,
  webhooksRecipe,
  agentConsoleRecipe,
  opsHealthRecipe,
  integrationManifestRecipe,
] as const;

/** O catalogo: o que o app usa para navegar. */
export const BLOCO_CATALOG: BlockCatalogEntry[] = [
  { id: "auth-login", recipe: authLoginRecipe, Component: AuthLogin, mockData: authLoginMock },
  { id: "auth-two-factor", recipe: authTwoFactorRecipe, Component: AuthTwoFactor, mockData: authTwoFactorMock },
  { id: "auth-recovery", recipe: authRecoveryRecipe, Component: AuthRecovery, mockData: authRecoveryMock },
  { id: "admin-platform", recipe: adminPlatformRecipe, Component: AdminPlatform, mockData: adminPlatformMock },
  { id: "office-team", recipe: officeTeamRecipe, Component: OfficeTeam, mockData: officeTeamMock },
  { id: "office-settings", recipe: officeSettingsRecipe, Component: OfficeSettings, mockData: officeSettingsMock },
  { id: "leads-board", recipe: leadsBoardRecipe, Component: LeadsBoard, mockData: leadsBoardMock },
  { id: "inbox-whatsapp", recipe: inboxWhatsappRecipe, Component: InboxWhatsapp, mockData: inboxWhatsappMock, requires: ["whatsapp"] },
  { id: "consent-panel", recipe: consentPanelRecipe, Component: ConsentPanel, mockData: consentPanelMock },
  { id: "channel-connections", recipe: channelConnectionsRecipe, Component: ChannelConnections, mockData: channelConnectionsMock, requires: ["whatsapp"] },
  { id: "patients-list", recipe: patientsListRecipe, Component: PatientsList, mockData: patientsListMock },
  { id: "patient-chart", recipe: patientChartRecipe, Component: PatientChart, mockData: patientChartMock },
  { id: "clinical-entry", recipe: clinicalEntryRecipe, Component: ClinicalEntry, mockData: clinicalEntryMock },
  { id: "agenda-board", recipe: agendaBoardRecipe, Component: AgendaBoard, mockData: agendaBoardMock },
  { id: "availability", recipe: availabilityRecipe, Component: Availability, mockData: availabilityMock },
  { id: "follow-up-tasks", recipe: followUpTasksRecipe, Component: FollowUpTasks, mockData: followUpMock },
  { id: "packages-pricing", recipe: packagesPricingRecipe, Component: PackagesPricing, mockData: packagesPricingMock },
  { id: "payments-checkout", recipe: paymentsCheckoutRecipe, Component: PaymentsCheckout, mockData: paymentsCheckoutMock },
  { id: "finance-overview", recipe: financeOverviewRecipe, Component: FinanceOverview, mockData: financeOverviewMock },
  { id: "reports-funnel", recipe: reportsFunnelRecipe, Component: ReportsFunnel, mockData: reportsFunnelMock },
  { id: "meta-conversion", recipe: metaConversionRecipe, Component: MetaConversion, mockData: metaConversionMock, requires: ["meta_ads"] },
  { id: "social-accounts", recipe: socialAccountsRecipe, Component: SocialAccounts, mockData: socialAccountsMock, requires: ["instagram"] },
  { id: "social-composer", recipe: socialComposerRecipe, Component: SocialComposer, mockData: socialComposerMock },
  { id: "social-automations", recipe: socialAutomationsRecipe, Component: SocialAutomations, mockData: socialAutomationsMock },
  { id: "social-logs", recipe: socialLogsRecipe, Component: SocialLogs, mockData: socialLogsMock },
  { id: "webhooks-panel", recipe: webhooksRecipe, Component: WebhooksPanel, mockData: webhooksMock, requires: ["webhooks"] },
  { id: "agent-console", recipe: agentConsoleRecipe, Component: AgentConsole, mockData: agentConsoleMock, requires: ["anthropic"] },
  { id: "ops-health", recipe: opsHealthRecipe, Component: OpsHealth, mockData: opsHealthMock },
  { id: "integration-manifest", recipe: integrationManifestRecipe, Component: IntegrationManifest, mockData: integrationManifestMock },
];
