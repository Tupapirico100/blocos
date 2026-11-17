/* Re-exports do dominio de atendimento. */

export { LeadBoard, LeadsBoard } from "./leads-board.js";
export type { Lead, LeadBoardData, LeadOrigin, LeadStage, LeadStageMeta } from "./leads-board.js";
export { leadsBoardRecipe } from "./leads-board.recipe.js";

export { InboxWhatsapp } from "./inbox-whatsapp.js";
export type {
  ChatMessage,
  Conversation,
  InboxWhatsappData,
  WhatsappTemplate,
} from "./inbox-whatsapp.js";
export { inboxWhatsappRecipe } from "./inbox-whatsapp.recipe.js";

export { ConsentPanel } from "./consent-panel.js";
export type {
  ConsentChannel,
  ConsentKind,
  ConsentPanelData,
  ConsentRecord,
} from "./consent-panel.js";
export { consentPanelRecipe } from "./consent-panel.recipe.js";

export { ChannelConnections } from "./channel-connections.js";
export type {
  ChannelConnection,
  ChannelConnectionsData,
  ChannelProviderKind,
  ChannelStatus,
  RiskAcceptance,
} from "./channel-connections.js";
export { channelConnectionsRecipe } from "./channel-connections.recipe.js";

export { atendimentoMock } from "./mock.js";
export type { AtendimentoMock } from "./mock.js";
