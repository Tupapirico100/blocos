import { defineAction, defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * Receita do bloco "follow-up-tasks" (CRM-HOF).
 *
 * Tarefas de acompanhamento: retorno, resultado de exame e recuperacao.
 * Nenhum payload de saude trafega: o bloco carrega apenas nome do paciente
 * e o tipo da tarefa.
 */

export const followUpTasksRecipe = defineBlock({
  id: "follow-up-tasks",
  name: "Tarefas de acompanhamento",
  domain: "agenda",
  summary:
    "Fila de acompanhamento com prazo e responsavel por tarefa, em lista, calendario ou quadro por status.",
  origins: ["CRM-HOF: src/app/[locale]/follow-up-tasks/page.tsx"],
  ports: [
    {
      id: "followUpRepository",
      label: "Repositorio de tarefas",
      contract: "Tarefas de acompanhamento do consultorio com prazo, responsavel e status.",
      methods: [
        "list(officeId, from, to): FollowUpTask[]",
        "complete(id): FollowUpTask",
        "reschedule(id, dueAt): FollowUpTask",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "messagingService",
      label: "Servico de messaging",
      contract: "Envia a mensagem de follow-up respeitando a janela de 24h e o consentimento de marketing.",
      methods: ["canSend(task): boolean", "send(task): MessageResult"],
      connectors: ["whatsapp"],
      mockable: true,
    },
  ],
  actions: [
    defineAction({
      id: "task.complete",
      title: "Concluir tarefa de acompanhamento",
      description:
        "Marca a tarefa como concluida. Use quando o retorno, o resultado ou a recuperacao ja tiverem sido tratados.",
      input: z.object({
        id: z.string().min(1),
        type: z.enum(["retorno", "resultado", "recuperacao"]).optional(),
      }),
      http: { method: "POST", path: "/follow-up-tasks/:id/complete" },
      permissions: ["owner", "employee"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    }),
    defineAction({
      id: "task.reschedule",
      title: "Reagendar tarefa de acompanhamento",
      description:
        "Muda o prazo da tarefa de acompanhamento. Use quando o paciente nao compareceu na data original.",
      input: z.object({
        id: z.string().min(1),
        dueAt: z.string().min(1),
      }),
      http: { method: "PATCH", path: "/follow-up-tasks/:id/due" },
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
      description: "Postgres do programa (tarefas de acompanhamento).",
      ownerOnly: true,
    },
    {
      id: "whatsapp",
      label: "WhatsApp (Cloud API)",
      kind: "api",
      description: "Envio da mensagem de acompanhamento ao paciente.",
      env: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Opcionais (padrao igual ao de antes): `label` (titulo livre, substitui o tipo), `detail`, paciente e responsavel opcionais, `showOwner`, `showType`, `canOpen` (acao `task.open`) e `showHeader`. O prazo e mostrado e reagendado no fuso do `LocaleProvider`; `task.reschedule` envia `dueAt` com o deslocamento desse fuso e tambem `dueDate`/`dueTime` locais.",
    "Janela de 24h: mensagem livre so dentro de 24h apos o cliente escrever; fora disso, so template aprovado.",
    "Consentimento de marketing (art. 7) e separado do consentimento de tratamento (art. 11).",
    "A tarefa carrega o nome do paciente e o tipo da tarefa — nunca conteudo de consulta, medida ou plano alimentar.",
    "Timezone America/Sao_Paulo: a conversao local<->UTC faz DUAS passadas por causa do DST.",
    "Quem fala com o paciente e employee: `employee` e `user` sao o mesmo papel.",
  ],
  defaultVariant: "calendar",
  variants: [
    {
      id: "list",
      label: "Lista",
      intent: "Trabalhar a fila em ordem de prazo, com tabela densa.",
      tradeoff: "Nao mostra a carga por dia.",
    },
    {
      id: "calendar",
      label: "Calendario",
      intent: "Ver a carga por dia e identificar dias apertados.",
      tradeoff: "Perde o detalhe de responsavel e canal.",
    },
    {
      id: "board",
      label: "Quadro",
      intent: "Mover o trabalho por status (pendente, em andamento, atrasada, concluida).",
      tradeoff: "Dilui a leitura de prazo quando ha muitas tarefas.",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
