import * as React from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  IconButton,
  Input,
  Panel,
  SectionHeader,
  Select,
  type BadgeTone,
  type Column,
} from "@blocos/ui";
import { formatMinutes, localDateKey, minutesSinceMidnight, utcToLocal } from "@blocos/core";
import { CalendarClock, CheckCircle2, Clock3, Repeat, UserRound, XCircle } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { agendaBoardRecipe } from "./agenda-board.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type AppointmentStatus = "agendado" | "confirmado" | "compareceu" | "faltou" | "cancelado";

export type AgendaVariant = "day" | "week" | "list";

export interface AgendaProfessional {
  id: string;
  name: string;
  specialty: string;
}

export interface AgendaAppointment {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  /** Tipo do atendimento (ex.: "Avaliacao inicial"). */
  type: string;
  status: AppointmentStatus;
  /** ISO 8601 com deslocamento local. Interpretado em America/Sao_Paulo. */
  startsAt: string;
  endsAt: string;
}

export interface AgendaBoardData {
  professionals: AgendaProfessional[];
  appointments: AgendaAppointment[];
  /** Dias (ISO) usados na variacao "week". */
  days?: string[];
  /** Horas do dia cobertas pela grade (0-23). */
  hours?: number[];
  /** Data de referencia (ISO) da variacao "day". */
  referenceDate?: string;
}

/* ------------------------------------------------------------------ */
/* Regras de apresentacao                                              */
/* ------------------------------------------------------------------ */

const TZ = "America/Sao_Paulo";
const SAO_PAULO_OFFSET = "-03:00";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  compareceu: "Compareceu",
  faltou: "Faltou",
  cancelado: "Cancelado",
};

const STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  agendado: "info",
  confirmado: "accent",
  compareceu: "success",
  faltou: "danger",
  cancelado: "neutral",
};

const DEFAULT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

function localParts(iso: string) {
  return utcToLocal(TZ, new Date(iso));
}

function timeLabel(iso: string): string {
  return formatMinutes(minutesSinceMidnight(localParts(iso)));
}

function dayKeyOf(iso: string): string {
  return localDateKey(TZ, new Date(iso));
}

function hourOf(iso: string): number {
  return localParts(iso).hour;
}

