import { defineAction, defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * Receita do bloco "agenda-board" (CRM-Nutricionista + CRM-HOF).
 *
 * Regra de negocio herdada: agendamento e leitura de agenda sao do consultorio;
 * o dono da plataforma tem acesso total, o dono do consultorio opera o operacional.
 */

const appointmentStatus = z.enum(["agendado", "confirmado", "compareceu", "faltou", "cancelado"]);

export const agendaBoardRecipe = defineBlock({
  id: "agenda-board",
  name: "Agenda de consultas",
  domain: "agenda",
  summary:
    "Grade de consultas por profissional e por hora, com status do atendimento e acoes de reagendamento e cancelamento.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/agenda/page.tsx",
    "CRM-HOF: src/app/[locale]/agenda/AgendaClient.tsx",
  ],
  ports: [
    {
      id: "appointmentsRepository",
      label: "Repositorio de atendimentos",
      contract: "Atendimentos do consultorio por dia, profissional e janela de tempo.",
      methods: [
        "listByDay(date, officeId): Appointment[]",
        "listByRange(from, to, officeId): Appointment[]",
        "reschedule(id, startsAt, endsAt): Appointment",
        "setStatus(id, status): Appointment",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "scheduleService",
      label: "Servico de agenda",
      contract: "Valida conflito de horario, fuso local e permissao antes de gravar.",
      methods: [
        "checkConflicts(appointment): Conflict[]",
        "cancel(id, reason): Appointment",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    defineAction({
      id: "appointment.reschedule",
      title: "Reagendar consulta",
      description:
        "Move uma consulta para outro horario/profissional. Use quando o paciente pedir para remarcar ou quando o profissional precisar trocar o dia.",
      input: z.object({
        id: z.string().min(1),
        startsAt: z.string().min(1),
        endsAt: z.string().min(1),
        professionalId: z.string().optional(),
        reason: z.string().optional(),
      }),
      http: { method: "POST", path: "/appointments/:id/reschedule" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
    defineAction({
      id: "appointment.cancel",
      title: "Cancelar consulta",
      description:
        "Cancela uma consulta e libera o horario. Use quando o paciente desistir; o motivo fica registrado.",
      input: z.object({
        id: z.string().min(1),
        reason: z.string().min(1),
      }),
      http: { method: "POST", path: "/appointments/:id/cancel" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
    defineAction({
      id: "appointment.setStatus",
      title: "Atualizar status do atendimento",
      description:
        "Marca a consulta como confirmada, compareceu, faltou ou cancelada. Use depois do atendimento ou quando o paciente confirmar presenca.",
      input: z.object({
        id: z.string().min(1),
        status: appointmentStatus,
      }),
      http: { method: "PATCH", path: "/appointments/:id/status" },
      permissions: ["owner", "receptionist", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa (atendimentos, profissionais e agenda).",
      ownerOnly: true,
    },
  ],
  rules: [
    "Fuso do LocaleProvider (padrao America/Sao_Paulo; CRM-HOF America/Lima): a conversao local<->UTC faz DUAS passadas por causa do DST.",
    "Acoes por consulta podem vir dos dados (`actions`): quem chama decide o que o estado e o papel permitem; o bloco so mostra e chama onAction(id, { id, reason? }). Motivo obrigatorio e confirmacao sao pedidos no dialogo antes da chamada.",
    "Agendamento bloqueia em cima de folga do profissional: um horario bloqueado nunca vira slot.",
    "Slots ja descontam atendimento marcado e horario bloqueado.",
    "Regra 11: so respondemos a quem esta na lista de permitidos.",
    "A agenda nao carrega dado de saude em log, URL ou telemetria.",
    "O status 'compareceu' e a base da taxa de comparecimento usada no financeiro.",
  ],
  defaultVariant: "week",
  variants: [
    {
      id: "day",
      label: "Dia",
      intent: "Ver o dia de um profissional de cada vez, em colunas por profissional.",
      tradeoff: "Mostra poucas pessoas por vez; a semana passa fora da tela.",
    },
    {
      id: "week",
      label: "Semana",
      intent: "Comparar os 7 dias da semana por hora.",
      tradeoff: "Cada celula fica pequena com muitos profissionais.",
    },
    {
      id: "list",
      label: "Lista",
      intent: "Lista densa e linear por horario, otima para triagem da recepcao.",
      tradeoff: "Perde a visao espacial da grade.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
