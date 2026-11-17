/**
 * Dominio social — blocos extraidos do Agendador-Instagram.
 */

export { SocialAccounts } from "./social-accounts.js";
export type {
  SocialAccount,
  SocialAccountsData,
  SocialAccountsVariant,
  SocialPostSummary,
  SocialTokenStatus,
} from "./social-accounts.js";
export { socialAccountsRecipe, socialConnectInput } from "./social-accounts.recipe.js";

export { SocialComposer } from "./social-composer.js";
export type {
  SocialComposerAccount,
  SocialComposerData,
  SocialComposerVariant,
  SocialMediaItem,
  SocialPostFormat,
} from "./social-composer.js";
export { postScheduleInput, socialComposerRecipe, socialPostFormat } from "./social-composer.recipe.js";

export { SocialAutomations } from "./social-automations.js";
export type {
  AutomationActionType,
  AutomationTriggerType,
  SocialAutomation,
  SocialAutomationsData,
  SocialAutomationsVariant,
} from "./social-automations.js";
export { automationToggleInput, socialAutomationsRecipe } from "./social-automations.recipe.js";

export { SocialLogs } from "./social-logs.js";
export type {
  SocialLogEntry,
  SocialLogLevel,
  SocialLogStatus,
  SocialLogsData,
  SocialLogsVariant,
} from "./social-logs.js";
export { logRetryInput, socialLogsRecipe } from "./social-logs.recipe.js";

export {
  socialAccountsMock,
  socialAutomationsMock,
  socialComposerMock,
  socialLogsMock,
  socialMock,
} from "./mock.js";
