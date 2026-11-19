import * as React from "react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Input,
  Panel,
  SectionHeader,
  useBlocosLocale,
  type BadgeTone,
  type BlocosFormat,
  type Column,
} from "@blocos/ui";
import { localDateKey, localToUtc, utcToLocal } from "@blocos/core";
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
  patientId?: string;
  /** Paciente da tarefa. Opcional quando a tarefa tem `label` (tarefa livre, sem paciente). */
  patientName?: string;
  /** Tipo fixo. Opcional quando a tarefa tem `label`. */
  type?: FollowUpType;
  /** Titulo livre da tarefa (ex.: "Llamar para control de 15 dias"). Quando existe, substitui o tipo. */
  label?: string;
  /** Linha de apoio sob o titulo (ex.: o servico). */
  detail?: string;
  /** Prazo (ISO 8601 com deslocamento local). */
  dueAt: string;
  ownerId?: string;
  ownerName?: string;
  status: FollowUpStatus;
  channel?: "whatsapp" | "ligacao" | "email";
}

export interface FollowUpData {
  tasks: FollowUpTask[];
  /** Dias (ISO) usados na variacao "calendar". */
  days?: string[];
  /** Coluna de responsavel. Padrao: sim. */
  showOwner?: boolean;
  /** Coluna de tipo. Padrao: sim. */
  showType?: boolean;
  /** Botao "Abrir" no detalhe da tarefa (acao `task.open`). Padrao: nao. */
  canOpen?: boolean;
  /** Cabecalho do bloco. Padrao: sim. */
  showHeader?: boolean;
}

interface TaskView {
  L: BlocosFormat;
  tz: string;
  showOwner: boolean;
  showType: boolean;
}

/* ------------------------------------------------------------------ */
/* Vocabulario                                                         */
/* ------------------------------------------------------------------ */


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

function dayKeyOf(tz: string, iso: string): string {
  return localDateKey(tz, new Date(iso));
}

function dueLabel(tz: string, iso: string): string {
  const parts = utcToLocal(tz, new Date(iso));
  const hh = String(parts.hour).padStart(2, "0");
  const mm = String(parts.minute).padStart(2, "0");
  return `${parts.day.toString().padStart(2, "0")}/${parts.month.toString().padStart(2, "0")} ${hh}:${mm}`;
}

