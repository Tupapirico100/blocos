import type { AgendaAppointment, AgendaBoardData } from "./agenda-board.js";
import type { AvailabilityAppointment, AvailabilityBlock, AvailabilityData, AvailabilityHours } from "./availability.js";
import type { FollowUpData, FollowUpTask } from "./follow-up-tasks.js";

/**
 * Dados ficticios do dominio "agenda" para o catalogo.
 * Nomes brasileiros, datas ISO, fuso America/Sao_Paulo (-03:00).
 * Nenhum dado real de paciente.
 */

export const agendaProfessionals = [
  { id: "prof-1", name: "Dra. Marina Albuquerque", specialty: "Nutricao clinica" },
  { id: "prof-2", name: "Dr. Rafael Bittencourt", specialty: "Nutricao esportiva" },
  { id: "prof-3", name: "Dra. Helena Camargo", specialty: "Nutricao maternal" },
];

export const agendaAppointments: AgendaAppointment[] = [
  {
    id: "apt-1001",
    patientId: "pac-01",
    patientName: "Joana Prado",
    professionalId: "prof-1",
    type: "Avaliacao inicial",
    status: "confirmado",
    startsAt: "2024-03-12T08:30:00-03:00",
    endsAt: "2024-03-12T09:30:00-03:00",
  },
  {
    id: "apt-1002",
    patientId: "pac-02",
    patientName: "Otavio Bezerra",
    professionalId: "prof-1",
    type: "Retorno",
    status: "agendado",
    startsAt: "2024-03-12T10:00:00-03:00",
    endsAt: "2024-03-12T11:00:00-03:00",
  },
  {
    id: "apt-1003",
    patientId: "pac-03",
    patientName: "Camila Rezende",
    professionalId: "prof-1",
    type: "Consulta de rotina",
    status: "compareceu",
    startsAt: "2024-03-12T14:00:00-03:00",
    endsAt: "2024-03-12T15:00:00-03:00",
  },
  {
    id: "apt-1004",
    patientId: "pac-04",
    patientName: "Bruno Sarmento",
    professionalId: "prof-2",
    type: "Consulta de rotina",
    status: "faltou",
    startsAt: "2024-03-12T09:00:00-03:00",
    endsAt: "2024-03-12T10:00:00-03:00",
  },
  {
    id: "apt-1005",
    patientId: "pac-05",
    patientName: "Larissa Fontes",
    professionalId: "prof-2",
    type: "Avaliacao inicial",
    status: "agendado",
    startsAt: "2024-03-12T11:30:00-03:00",
    endsAt: "2024-03-12T12:30:00-03:00",
  },
  {
    id: "apt-1006",
    patientId: "pac-06",
    patientName: "Eduardo Vilela",
    professionalId: "prof-3",
    type: "Retorno",
    status: "cancelado",
    startsAt: "2024-03-12T16:00:00-03:00",
    endsAt: "2024-03-12T17:00:00-03:00",
  },
  {
    id: "apt-1007",
    patientId: "pac-07",
    patientName: "Patricia Lemos",
    professionalId: "prof-1",
    type: "Avaliacao inicial",
    status: "agendado",
    startsAt: "2024-03-13T08:00:00-03:00",
    endsAt: "2024-03-13T09:00:00-03:00",
  },
  {
    id: "apt-1008",
    patientId: "pac-08",
    patientName: "Marcelo Tavares",
    professionalId: "prof-2",
    type: "Consulta de rotina",
    status: "confirmado",
    startsAt: "2024-03-13T13:00:00-03:00",
    endsAt: "2024-03-13T14:00:00-03:00",
  },
  {
    id: "apt-1009",
    patientId: "pac-09",
    patientName: "Renata Bastos",
    professionalId: "prof-3",
    type: "Avaliacao inicial",
    status: "agendado",
    startsAt: "2024-03-14T10:30:00-03:00",
    endsAt: "2024-03-14T11:30:00-03:00",
  },
  {
    id: "apt-1010",
    patientId: "pac-10",
    patientName: "Vinicius Andrada",
    professionalId: "prof-1",
    type: "Retorno",
    status: "agendado",
    startsAt: "2024-03-15T15:00:00-03:00",
    endsAt: "2024-03-15T16:00:00-03:00",
  },
];

export const agendaBoardMock: AgendaBoardData = {
  professionals: agendaProfessionals,
  appointments: agendaAppointments,
  days: [
    "2024-03-11",
    "2024-03-12",
    "2024-03-13",
    "2024-03-14",
    "2024-03-15",
    "2024-03-16",
    "2024-03-17",
  ],
  hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  referenceDate: "2024-03-12",
};

