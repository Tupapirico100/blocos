import * as React from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Panel,
  SectionHeader,
  Select,
  useBlocosLocale,
  type BadgeTone,
  type BlocosFormat,
  type Column,
} from "@blocos/ui";
import { formatMinutes, localDateKey, localToUtc, minutesSinceMidnight, utcToLocal } from "@blocos/core";
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
  /** ISO 8601 com deslocamento. Mostrado no fuso do LocaleProvider (padrao America/Sao_Paulo). */
  startsAt: string;
  endsAt: string;
  /** Rotulo proprio do estado (ex.: CRM-HOF "En sala de espera"); padrao: o do `status`. */
  statusLabel?: string;
  /** Cor propria do estado; padrao: a do `status`. */
  statusTone?: BadgeTone;
  /** Linhas extras no painel da consulta (servico, sala, retorno...). */
  detail?: string[];
  /** Aviso no painel (ex.: falta o consentimento para cobrar). */
  notice?: string;
  /** Historico da consulta (quem mudou, quando, por que), uma linha por mudanca. */
  history?: string[];
  /**
   * Acoes desta consulta, decididas por quem chama (estado, papel, regras).
   * Quando existe, substitui o seletor de status e os botoes fixos (reagendar,
   * cancelar, compareceu, faltou) na lista e no painel. Cada clique chama
   * `onAction(acao.id, { id, reason? })`.
   */
  actions?: AgendaActionSpec[];
}

/** Uma acao de consulta definida pelos dados. */
export interface AgendaActionSpec {
  /** Nome passado a `onAction` (ex.: "appointment.confirm"). */
  id: string;
  label: string;
  tone?: "primary" | "secondary" | "danger";
  /** Pede confirmacao antes de executar. */
  confirm?: { title: string; description?: string; confirmLabel?: string; tone?: "danger" | "primary" };
  /** Pede um motivo obrigatorio antes de executar (vai em `payload.reason`). */
  reason?: { title: string; label: string; confirmLabel?: string };
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
  /** Legenda propria dos estados; `[]` esconde. Padrao: os 5 estados do bloco. */
  legend?: Array<{ label: string; tone: BadgeTone }>;
  /** Uma acao esta em andamento: os botoes de acao ficam travados. */
  busy?: boolean;
}

/* ------------------------------------------------------------------ */
/* Regras de apresentacao                                              */
/* ------------------------------------------------------------------ */

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

function localParts(tz: string, iso: string) {
  return utcToLocal(tz, new Date(iso));
}

function timeLabel(tz: string, iso: string): string {
  return formatMinutes(minutesSinceMidnight(localParts(tz, iso)));
}

function dayKeyOf(tz: string, iso: string): string {
  return localDateKey(tz, new Date(iso));
}

function hourOf(tz: string, iso: string): number {
  return localParts(tz, iso).hour;
}