function localInputValue(tz: string, iso: string): string {
  const parts = utcToLocal(tz, new Date(iso));
  const hh = String(parts.hour).padStart(2, "0");
  const mm = String(parts.minute).padStart(2, "0");
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${hh}:${mm}:00`;
}

/* ------------------------------------------------------------------ */
/* Helpers de rotulo (nomes acessiveis unicos)                         */
/* ------------------------------------------------------------------ */

/** Deslocamento "+HH:MM"/"-HH:MM" de um fuso numa data e hora locais (ex.: Sao Paulo -> "-03:00"). */
function offsetFor(tz: string, localValue: string): string {
  const [date = "", time = ""] = localValue.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const local = { year: year!, month: month!, day: day!, hour: hour ?? 0, minute: minute ?? 0, second: 0 };
  const utc = localToUtc(tz, local);
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const minutes = Math.round((asUtc - utc.getTime()) / 60000);
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** Titulo da tarefa: o livre, se houver; senao o tipo. */
function taskTitle(L: BlocosFormat, task: FollowUpTask): string {
  if (task.label) return task.label;
  return task.type ? L.t(`tasks.type.${task.type}`, TYPE_LABEL[task.type]) : "";
}

/** "Concluir tarefa de retorno de Joana Prado" — sem contexto o botao se repete. */
function completeLabel(L: BlocosFormat, task: FollowUpTask): string {
  if (task.label) return L.t("tasks.completeNamed", "Concluir {title}", { title: task.label });
  return `Concluir tarefa de ${TYPE_LABEL[task.type!].toLowerCase()} de ${task.patientName ?? ""}`;
}

/** "Reagendar tarefa de retorno de Joana Prado". */
function rescheduleLabel(L: BlocosFormat, task: FollowUpTask): string {
  if (task.label) return L.t("tasks.rescheduleNamed", "Reagendar {title}", { title: task.label });
  return `Reagendar tarefa de ${TYPE_LABEL[task.type!].toLowerCase()} de ${task.patientName ?? ""}`;
}

const statusLabel = (L: BlocosFormat, s: FollowUpStatus) => L.t(`tasks.status.${s}`, STATUS_LABEL[s]);

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

  const L = useBlocosLocale();
  const { t } = L;
  const tz = L.config.timeZone;
  const view: TaskView = { L, tz, showOwner: data.showOwner !== false, showType: data.showType !== false };
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rescheduling, setRescheduling] = React.useState(false);
  const [newDue, setNewDue] = React.useState("");

  const tasks = data.tasks ?? [];
  const effectiveState = state === "success" && tasks.length === 0 ? "empty" : state;

  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  function select(task: FollowUpTask) {
    setRescheduling(false);
    setSelectedId((current) => (current === task.id ? null : task.id));
    setNewDue(localInputValue(tz, task.dueAt));
  }

  function startReschedule(task: FollowUpTask) {
    setNewDue(localInputValue(tz, task.dueAt));
    setSelectedId(task.id);
    setRescheduling(true);
  }

  function complete(task: FollowUpTask) {
    onAction?.("task.complete", { id: task.id, type: task.type });
  }

  function reschedule(task: FollowUpTask) {
    if (!newDue) return;
    const dueDate = newDue.slice(0, 10);
    const dueTime = newDue.slice(11, 16);
    // O deslocamento e o do fuso do programa naquela data (padrao Sao Paulo, "-03:00").
    const dueAt = `${dueDate}T${dueTime}:00${offsetFor(tz, newDue)}`;
    onAction?.("task.reschedule", { id: task.id, dueAt, dueDate, dueTime });
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
            title={t("tasks.emptyTitle", "Nenhuma tarefa de acompanhamento")}
            description={t("tasks.emptyDescription", "Retorno, resultado e recuperacao entram sozinhos quando a agenda marca o atendimento.")}
          />
        }
      >
      <div className="@container flex flex-col gap-4">
        {data.showHeader === false ? null : (
          <SectionHeader
            eyebrow={t("tasks.eyebrow", "Acompanhamento")}
            title={t("tasks.title", "Tarefas de acompanhamento")}
            description={t("tasks.description", "Retorno, resultado de exame e recuperacao — com prazo e responsavel por tarefa.")}
            actions={
              <Badge tone="info" icon={<Clock3 size={12} aria-hidden />}>
                {t("tasks.timeZone", "Fuso {tz}", { tz })}
              </Badge>
            }
          />
        )}

        {variant === "list" ? (
          <TaskTable
            view={view}
            tasks={tasks}
            selectedId={selectedId}
            onSelect={select}
            onReschedule={startReschedule}
            onComplete={complete}
          />
        ) : null}

        {variant === "calendar" ? (
          <TaskCalendar view={view} tasks={tasks} days={data.days} onSelect={select} selectedId={selectedId} />
        ) : null}

        {variant === "board" ? (
          <TaskBoard view={view} tasks={tasks} onSelect={select} onComplete={complete} selectedId={selectedId} />
        ) : null}

        {selected ? (
          <Panel tone="outline" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {selected.label ? (
                  <>
                    <p className="bloco-headline">{selected.label}</p>
                    <p className="bloco-caption text-fg-muted">
                      {[selected.patientName, selected.detail, t("tasks.duePrefix", "prazo {due}", { due: dueLabel(tz, selected.dueAt) }), view.showOwner ? selected.ownerName : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="bloco-headline">{selected.patientName}</p>
                    <p className="bloco-caption text-fg-muted">
                      {TYPE_LABEL[selected.type!]} · prazo {dueLabel(tz, selected.dueAt)} ·{" "}
                      {selected.ownerName}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selected.type && view.showType ? (
                  <Badge tone={TYPE_TONE[selected.type]}>{taskTitle(L, { ...selected, label: undefined })}</Badge>
                ) : null}
                <Badge tone={STATUS_TONE[selected.status]}>{statusLabel(L, selected.status)}</Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<CheckCircle2 size={14} aria-hidden />}
                aria-label={completeLabel(L, selected)}
                onClick={() => complete(selected)}
              >
                {t("tasks.complete", "Concluir")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<RotateCcw size={14} aria-hidden />}
                aria-label={rescheduleLabel(L, selected)}
                onClick={() => setRescheduling((v) => !v)}
              >
                {t("tasks.reschedule", "Reagendar")}
              </Button>
              {data.canOpen ? (
                <Button size="sm" variant="ghost" onClick={() => void onAction?.("task.open", { id: selected.id })}>
                  {t("tasks.open", "Abrir")}
                </Button>
              ) : null}
            </div>

            {rescheduling ? (
              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
                <label className="bloco-caption flex flex-col gap-2">
                  {t("tasks.newDue", "Novo prazo")}
                  <Input
                    type="datetime-local"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="h-9"
                  />
                </label>
                <Button size="sm" onClick={() => reschedule(selected)} disabled={!newDue}>
                  {t("tasks.confirm", "Confirmar")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
                  {t("tasks.back", "Voltar")}
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
  view,
  tasks,
  selectedId,
  onSelect,
  onReschedule,
  onComplete,
}: {
  view: TaskView;
  tasks: FollowUpTask[];
  selectedId: string | null;
  onSelect: (task: FollowUpTask) => void;
  onReschedule: (task: FollowUpTask) => void;
  onComplete: (task: FollowUpTask) => void;
}) {
  const { L, tz, showOwner, showType } = view;
  const { t } = L;
  const sorted = [...tasks].sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const columns: Array<Column<FollowUpTask>> = [
    {
      key: "patient",
      header: t("tasks.col.patient", "Paciente"),
      render: (row) =>
        row.label ? (
          <div className="flex min-w-0 flex-col">
            <button
              type="button"
              onClick={() => onSelect(row)}
              aria-current={selectedId === row.id ? "true" : undefined}
              className="inline-flex min-h-8 items-center py-1 text-left font-medium text-fg hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {row.label}
            </button>
            {row.patientName || row.detail ? (
              <span className="bloco-caption text-fg-muted">{[row.patientName, row.detail].filter(Boolean).join(" · ")}</span>
            ) : null}
          </div>
        ) : (
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
  ];
  if (showType) {
    columns.push({
      key: "type",
      header: t("tasks.col.type", "Tipo"),
      render: (row) => (row.type ? <Badge tone={TYPE_TONE[row.type]}>{taskTitle(L, { ...row, label: undefined })}</Badge> : null),
    });
  }
  columns.push({
    key: "due",
    header: t("tasks.col.due", "Prazo"),
    render: (row) => <span className="tabular-nums">{dueLabel(tz, row.dueAt)}</span>,
  });
  if (showOwner) {
    columns.push({
      key: "owner",
      header: t("tasks.col.owner", "Responsavel"),
      render: (row) => <span>{row.ownerName}</span>,
    });
  }
  columns.push(
    {
      key: "status",
      header: t("tasks.col.status", "Status"),
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{statusLabel(L, row.status)}</Badge>,
    },
    {
      key: "actions",
      header: t("tasks.col.actions", "Acoes"),
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            aria-label={completeLabel(L, row)}
            onClick={() => onComplete(row)}
          >
            {t("tasks.complete", "Concluir")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label={rescheduleLabel(L, row)}
            onClick={() => onReschedule(row)}
          >
            {t("tasks.reschedule", "Reagendar")}
          </Button>
        </div>
      ),
    },
  );

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
  view,
  tasks,
  days,
  onSelect,
  selectedId,
}: {
  view: TaskView;
  tasks: FollowUpTask[];
  days?: string[];
  onSelect: (task: FollowUpTask) => void;
  selectedId: string | null;
}) {
  const { L, tz } = view;
  const { t } = L;
  const dayKeys = React.useMemo(() => {
    if (days?.length) return days;
    const set = new Set<string>();
    for (const task of tasks) set.add(dayKeyOf(tz, task.dueAt));
    return [...set].sort();
  }, [days, tasks, tz]);

  return (
    <div className="bloco-scroll overflow-x-auto">
      <div className="grid grid-cols-1 gap-3 @[520px]:grid-cols-2 @[860px]:grid-cols-4">
        {dayKeys.map((day) => {
          const dayTasks = tasks
            .filter((task) => dayKeyOf(tz, task.dueAt) === day)
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
                <p className="bloco-micro text-fg-faint">{t("tasks.noneDay", "Sem tarefas neste dia.")}</p>
              ) : (
                dayTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onSelect(task)}
                    aria-pressed={selectedId === task.id}
                    className={
                      "flex flex-col gap-2 rounded-[var(--r-sm)] border px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                      (selectedId === task.id
                        ? "border-accent bg-accent-soft"
                        : "border-border bg-surface-strong/50 hover:bg-surface-hover")
                    }
                  >
                    <span className="bloco-micro tabular-nums">{dueLabel(tz, task.dueAt)}</span>
                    <span className="bloco-caption truncate font-medium text-fg">{task.label ?? task.patientName}</span>
                    <span className="bloco-micro truncate">{task.label ? task.patientName : taskTitle(L, task)}</span>
                    <Badge tone={STATUS_TONE[task.status]} size="sm">
                      {statusLabel(L, task.status)}
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
  view,
  tasks,
  onSelect,
  onComplete,
  selectedId,
}: {
  view: TaskView;
  tasks: FollowUpTask[];
  onSelect: (task: FollowUpTask) => void;
  onComplete: (task: FollowUpTask) => void;
  selectedId: string | null;
}) {
  const { L, tz, showOwner } = view;
  const { t } = L;
  return (
    <div className="bloco-scroll overflow-x-auto">
      <div className="grid grid-cols-1 gap-3 @[520px]:grid-cols-2 @[860px]:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const column = tasks.filter((task) => task.status === status);
          return (
            <Panel key={status} tone="outline" className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="bloco-headline">{statusLabel(L, status)}</p>
                <Badge tone={STATUS_TONE[status]}>{column.length}</Badge>
              </div>
              {column.length === 0 ? (
                <p className="bloco-micro flex items-center gap-1 text-fg-faint">
                  <ListTodo size={12} aria-hidden />
                  {t("tasks.none", "Nenhuma tarefa.")}
                </p>
              ) : (
                column.map((task) => (
                  <div
                    key={task.id}
                    className={
                      "flex flex-col gap-2 rounded-[var(--r-sm)] border px-2.5 py-2 " +
                      (selectedId === task.id ? "border-accent bg-accent-soft" : "border-border bg-surface-strong/50")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(task)}
                      className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="bloco-caption block truncate font-medium text-fg">
                        {task.label ?? task.patientName}
                      </span>
                      <span className="bloco-micro block truncate">{task.label ? task.patientName : taskTitle(L, task)}</span>
                      <span className="bloco-micro block tabular-nums">
                        {t("tasks.dueCapital", "Prazo {due}", { due: dueLabel(tz, task.dueAt) })}
                      </span>
                      {showOwner ? <span className="bloco-micro block truncate">{task.ownerName}</span> : null}
                    </button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      aria-label={completeLabel(L, task)}
                      onClick={() => onComplete(task)}
                    >
                      {t("tasks.complete", "Concluir")}
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
