import { defineAction, defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * Receita do bloco "availability" (CRM-Nutricionista + CRM-HOF).
 *
 * Regra herdada: agendamento bloqueia em cima de folga do profissional e
 * slots ja descontam marcado e bloqueado.
 */

export const availabilityRecipe = defineBlock({
  id: "availability",
  name: "Horarios de atendimento",
  domain: "agenda",
  summary:
    "Grade semanal de atendimento, folgas e slots livres — bloqueios sempre vencem o horario livre.",
  origins: [
    "CRM-Nutricionista: src/core/services/schedule.ts",
    "CRM-HOF: src/core/agenda/availability.ts",
  ],
  ports: [
    {
      id: "availabilityRepository",
      label: "Repositorio de disponibilidade",
      contract: "Horarios semanais e bloqueios por profissional, em minutos desde a meia-noite local.",
      methods: [
        "listHours(professionalId): AvailabilityHours[]",
        "listBlocks(from, to, professionalId): AvailabilityBlock[]",
        "saveHours(hours): AvailabilityHours[]",
        "removeBlock(blockId): void",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "slotService",
      label: "Servico de slots",
      contract: "Calcula slots livres descontando atendimento marcado e horario bloqueado.",
      methods: [
        "freeSlots(professionalId, date, slotMinutes): Slot[]",
        "isBookable(professionalId, startsAt): boolean",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    defineAction({
      id: "availability.setHours",
      title: "Definir horario de atendimento",
      description:
        "Grava a janela de atendimento do profissional em um dia da semana. Use quando o responsavel alterar a grade.",
      input: z.object({
        professionalId: z.string().min(1),
        weekday: z.number().int().min(0).max(6),
        startMinutes: z.number().int().min(0).max(1440),
        endMinutes: z.number().int().min(0).max(1440),
        slotMinutes: z.number().int().min(5).max(240).optional(),
      }),
      http: { method: "PUT", path: "/availability/:professionalId" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
    defineAction({
      id: "availability.block",
      title: "Bloquear horario",
      description:
        "Bloqueia um intervalo de agenda (ferias, reuniao, indisponibilidade). O bloqueio vale mesmo sobre folga e sobre horario de atendimento.",
      input: z.object({
        professionalId: z.string().min(1),
        date: z.string().min(8),
        startMinutes: z.number().int().min(0).max(1440),
        endMinutes: z.number().int().min(0).max(1440),
        reason: z.string().optional(),
      }),
      http: { method: "POST", path: "/availability/blocks" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
    defineAction({
      id: "availability.unblock",
      title: "Liberar bloqueio",
      description:
        "Remove um bloqueio de agenda e devolve os slots para a agenda. Use quando o profissional confirmar que pode atender.",
      input: z.object({
        blockId: z.string().min(1),
      }),
      http: { method: "DELETE", path: "/availability/blocks/:blockId" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa (horarios, bloqueios e atendimentos).",
      ownerOnly: true,
    },
  ],
  rules: [
    "Agendamento bloqueia em cima de folga do profissional: bloqueado nunca vira slot.",
    "Slots ja descontam atendimento marcado e horario bloqueado.",
    "Timezone America/Sao_Paulo: a conversao local<->UTC faz DUAS passadas por causa do DST.",
    "A grade semanal nao carrega dado de saude em log, URL ou telemetria.",
    "Folga e horario de atendimento sao do profissional, nao do consultorio inteiro.",
  ],
  emptyAction: { id: "availability.setHours", label: "Definir horário" },
  defaultVariant: "week",
  variants: [
    {
      id: "week",
      label: "Semana",
      intent: "Ver a grade semanal de todos os profissionais lado a lado.",
      tradeoff: "Mostra o horario, mas nao os slots livres de um dia especifico.",
    },
    {
      id: "list",
      label: "Lista",
      intent: "Listar horarios e folgas em listas densas, otimas para conferir.",
      tradeoff: "Exige rolagem para cruzar profissional e dia.",
    },
    {
      id: "slots",
      label: "Slots",
      intent: "Ver os slots livres de um dia, ja descontando marcado e bloqueado.",
      tradeoff: "Mostra apenas um dia por vez.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
