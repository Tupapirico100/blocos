export { AgendaBoard } from "./agenda-board.js";
export type {
  AgendaActionSpec,
  AgendaAppointment,
  AgendaBoardData,
  AgendaProfessional,
  AgendaVariant,
  AppointmentStatus,
} from "./agenda-board.js";
export { agendaBoardRecipe } from "./agenda-board.recipe.js";

export { Availability } from "./availability.js";
export type {
  AvailabilityAppointment,
  AvailabilityBlock,
  AvailabilityData,
  AvailabilityHours,
  AvailabilityProfessional,
  AvailabilityVariant,
} from "./availability.js";
export { availabilityRecipe } from "./availability.recipe.js";

export { FollowUpTasks } from "./follow-up-tasks.js";
export type {
  FollowUpData,
  FollowUpStatus,
  FollowUpTask,
  FollowUpType,
  FollowUpVariant,
} from "./follow-up-tasks.js";
export { followUpTasksRecipe } from "./follow-up-tasks.recipe.js";

export {
  agendaAppointments,
  agendaBoardMock,
  agendaMocks,
  agendaProfessionals,
  availabilityAppointments,
  availabilityBlocks,
  availabilityHours,
  availabilityMock,
  followUpMock,
  followUpTasks,
} from "./mock.js";
