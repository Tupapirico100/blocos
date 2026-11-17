import * as React from "react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Input,
  Panel,
  SectionHeader,
  type BadgeTone,
  type Column,
} from "@blocos/ui";
import { localDateKey, utcToLocal } from "@blocos/core";
import { CheckCircle2, Clock3, ListTodo, RotateCcw } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { followUpTasksRecipe } from "./follow-up-tasks.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type FollowUpType = "retorno" | "resultado" | "recuperacao";
export type FollowUpStatus = "pendente" | "em_andamento" | "concluida" | "atrasada";
export type FollowUpVariant = "list" | "calendar" | "board";

export interface FollowUpTask {
  id: string;
  patientId: string;
  patientName: string;
  type: FollowUpType;
  /** Prazo (ISO 8601 com deslocamento local). */
  dueAt: string;
  ownerId: string;
  ownerName: string;
  status: FollowUpStatus;
  channel?: "whatsapp" | "ligacao" | "email";
}

export interface FollowUpData {
  tasks: FollowUpTask[];
  /** Dias (ISO) usados na variacao "calendar". */
  days?: string[];
}

/* ------------------------------------------------------------------ */
/* Vocabulario                                                         */
/* ------------------------------------------------------------------ */

const TZ = "America/Sao_Paulo";
const SAO_PAULO_OFFSET = "-03:00";

const TYPE_LABEL: Record<FollowUpType, string> = {
  retorno: "Retorno",
  resultado: "Resultado de exame",
  recuperacao: "Recuperacao",
};

const TYPE_TONE: Record<FollowUpType, BadgeTone> = {
  retorno: "accent",
  resultado: "info",
  recuperacao: "warn",
};

const STATUS_LABEL: Record<FollowUpStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluida",
  atrasada: "Atrasada",
};

const STATUS_TONE: Record<FollowUpStatus, BadgeTone> = {
  pendente: "info",
  em_andamento: "accent",
  concluida: "success",
  atrasada: "danger",
};

const STATUS_ORDER: FollowUpStatus[] = ["pendente", "em_andamento", "atrasada", "concluida"];

function dayKeyOf(iso: string): string {
  return localDateKey(TZ, new Date(iso));
}

function dueLabel(iso: string): string {
  const parts = utcToLocal(TZ, new Date(iso));
  const hh = String(parts.hour).padStart(2, "0");
  const mm = String(parts.minute).padStart(2, "0");
  return `${parts.day.toString().padStart(2, "0")}/${parts.month.toString().padStart(2, "0")} ${hh}:${mm}`;
}