export const availabilityHours: AvailabilityHours[] = [
  { professionalId: "prof-1", weekday: 1, startMinutes: 8 * 60, endMinutes: 12 * 60, slotMinutes: 30 },
  { professionalId: "prof-1", weekday: 1, startMinutes: 14 * 60, endMinutes: 18 * 60, slotMinutes: 30 },
  { professionalId: "prof-1", weekday: 3, startMinutes: 8 * 60, endMinutes: 12 * 60, slotMinutes: 30 },
  { professionalId: "prof-1", weekday: 5, startMinutes: 8 * 60, endMinutes: 13 * 60, slotMinutes: 30 },
  { professionalId: "prof-2", weekday: 1, startMinutes: 9 * 60, endMinutes: 13 * 60, slotMinutes: 60 },
  { professionalId: "prof-2", weekday: 2, startMinutes: 9 * 60, endMinutes: 13 * 60, slotMinutes: 60 },
  { professionalId: "prof-2", weekday: 4, startMinutes: 9 * 60, endMinutes: 13 * 60, slotMinutes: 60 },
  { professionalId: "prof-3", weekday: 2, startMinutes: 13 * 60, endMinutes: 18 * 60, slotMinutes: 30 },
  { professionalId: "prof-3", weekday: 4, startMinutes: 13 * 60, endMinutes: 18 * 60, slotMinutes: 30 },
  { professionalId: "prof-3", weekday: 6, startMinutes: 8 * 60, endMinutes: 12 * 60, slotMinutes: 30 },
];

export const availabilityBlocks: AvailabilityBlock[] = [
  {
    id: "blk-01",
    professionalId: "prof-1",
    date: "2024-03-12",
    startMinutes: 10 * 60,
    endMinutes: 11 * 60,
    reason: "Reuniao de equipe",
  },
  {
    id: "blk-02",
    professionalId: "prof-1",
    date: "2024-03-12",
    startMinutes: 16 * 60,
    endMinutes: 18 * 60,
    reason: "Consulta externa",
  },
  {
    id: "blk-03",
    professionalId: "prof-2",
    date: "2024-03-12",
    startMinutes: 9 * 60,
    endMinutes: 13 * 60,
    reason: "Conferencia medica",
  },
];

export const availabilityAppointments: AvailabilityAppointment[] = [
  {
    id: "apt-1002",
    professionalId: "prof-1",
    startsAt: "2024-03-12T10:00:00-03:00",
    endsAt: "2024-03-12T11:00:00-03:00",
  },
  {
    id: "apt-1003",
    professionalId: "prof-1",
    startsAt: "2024-03-12T14:00:00-03:00",
    endsAt: "2024-03-12T15:00:00-03:00",
  },
  {
    id: "apt-1005",
    professionalId: "prof-2",
    startsAt: "2024-03-12T11:30:00-03:00",
    endsAt: "2024-03-12T12:30:00-03:00",
  },
];

export const availabilityMock: AvailabilityData = {
  professionals: agendaProfessionals,
  hours: availabilityHours,
  blocks: availabilityBlocks,
  appointments: availabilityAppointments,
  date: "2024-03-12",
  slotMinutes: 30,
};

export const followUpTasks: FollowUpTask[] = [
  {
    id: "task-01",
    patientId: "pac-01",
    patientName: "Joana Prado",
    type: "retorno",
    dueAt: "2024-03-12T09:00:00-03:00",
    ownerId: "prof-1",
    ownerName: "Dra. Marina Albuquerque",
    status: "pendente",
    channel: "whatsapp",
  },
  {
    id: "task-02",
    patientId: "pac-03",
    patientName: "Camila Rezende",
    type: "resultado",
    dueAt: "2024-03-12T11:00:00-03:00",
    ownerId: "prof-1",
    ownerName: "Dra. Marina Albuquerque",
    status: "em_andamento",
    channel: "whatsapp",
  },
  {
    id: "task-03",
    patientId: "pac-06",
    patientName: "Eduardo Vilela",
    type: "recuperacao",
    dueAt: "2024-03-11T16:00:00-03:00",
    ownerId: "prof-3",
    ownerName: "Dra. Helena Camargo",
    status: "atrasada",
    channel: "ligacao",
  },
  {
    id: "task-04",
    patientId: "pac-07",
    patientName: "Patricia Lemos",
    type: "retorno",
    dueAt: "2024-03-13T08:30:00-03:00",
    ownerId: "prof-1",
    ownerName: "Dra. Marina Albuquerque",
    status: "pendente",
    channel: "email",
  },
  {
    id: "task-05",
    patientId: "pac-09",
    patientName: "Renata Bastos",
    type: "resultado",
    dueAt: "2024-03-14T10:00:00-03:00",
    ownerId: "prof-2",
    ownerName: "Dr. Rafael Bittencourt",
    status: "pendente",
    channel: "whatsapp",
  },
  {
    id: "task-06",
    patientId: "pac-08",
    patientName: "Marcelo Tavares",
    type: "recuperacao",
    dueAt: "2024-03-12T14:30:00-03:00",
    ownerId: "prof-3",
    ownerName: "Dra. Helena Camargo",
    status: "concluida",
    channel: "whatsapp",
  },
];

export const followUpMock: FollowUpData = {
  tasks: followUpTasks,
  days: ["2024-03-11", "2024-03-12", "2024-03-13", "2024-03-14"],
};

export const agendaMocks = {
  "agenda-board": agendaBoardMock,
  availability: availabilityMock,
  "follow-up-tasks": followUpMock,
};
