/**
 * Dominio social — blocos extraidos do Agendador-Instagram.
 */

export { SocialAccounts } from "./social-accounts.js";
export type { SocialAccount, SocialAccountsData, SocialAccountsVariant, SocialAccountStatus } from "./social-accounts.js";
export { socialAccountInput, socialAccountsRecipe, socialConnectInput } from "./social-accounts.recipe.js";

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
  AutomationMatchMode,
  AutomationTrigger,
  SocialAutomation,
  SocialAutomationStats,
  SocialAutomationsData,
  SocialAutomationsVariant,
} from "./social-automations.js";
export { automationDeleteInput, automationToggleInput, socialAutomationsRecipe } from "./social-automations.recipe.js";

export { SocialLogs } from "./social-logs.js";
export type { SocialLogEntry, SocialLogStatus, SocialLogsData, SocialLogsVariant } from "./social-logs.js";
export { socialLogsRecipe } from "./social-logs.recipe.js";

export { SocialAgenda } from "./social-agenda.js";
export type { SocialAgendaData, SocialAgendaDay, SocialAgendaPost, SocialAgendaVariant } from "./social-agenda.js";
export { postIdInput, socialAgendaRecipe } from "./social-agenda.recipe.js";

export { SocialPostDetail } from "./social-post-detail.js";
export type { SocialPostDetailData, SocialPostDetailVariant } from "./social-post-detail.js";
export { postUpdateInput, socialPostDetailRecipe } from "./social-post-detail.recipe.js";

export { POST_STATUS, PostStatus, StatusDot } from "./status.js";
export type { SocialPostStatus, StatusTone } from "./status.js";

export {
  socialAccountsMock,
  socialAgendaMock,
  socialAutomationsMock,
  socialComposerMock,
  socialLogsMock,
  socialMock,
  socialPostDetailMock,
} from "./mock.js";