function localInputValue(iso: string): string {
  const parts = utcToLocal(TZ, new Date(iso));
  const hh = String(parts.hour).padStart(2, "0");
  const mm = String(parts.minute).padStart(2, "0");
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${hh}:${mm}:00`;
}

/* ------------------------------------------------------------------ */
/* Helpers de rotulo (nomes acessiveis unicos)                         */
/* ------------------------------------------------------------------ */

/** "Concluir tarefa de retorno de Joana Prado" — sem contexto o botao se repete. */
function completeLabel(task: FollowUpTask): string {
  return `Concluir tarefa de ${TYPE_LABEL[task.type].toLowerCase()} de ${task.patientName}`;
}

/** "Reagendar tarefa de retorno de Joana Prado". */
function rescheduleLabel(task: FollowUpTask): string {
  return `Reagendar tarefa de ${TYPE_LABEL[task.type].toLowerCase()} de ${task.patientName}`;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function FollowUpTasks(props: BlockProps<FollowUpData, FollowUpVariant>) {
  const {
    data,
    onAction,
    variant = "list",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rescheduling, setRescheduling] = React.useState(false);
  const [newDue, setNewDue] = React.useState("");

  const tasks = data.tasks ?? [];
  const effectiveState = state === "success" && tasks.length === 0 ? "empty" : state;

  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  function select(task: FollowUpTask) {
    setRescheduling(false);
    setSelectedId((current) => (current === task.id ? null : task.id));
    setNewDue(localInputValue(task.dueAt));
  }

  function startReschedule(task: FollowUpTask) {
    setNewDue(localInputValue(task.dueAt));
    setSelectedId(task.id);
    setRescheduling(true);
  }

  function complete(task: FollowUpTask) {
    onAction?.("task.complete", { id: task.id, type: task.type });
  }

  function reschedule(task: FollowUpTask) {
    if (!newDue) return;
    const dueAt = `${newDue.slice(0, 10)}T${newDue.slice(11, 16)}:00${SAO_PAULO_OFFSET}`;
    onAction?.("task.reschedule", { id: task.id, dueAt });
    setRescheduling(false);
  }

  return (
    <BlockFrame
      state={effectiveState}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      className={className}
        recipe={followUpTasksRecipe}
        onAction={onAction}
        empty={
          <EmptyState
            icon={<ListTodo className="h-5 w-5" aria-hidden />}
            title="Nenhuma tarefa de acompanhamento"
            description="Retorno, resultado e recuperacao entram sozinhos quando a agenda marca o atendimento."
          />
        }
      >
      <div className="@container flex flex-col gap-4">
        <SectionHeader
          eyebrow="Acompanhamento"
          title="Tarefas de acompanhamento"
          description="Retorno, resultado de exame e recuperacao — com prazo e responsavel por tarefa."
          actions={
            <Badge tone="info" icon={<Clock3 size={12} aria-hidden />}>
              Fuso America/Sao_Paulo
            </Badge>
          }
        />

        {variant === "list" ? (
          <TaskTable
            tasks={tasks}
            selectedId={selectedId}
            onSelect={select}
            onReschedule={startReschedule}
            onComplete={complete}
          />
        ) : null}

        {variant === "calendar" ? (
          <TaskCalendar tasks={tasks} days={data.days} onSelect={select} selectedId={selectedId} />
        ) : null}

        {variant === "board" ? (
          <TaskBoard tasks={tasks} onSelect={select} onComplete={complete} selectedId={selectedId} />
        ) : null}

        {selected ? (
          <Panel tone="outline" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="bloco-headline">{selected.patientName}</p>
                <p className="bloco-caption text-fg-muted">
                  {TYPE_LABEL[selected.type]} · prazo {dueLabel(selected.dueAt)} ·{" "}
                  {selected.ownerName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={TYPE_TONE[selected.type]}>{TYPE_LABEL[selected.type]}</Badge>
                <Badge tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<CheckCircle2 size={14} aria-hidden />}
                aria-label={completeLabel(selected)}
                onClick={() => complete(selected)}
              >
                Concluir
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<RotateCcw size={14} aria-hidden />}
                aria-label={rescheduleLabel(selected)}
                onClick={() => setRescheduling((v) => !v)}
              >
                Reagendar
              </Button>
            </div>

            {rescheduling ? (
              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
                <label className="bloco-caption flex flex-col gap-1">
                  Novo prazo
                  <Input
                    type="datetime-local"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="h-9"
                  />
                </label>
                <Button size="sm" onClick={() => reschedule(selected)} disabled={!newDue}>
                  Confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
                  Voltar
                </Button>
              </div>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "list"                                                      */
/* ------------------------------------------------------------------ */

function TaskTable({
  tasks,
  selectedId,
  onSelect,
  onReschedule,
  onComplete,
}: {
  tasks: FollowUpTask[];
  selectedId: string | null;
  onSelect: (task: FollowUpTask) => void;
  onReschedule: (task: FollowUpTask) => void;
  onComplete: (task: FollowUpTask) => void;
}) {
  const sorted = [...tasks].sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const columns: Array<Column<FollowUpTask>> = [
    {
      key: "patient",
      header: "Paciente",
      render: (row) => (
        <button
          type="button"
          onClick={() => onSelect(row)}
          aria-current={selectedId === row.id ? "true" : undefined}
          className="inline-flex min-h-8 items-center py-2 text-left font-medium text-fg hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {row.patientName}
        </button>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (row) => <Badge tone={TYPE_TONE[row.type]}>{TYPE_LABEL[row.type]}</Badge>,
    },
    {
      key: "due",
      header: "Prazo",
      render: (row) => <span className="tabular-nums">{dueLabel(row.dueAt)}</span>,
    },
    {
      key: "owner",
      header: "Responsavel",
      render: (row) => <span>{row.ownerName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
    },
    {
      key: "actions",
      header: "Acoes",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            aria-label={completeLabel(row)}
            onClick={() => onComplete(row)}
          >
            Concluir
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label={rescheduleLabel(row)}
            onClick={() => onReschedule(row)}
          >
            Reagendar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Panel tone="outline" padding="none">
      <DataTable columns={columns} rows={sorted} rowKey={(row) => row.id} />
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "calendar"                                                  */
/* ------------------------------------------------------------------ */

function TaskCalendar({
  tasks,
  days,
  onSelect,
  selectedId,
}: {
  tasks: FollowUpTask[];
  days?: string[];
  onSelect: (task: FollowUpTask) => void;
  selectedId: string | null;
}) {
  const dayKeys = React.useMemo(() => {
    if (days?.length) return days;
    const set = new Set<string>();
    for (const task of tasks) set.add(dayKeyOf(task.dueAt));
    return [...set].sort();
  }, [days, tasks]);

  return (
    <div className="bloco-scroll overflow-x-auto">
      <div className="grid grid-cols-1 gap-3 @[520px]:grid-cols-2 @[860px]:grid-cols-4">
        {dayKeys.map((day) => {
          const dayTasks = tasks
            .filter((task) => dayKeyOf(task.dueAt) === day)
            .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
          const [, month, dayOfMonth] = day.split("-");
          return (
            <Panel key={day} tone="outline" className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="bloco-headline">
                  {dayOfMonth}/{month}
                </p>
                <Badge tone="neutral">{dayTasks.length}</Badge>
              </div>
              {dayTasks.length === 0 ? (
                <p className="bloco-micro text-fg-faint">Sem tarefas neste dia.</p>
              ) : (
                dayTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onSelect(task)}
                    aria-pressed={selectedId === task.id}
                    className={
                      "flex flex-col gap-1 rounded-[var(--r-sm)] border px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                      (selectedId === task.id
                        ? "border-accent bg-accent-soft"
                        : "border-border bg-surface-strong/50 hover:bg-surface-hover")
                    }
                  >
                    <span className="bloco-micro tabular-nums">{dueLabel(task.dueAt)}</span>
                    <span className="bloco-caption truncate font-medium text-fg">{task.patientName}</span>
                    <span className="bloco-micro truncate">{TYPE_LABEL[task.type]}</span>
                    <Badge tone={STATUS_TONE[task.status]} size="sm">
                      {STATUS_LABEL[task.status]}
                    </Badge>
                  </button>
                ))
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "board"                                                     */
/* ------------------------------------------------------------------ */

function TaskBoard({
  tasks,
  onSelect,
  onComplete,
  selectedId,
}: {
  tasks: FollowUpTask[];
  onSelect: (task: FollowUpTask) => void;
  onComplete: (task: FollowUpTask) => void;
  selectedId: string | null;
}) {
  return (
    <div className="bloco-scroll overflow-x-auto">
      <div className="grid grid-cols-1 gap-3 @[520px]:grid-cols-2 @[860px]:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const column = tasks.filter((task) => task.status === status);
          return (
            <Panel key={status} tone="outline" className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="bloco-headline">{STATUS_LABEL[status]}</p>
                <Badge tone={STATUS_TONE[status]}>{column.length}</Badge>
              </div>
              {column.length === 0 ? (
                <p className="bloco-micro flex items-center gap-1 text-fg-faint">
                  <ListTodo size={12} aria-hidden />
                  Nenhuma tarefa.
                </p>
              ) : (
                column.map((task) => (
                  <div
                    key={task.id}
                    className={
                      "flex flex-col gap-1.5 rounded-[var(--r-sm)] border px-2.5 py-2 " +
                      (selectedId === task.id ? "border-accent bg-accent-soft" : "border-border bg-surface-strong/50")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(task)}
                      className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="bloco-caption block truncate font-medium text-fg">
                        {task.patientName}
                      </span>
                      <span className="bloco-micro block truncate">{TYPE_LABEL[task.type]}</span>
                      <span className="bloco-micro block tabular-nums">
                        Prazo {dueLabel(task.dueAt)}
                      </span>
                      <span className="bloco-micro block truncate">{task.ownerName}</span>
                    </button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      aria-label={completeLabel(task)}
                      onClick={() => onComplete(task)}
                    >
                      Concluir
                    </Button>
                  </div>
                ))
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
