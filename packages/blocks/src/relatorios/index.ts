export { ReportsFunnel } from "./reports-funnel.js";
export type {
  FunnelSourceRow,
  FunnelStage,
  FunnelStageId,
  ReportsFunnelData,
  ReportsFunnelVariant,
} from "./reports-funnel.js";
export { reportsFunnelRecipe } from "./reports-funnel.recipe.js";

export { MetaConversion } from "./meta-conversion.js";
export type {
  MetaConversionData,
  MetaConversionEvent,
  MetaConversionVariant,
  MetaEventStatus,
  MetaStageId,
} from "./meta-conversion.js";
export { metaConversionRecipe } from "./meta-conversion.recipe.js";

export { metaConversionMock, metaEvents, relatoriosMocks, reportsFunnelMock } from "./mock.js";