/** Deslocamento "+HH:MM"/"-HH:MM" do fuso naquela data e hora locais (Sao Paulo -> "-03:00"). */
function offsetFor(tz: string, dateValue: string, timeValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const local = { year: year!, month: month!, day: day!, hour: hour ?? 0, minute: minute ?? 0, second: 0 };
  const utc = localToUtc(tz, local);
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const minutes = Math.round((asUtc - utc.getTime()) / 60000);
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function isoFrom(tz: string, dateValue: string, timeValue: string): string {
  return `${dateValue}T${timeValue}:00${offsetFor(tz, dateValue, timeValue)}`;
}

const statusLabelOf = (L: BlocosFormat, a: Pick<AgendaAppointment, "status" | "statusLabel">) =>
  a.statusLabel ?? L.t(`agenda.status.${a.status}`, STATUS_LABEL[a.status]);
const statusToneOf = (a: Pick<AgendaAppointment, "status" | "statusTone">) => a.statusTone ?? STATUS_TONE[a.status];

/** Nome acessivel unico: "Confirmar — Joana Prado" (o botao se repete em cada linha). */
const actionName = (L: BlocosFormat, action: AgendaActionSpec, a: AgendaAppointment) =>
  L.t("agenda.actionFor", "{action} — {patient}", { action: action.label, patient: a.patientName });

const ACTION_VARIANT = { primary: "primary", secondary: "secondary", danger: "danger" } as const;

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

  const L = useBlocosLocale();
  const { t } = L;
  const tz = L.config.timeZone;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  /** Acao definida pelos dados esperando confirmacao ou motivo. */
  const [pending, setPending] = React.useState<{ appointment: AgendaAppointment; action: AgendaActionSpec } | null>(null);
  const [reasonText, setReasonText] = React.useState("");
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
    const parts = localParts(tz, appointment.startsAt);
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
      minutesSinceMidnight(localParts(tz, appointment.endsAt)) -
      minutesSinceMidnight(localParts(tz, appointment.startsAt));
    const startsAt = isoFrom(tz, newDate, newTime);
    const endParts = localParts(tz, startsAt);
    const endMinutes = minutesSinceMidnight(endParts) + (durationMinutes || 30);
    const endsAt = isoFrom(tz, newDate, formatMinutes(endMinutes % 1440));
    onAction?.("appointment.reschedule", { id: appointment.id, startsAt, endsAt });
    setRescheduling(false);
  }

  /** Acao definida pelos dados: direto, ou pelo dialogo de confirmacao/motivo. */
  function runAction(appointment: AgendaAppointment, action: AgendaActionSpec) {
    if (action.confirm || action.reason) {
      setReasonText("");
      setPending({ appointment, action });
      return;
    }
    void onAction?.(action.id, { id: appointment.id });
  }

  const legendItems =
    data.legend ??
    (Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((status) => ({
      label: t(`agenda.status.${status}`, STATUS_LABEL[status]),
      tone: STATUS_TONE[status],
    }));

  const legend = (
    <div className="flex flex-wrap items-center gap-1.5">
      {legendItems.map((item) => (
        <Badge key={item.label} tone={item.tone}>
          {item.label}
        </Badge>
      ))}
    </div>
  );

  const actionButtons = (appointment: AgendaAppointment, size: "sm" = "sm") =>
    (appointment.actions ?? []).map((action) => (
      <Button
        key={action.id}
        size={size}
        variant={ACTION_VARIANT[action.tone ?? "secondary"]}
        aria-label={actionName(L, action, appointment)}
        disabled={data.busy}
        onClick={() => runAction(appointment, action)}
      >
        {action.label}
      </Button>
    ));

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
            title={t("agenda.emptyTitle", "Nenhum agendamento")}
            description={t("agenda.emptyDescription", "Os agendamentos chegam sozinhos assim que a agenda do consultorio for criada.")}
          />
        }
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow={t("agenda.eyebrow", "Agenda")}
          title={t("agenda.title", "Agenda de consultas")}
          description={t("agenda.description", "Grade por profissional e por hora. Horarios em {tz}.", { tz })}
          actions={
            <Badge tone="info" icon={<Clock3 size={12} aria-hidden />}>
              {t("agenda.timeZone", "Fuso {tz}", { tz })}
            </Badge>
          }
        />

        {/* A legenda fica em uma linha propria: dentro do cabecalho ela consumia
            toda a largura e o titulo do bloco ficava com 0px (invisivel). */}
        {legendItems.length > 0 ? <div className="flex flex-wrap items-center gap-2">{legend}</div> : null}

        {variant === "list" ? (
          <AgendaList
            appointments={appointments}
            professionals={data.professionals}
            onSelect={pick}
            onReschedule={startReschedule}
            selectedId={selectedId}
            onStatus={setStatus}
            onCancel={cancel}
            actionButtons={actionButtons}
          />
        ) : (
          <ScheduleGrid
            variant={variant}
            appointments={appointments}
            professionals={data.professionals}
            hours={hours}
            tz={tz}
            L={L}
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
                  {selected.type} · {timeLabel(tz, selected.startsAt)}–{timeLabel(tz, selected.endsAt)}
                </p>
                {(selected.detail ?? []).map((line) => (
                  <p key={line} className="bloco-caption text-fg-muted">
                    {line}
                  </p>
                ))}
              </div>
              <Badge tone={statusToneOf(selected)}>{statusLabelOf(L, selected)}</Badge>
            </div>

            {selected.notice ? (
              <p role="status" className="bloco-callout rounded-[var(--r-md)] border border-warn bg-warn-soft px-3 py-2 text-warn">
                {selected.notice}
              </p>
            ) : null}

            {selected.actions ? (
              <div className="flex flex-wrap items-center gap-2">{actionButtons(selected)}</div>
            ) : (
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
            )}

            {selected.history && selected.history.length > 0 ? (
              <details className="border-t border-border pt-3">
                <summary className="bloco-callout cursor-pointer font-medium text-fg-secondary">
                  {t("agenda.historyTitle", "Historico da consulta")}
                </summary>
                <ol className="bloco-caption mt-2 flex list-decimal flex-col gap-1 pl-5 text-fg-muted">
                  {selected.history.map((line, index) => (
                    <li key={`${index}-${line}`}>{line}</li>
                  ))}
                </ol>
              </details>
            ) : null}

            {rescheduling && !selected.actions ? (
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
            ? `A consulta de ${consultaEmConfirmacao.patientName} em ${timeLabel(tz, consultaEmConfirmacao.startsAt)} sera cancelada e o horario volta a ficar livre para outro paciente. O paciente precisa ser avisado. Para reverter, reagende o atendimento em outro horario.`
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

      {pending?.action.confirm && !pending.action.reason ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={pending.action.confirm.title}
          description={pending.action.confirm.description}
          confirmLabel={pending.action.confirm.confirmLabel ?? pending.action.label}
          tone={pending.action.confirm.tone ?? (pending.action.tone === "danger" ? "danger" : "primary")}
          onConfirm={() => {
            void onAction?.(pending.action.id, { id: pending.appointment.id });
          }}
        />
      ) : null}

      {pending?.action.reason ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={pending.action.reason.title}
          size="sm"
          footer={
            <>
              <Button type="button" variant="ghost" onClick={() => setPending(null)}>
                {t("ui.cancel", "Cancelar")}
              </Button>
              <Button
                type="submit"
                form="agenda-reason-form"
                variant={ACTION_VARIANT[pending.action.tone ?? "secondary"]}
                disabled={reasonText.trim() === "" || data.busy}
              >
                {pending.action.reason.confirmLabel ?? pending.action.label}
              </Button>
            </>
          }
        >
          <form
            id="agenda-reason-form"
            onSubmit={(event) => {
              event.preventDefault();
              const reason = reasonText.trim();
              if (!reason) return;
              void onAction?.(pending.action.id, { id: pending.appointment.id, reason });
              setPending(null);
            }}
          >
            <Field label={pending.action.reason.label} required htmlFor="agenda-reason-input">
              <Input
                id="agenda-reason-input"
                name="reason"
                required
                autoFocus
                value={reasonText}
                onChange={(event) => setReasonText(event.target.value)}
              />
            </Field>
          </form>
        </Dialog>
      ) : null}
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
  tz,
  L,
  days,
  referenceDate,
  onSelect,
  selectedId,
}: {
  variant: "day" | "week";
  appointments: AgendaAppointment[];
  professionals: AgendaProfessional[];
  hours: number[];
  tz: string;
  L: BlocosFormat;
  days?: string[];
  referenceDate?: string;
  onSelect: (appointment: AgendaAppointment) => void;
  selectedId: string | null;
}) {
  const { t } = L;
  const columns: GridColumn[] =
    variant === "day"
      ? professionals.map((p) => ({ id: p.id, title: p.name, subtitle: p.specialty }))
      : (days ?? []).map((day) => ({ id: day, title: day.slice(8, 10), subtitle: day.slice(5, 7) }));

  const keyOf = (appointment: AgendaAppointment): string =>
    variant === "day" ? appointment.professionalId : dayKeyOf(tz, appointment.startsAt);

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
          <span className="bloco-micro">{t("agenda.col.time", "Hora")}</span>
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
                (a) => keyOf(a) === col.id && hourOf(tz, a.startsAt) === hour,
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
                      <span className="bloco-micro tabular-nums">{timeLabel(tz, appointment.startsAt)}</span>
                      <span className="bloco-caption truncate font-medium text-fg">
                        {appointment.patientName}
                      </span>
                      <span className="bloco-micro truncate" title={appointment.type}>{appointment.type}</span>
                      <Badge tone={statusToneOf(appointment)} size="sm">
                        {statusLabelOf(L, appointment)}
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
        <p className="bloco-micro mt-2">
          {t("agenda.weekOf", "Semana de referencia a partir de {date}.", { date: referenceDate })}
        </p>
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
  actionButtons,
}: {
  appointments: AgendaAppointment[];
  professionals: AgendaProfessional[];
  onSelect: (appointment: AgendaAppointment) => void;
  onReschedule: (appointment: AgendaAppointment) => void;
  selectedId: string | null;
  onStatus: (appointment: AgendaAppointment, status: AppointmentStatus) => void;
  onCancel: (appointment: AgendaAppointment) => void;
  actionButtons: (appointment: AgendaAppointment) => React.ReactNode;
}) {
  const L = useBlocosLocale();
  const { t } = L;
  const tz = L.config.timeZone;
  const sorted = [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const columns: Array<Column<AgendaAppointment>> = [
    {
      key: "time",
      header: t("agenda.col.time", "Hora"),
      width: "96px",
      render: (row) => (
        <span className="tabular-nums text-fg">
          {timeLabel(tz, row.startsAt)}–{timeLabel(tz, row.endsAt)}
        </span>
      ),
    },
    {
      key: "patient",
      header: t("agenda.col.patient", "Paciente"),
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
      header: t("agenda.col.professional", "Profissional"),
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
      header: t("agenda.col.type", "Tipo"),
      render: (row) => <span>{row.type}</span>,
    },
    {
      key: "status",
      header: t("agenda.col.status", "Status"),
      render: (row) =>
        row.actions ? (
          <Badge tone={statusToneOf(row)}>{statusLabelOf(L, row)}</Badge>
        ) : (
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
      header: t("agenda.col.actions", "Acoes"),
      align: "right",
      render: (row) =>
        row.actions ? (
          <div className="flex flex-wrap items-center justify-end gap-1">{actionButtons(row)}</div>
        ) : (
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