function isoFrom(dateValue: string, timeValue: string): string {
  return `${dateValue}T${timeValue}:00${SAO_PAULO_OFFSET}`;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function AgendaBoard(props: BlockProps<AgendaBoardData, AgendaVariant>) {
  const {
    data,
    onAction,
    variant = "day",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rescheduling, setRescheduling] = React.useState(false);
  const [newDate, setNewDate] = React.useState("");
  const [newTime, setNewTime] = React.useState("");
  /** Confirmacao pendente de uma acao destrutiva. */
  const [confirmando, setConfirmando] = React.useState<{ acao: string; payload?: unknown } | null>(
    null,
  );

  const appointments = data.appointments ?? [];
  const hours = data.hours?.length ? data.hours : DEFAULT_HOURS;

  const selected = appointments.find((a) => a.id === selectedId) ?? null;

  const confirmPayload = (confirmando?.payload ?? {}) as { id?: string };
  const consultaEmConfirmacao =
    confirmando?.acao === "appointment.cancel"
      ? (appointments.find((a) => a.id === confirmPayload.id) ?? null)
      : null;

  const effectiveState =
    state === "success" && appointments.length === 0 ? "empty" : state;

  function pick(appointment: AgendaAppointment) {
    setRescheduling(false);
    setSelectedId((current) => (current === appointment.id ? null : appointment.id));
    const local = localInputValue(appointment);
    if (local) {
      setNewDate(local.slice(0, 10));
      setNewTime(local.slice(11, 16));
    }
  }

  function startReschedule(appointment: AgendaAppointment) {
    const local = localInputValue(appointment);
    if (local) {
      setNewDate(local.slice(0, 10));
      setNewTime(local.slice(11, 16));
    }
    setSelectedId(appointment.id);
    setRescheduling(true);
  }

  /** Valor local (sem deslocamento) para preencher o formulario de reagendamento. */
  function localInputValue(appointment: AgendaAppointment): string | null {
    const parts = localParts(appointment.startsAt);
    if (!parts) return null;
    const hh = String(parts.hour).padStart(2, "0");
    const mm = String(parts.minute).padStart(2, "0");
    const yyyy = String(parts.year);
    const mmMonth = String(parts.month).padStart(2, "0");
    const dd = String(parts.day).padStart(2, "0");
    return `${yyyy}-${mmMonth}-${dd}T${hh}:${mm}:00`;
  }

  function setStatus(appointment: AgendaAppointment, status: AppointmentStatus) {
    onAction?.("appointment.setStatus", { id: appointment.id, status });
  }

  /** Cancelar e destrutivo: passa pelo dialogo de confirmacao. */
  function cancel(appointment: AgendaAppointment) {
    setConfirmando({
      acao: "appointment.cancel",
      payload: { id: appointment.id, reason: "cancelado_pelo_usuario" },
    });
  }

  function reschedule(appointment: AgendaAppointment) {
    if (!newDate || !newTime) return;
    const durationMinutes =
      minutesSinceMidnight(localParts(appointment.endsAt)) -
      minutesSinceMidnight(localParts(appointment.startsAt));
    const startsAt = isoFrom(newDate, newTime);
    const endParts = localParts(startsAt);
    const endMinutes = minutesSinceMidnight(endParts) + (durationMinutes || 30);
    const endsAt = isoFrom(newDate, formatMinutes(endMinutes % 1440));
    onAction?.("appointment.reschedule", { id: appointment.id, startsAt, endsAt });
    setRescheduling(false);
  }

  const legend = (
    <div className="flex flex-wrap items-center gap-1.5">
      {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((status) => (
        <Badge key={status} tone={STATUS_TONE[status]}>
          {STATUS_LABEL[status]}
        </Badge>
      ))}
    </div>
  );

  return (
    <BlockFrame
      state={effectiveState}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      className={className}
        recipe={agendaBoardRecipe}
        onAction={onAction}
        empty={
          <EmptyState
            icon={<CalendarClock className="h-5 w-5" aria-hidden />}
            title="Nenhum agendamento"
            description="Os agendamentos chegam sozinhos assim que a agenda do consultorio for criada."
          />
        }
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Agenda"
          title="Agenda de consultas"
          description="Grade por profissional e por hora. Horarios em America/Sao_Paulo."
          actions={
            <Badge tone="info" icon={<Clock3 size={12} aria-hidden />}>
              Fuso America/Sao_Paulo
            </Badge>
          }
        />

        {/* A legenda fica em uma linha propria: dentro do cabecalho ela consumia
            toda a largura e o titulo do bloco ficava com 0px (invisivel). */}
        <div className="flex flex-wrap items-center gap-2">{legend}</div>

        {variant === "list" ? (
          <AgendaList
            appointments={appointments}
            professionals={data.professionals}
            onSelect={pick}
            onReschedule={startReschedule}
            selectedId={selectedId}
            onStatus={setStatus}
            onCancel={cancel}
          />
        ) : (
          <ScheduleGrid
            variant={variant}
            appointments={appointments}
            professionals={data.professionals}
            hours={hours}
            days={data.days}
            referenceDate={data.referenceDate}
            onSelect={pick}
            selectedId={selectedId}
          />
        )}

        {selected ? (
          <Panel tone="outline" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="bloco-headline">{selected.patientName}</p>
                <p className="bloco-caption text-fg-muted">
                  {selected.type} · {timeLabel(selected.startsAt)}–{timeLabel(selected.endsAt)}
                </p>
              </div>
              <Badge tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Repeat size={14} aria-hidden />}
                aria-label={`Reagendar consulta de ${selected.patientName}`}
                onClick={() => setRescheduling((v) => !v)}
              >
                Reagendar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<CheckCircle2 size={14} aria-hidden />}
                onClick={() => setStatus(selected, "compareceu")}
              >
                Compareceu
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<XCircle size={14} aria-hidden />}
                onClick={() => setStatus(selected, "faltou")}
              >
                Faltou
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={<XCircle size={14} aria-hidden />}
                onClick={() => cancel(selected)}
              >
                Cancelar atendimento
              </Button>
            </div>

            {rescheduling ? (
              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
                <label className="bloco-caption flex flex-col gap-2">
                  Nova data
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-9"
                  />
                </label>
                <label className="bloco-caption flex flex-col gap-2">
                  Nova hora
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="h-9"
                  />
                </label>
                <Button size="sm" onClick={() => reschedule(selected)} disabled={!newDate || !newTime}>
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

      <ConfirmDialog
        open={confirmando !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmando(null);
        }}
        title={
          consultaEmConfirmacao
            ? `Cancelar a consulta de ${consultaEmConfirmacao.patientName}`
            : "Cancelar atendimento"
        }
        description={
          consultaEmConfirmacao
            ? `A consulta de ${consultaEmConfirmacao.patientName} em ${timeLabel(consultaEmConfirmacao.startsAt)} sera cancelada e o horario volta a ficar livre para outro paciente. O paciente precisa ser avisado. Para reverter, reagende o atendimento em outro horario.`
            : "Esta acao nao pode ser desfeita pela interface."
        }
        confirmLabel={
          consultaEmConfirmacao ? `Cancelar consulta de ${consultaEmConfirmacao.patientName}` : "Cancelar"
        }
        onConfirm={() => {
          if (!confirmando) return;
          onAction?.(confirmando.acao, confirmando.payload);
        }}
      />
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Grade (variacoes "day" e "week")                                    */
/* ------------------------------------------------------------------ */

interface GridColumn {
  id: string;
  title: string;
  subtitle?: string;
}

function ScheduleGrid({
  variant,
  appointments,
  professionals,
  hours,
  days,
  referenceDate,
  onSelect,
  selectedId,
}: {
  variant: "day" | "week";
  appointments: AgendaAppointment[];
  professionals: AgendaProfessional[];
  hours: number[];
  days?: string[];
  referenceDate?: string;
  onSelect: (appointment: AgendaAppointment) => void;
  selectedId: string | null;
}) {
  const columns: GridColumn[] =
    variant === "day"
      ? professionals.map((p) => ({ id: p.id, title: p.name, subtitle: p.specialty }))
      : (days ?? []).map((day) => ({ id: day, title: day.slice(8, 10), subtitle: day.slice(5, 7) }));

  const keyOf = (appointment: AgendaAppointment): string =>
    variant === "day" ? appointment.professionalId : dayKeyOf(appointment.startsAt);

  /**
   * Largura minima de uma coluna de dia/profissional. Abaixo disso o nome do
   * paciente fica ilegivel ("Joana P"), entao a grade ROLA em vez de esmagar.
   */
  const MIN_COLUMN = 160;
  const totalColumns = Math.max(columns.length, 1);

  return (
    <div className="bloco-scroll overflow-x-auto">
      <div
        className="grid gap-px rounded-[var(--r-lg)] border border-border bg-border/60"
        style={{
          gridTemplateColumns: `72px repeat(${totalColumns}, minmax(${MIN_COLUMN}px, 1fr))`,
          /* a borda acompanha a grade inteira, mesmo quando ela rola */
          minWidth: `calc(72px + ${totalColumns} * ${MIN_COLUMN + 1}px)`,
        }}
      >
        <div className="bg-surface/90 px-2 py-2">
          <span className="bloco-micro">Hora</span>
        </div>
        {columns.map((col) => (
          <div key={col.id} className="bg-surface/90 px-3 py-2">
            <p className="bloco-caption truncate font-medium text-fg" title={col.title}>{col.title}</p>
            {col.subtitle ? <p className="bloco-micro truncate" title={col.subtitle}>{col.subtitle}</p> : null}
          </div>
        ))}

        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="bg-surface/70 px-2 py-1.5">
              <span className="bloco-micro tabular-nums">{String(hour).padStart(2, "0")}:00</span>
            </div>
            {columns.map((col) => {
              const cell = appointments.filter(
                (a) => keyOf(a) === col.id && hourOf(a.startsAt) === hour,
              );
              return (
                <div key={`${col.id}-${hour}`} className="min-h-[64px] bg-surface/40 p-1.5">
                  {cell.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => onSelect(appointment)}
                      aria-pressed={selectedId === appointment.id}
                      className={
                        "mb-1 flex w-full flex-col gap-1 rounded-[var(--r-sm)] border px-2 py-1.5 text-left transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                        (selectedId === appointment.id
                          ? "border-accent bg-accent-soft"
                          : "border-border bg-surface-strong/60 hover:bg-surface-hover")
                      }
                    >
                      <span className="bloco-micro tabular-nums">{timeLabel(appointment.startsAt)}</span>
                      <span className="bloco-caption truncate font-medium text-fg">
                        {appointment.patientName}
                      </span>
                      <span className="bloco-micro truncate" title={appointment.type}>{appointment.type}</span>
                      <Badge tone={STATUS_TONE[appointment.status]} size="sm">
                        {STATUS_LABEL[appointment.status]}
                      </Badge>
                    </button>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {variant === "week" && referenceDate ? (
        <p className="bloco-micro mt-2">Semana de referencia a partir de {referenceDate}.</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lista linear (variacao "list")                                      */
/* ------------------------------------------------------------------ */

function AgendaList({
  appointments,
  professionals,
  onSelect,
  onReschedule,
  selectedId,
  onStatus,
  onCancel,
}: {
  appointments: AgendaAppointment[];
  professionals: AgendaProfessional[];
  onSelect: (appointment: AgendaAppointment) => void;
  onReschedule: (appointment: AgendaAppointment) => void;
  selectedId: string | null;
  onStatus: (appointment: AgendaAppointment, status: AppointmentStatus) => void;
  onCancel: (appointment: AgendaAppointment) => void;
}) {
  const sorted = [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const columns: Array<Column<AgendaAppointment>> = [
    {
      key: "time",
      header: "Hora",
      width: "96px",
      render: (row) => (
        <span className="tabular-nums text-fg">
          {timeLabel(row.startsAt)}–{timeLabel(row.endsAt)}
        </span>
      ),
    },
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
      key: "professional",
      header: "Profissional",
      render: (row) => {
        const professional = professionals.find((p) => p.id === row.professionalId);
        return (
          <span className="flex items-center gap-1.5">
            <UserRound size={13} className="text-fg-faint" aria-hidden />
            {professional?.name ?? row.professionalId}
          </span>
        );
      },
    },
    {
      key: "type",
      header: "Tipo",
      render: (row) => <span>{row.type}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
          <Select
            aria-label={`Alterar status de ${row.patientName}`}
            value={row.status}
            onChange={(e) => onStatus(row, e.target.value as AppointmentStatus)}
            className="h-8 bloco-control-sm"
          >
            {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </Select>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Acoes",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            label={`Reagendar consulta de ${row.patientName}`}
            size="icon"
            onClick={() => {
              onSelect(row);
              onReschedule(row);
            }}
          >
            <CalendarClock size={15} aria-hidden />
          </IconButton>
          <IconButton
            label={`Cancelar atendimento de ${row.patientName}`}
            variant="danger"
            size="icon"
            onClick={() => onCancel(row)}
          >
            <XCircle size={15} aria-hidden />
          </IconButton>
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
