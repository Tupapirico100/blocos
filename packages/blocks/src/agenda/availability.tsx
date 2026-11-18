import * as React from "react";
import {
  Badge,
  Button,
  DataTable,
  IconButton,
  Panel,
  SectionHeader,
  type Column,
} from "@blocos/ui";import { formatMinutes, minutesSinceMidnight, utcToLocal } from "@blocos/core";
import { CalendarOff, Clock3, LockOpen, Unlock } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { availabilityRecipe } from "./availability.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type AvailabilityVariant = "week" | "list" | "slots";

export interface AvailabilityProfessional {
  id: string;
  name: string;
  specialty: string;
}

/** Horario de atendimento semanal de um profissional. */
export interface AvailabilityHours {
  professionalId: string;
  /** 0 = domingo ... 6 = sabado. */
  weekday: number;
  /** Minutos desde a meia-noite local. */
  startMinutes: number;
  endMinutes: number;
  /** Duracao do slot em minutos (padrao 30). */
  slotMinutes?: number;
}

/** Bloqueio de agenda (ferias, reuniao, indisponibilidade). */
export interface AvailabilityBlock {
  id: string;
  professionalId: string;
  /** Data local (YYYY-MM-DD). */
  date: string;
  startMinutes: number;
  endMinutes: number;
  reason: string;
}

/** Atendimento ja marcado — desconta do slot livre. */
export interface AvailabilityAppointment {
  id: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
}

export interface AvailabilityData {
  professionals: AvailabilityProfessional[];
  hours: AvailabilityHours[];
  blocks: AvailabilityBlock[];
  appointments?: AvailabilityAppointment[];
  /** Data de referencia (YYYY-MM-DD) da variacao "slots". */
  date?: string;
  slotMinutes?: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const TZ = "America/Sao_Paulo";
const WEEKDAYS = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

/** Dia da semana a partir de uma data local (YYYY-MM-DD), sem depender do fuso da maquina. */
function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map((v) => Number.parseInt(v, 10));
  if (!y || !m || !d) return 0;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function appointmentMinutes(iso: string): { start: number; end: number } {
  const start = minutesSinceMidnight(utcToLocal(TZ, new Date(iso)));
  return { start, end: start + 30 };
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

interface SlotState {
  start: number;
  end: number;
  free: boolean;
  reason?: string;
}

function freeSlots(
  data: AvailabilityData,
  professionalId: string,
  date: string,
): SlotState[] {
  const weekday = weekdayOf(date);
  const slotMinutes = data.slotMinutes ?? 30;
  const windows = data.hours.filter(
    (h) => h.professionalId === professionalId && h.weekday === weekday,
  );
  const blocks = data.blocks.filter(
    (b) => b.professionalId === professionalId && b.date === date,
  );
  const appointments = (data.appointments ?? []).filter((a) => a.professionalId === professionalId);

  const slots: SlotState[] = [];
  for (const window of windows) {
    const step = window.slotMinutes ?? slotMinutes;
    for (let t = window.startMinutes; t + step <= window.endMinutes; t += step) {
      const block = blocks.find((b) => overlaps(t, t + step, b.startMinutes, b.endMinutes));
      if (block) {
        slots.push({ start: t, end: t + step, free: false, reason: block.reason });
        continue;
      }
      const busy = appointments.find((a) => {
        const m = appointmentMinutes(a.startsAt);
        return overlaps(t, t + step, m.start, m.end);
      });
      slots.push({
        start: t,
        end: t + step,
        free: !busy,
        reason: busy ? "Atendimento marcado" : undefined,
      });
    }
  }
  return slots;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function Availability(props: BlockProps<AvailabilityData, AvailabilityVariant>) {
  const {
    data,
    onAction,
    variant = "week",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const professionals = data.professionals ?? [];
  const hours = data.hours ?? [];
  const blocks = data.blocks ?? [];

  const hasContent = hours.length > 0 || blocks.length > 0;
  const effectiveState = state === "success" && !hasContent ? "empty" : state;

  function blockSlot(professionalId: string, date: string, slot: SlotState) {
    onAction?.("availability.block", {
      professionalId,
      date,
      startMinutes: slot.start,
      endMinutes: slot.end,
      reason: "bloqueio_manual",
    });
  }

  function unblock(blockId: string) {
    onAction?.("availability.unblock", { blockId });
  }

  function setHours(professionalId: string, weekday: number) {
    const existing = hours.find((h) => h.professionalId === professionalId && h.weekday === weekday);
    onAction?.("availability.setHours", {
      professionalId,
      weekday,
      startMinutes: existing?.startMinutes ?? 8 * 60,
      endMinutes: existing?.endMinutes ?? 18 * 60,
      slotMinutes: existing?.slotMinutes ?? data.slotMinutes ?? 30,
    });
  }

  return (
    <BlockFrame
      state={effectiveState}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      className={className}
        recipe={availabilityRecipe}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Agenda"
          title="Horarios de atendimento"
          description="Grade semanal por profissional, folgas e slots livres do dia. Tudo em America/Sao_Paulo."
          actions={
            <Badge tone="info" icon={<Clock3 size={12} aria-hidden />}>
              Fuso America/Sao_Paulo
            </Badge>
          }
        />

        {variant === "week" ? (
          <WeekGrid
            professionals={professionals}
            hours={hours}
            onSetHours={setHours}
          />
        ) : null}

        {variant === "list" ? (
          <AvailabilityList
            professionals={professionals}
            hours={hours}
            blocks={blocks}
            onUnblock={unblock}
          />
        ) : null}

        {variant === "slots" ? (
          <SlotsDay
            data={data}
            onBlock={blockSlot}
          />
        ) : null}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "week"                                                      */
/* ------------------------------------------------------------------ */

function WeekGrid({
  professionals,
  hours,
  onSetHours,
}: {
  professionals: AvailabilityProfessional[];
  hours: AvailabilityHours[];
  onSetHours: (professionalId: string, weekday: number) => void;
}) {
  return (
    <div className="bloco-scroll overflow-x-auto">
      <div
        className="grid min-w-[720px] gap-px rounded-[var(--r-lg)] border border-border bg-border/60"
        style={{ gridTemplateColumns: `180px repeat(7, minmax(0, 1fr))` }}
      >
        <div className="bg-surface/90 px-3 py-2">
          <span className="bloco-micro">Profissional</span>
        </div>
        {WEEKDAYS_SHORT.map((label, index) => (
          <div key={label} className="bg-surface/90 px-3 py-2">
            <span className="bloco-micro">{label}</span>
          </div>
        ))}

        {professionals.map((professional) => (
          <React.Fragment key={professional.id}>
            <div className="bg-surface/70 px-3 py-2">
              <p className="bloco-caption truncate font-medium text-fg">{professional.name}</p>
              <p className="bloco-micro truncate">{professional.specialty}</p>
            </div>
            {WEEKDAYS.map((_, weekday) => {
              const windows = hours.filter(
                (h) => h.professionalId === professional.id && h.weekday === weekday,
              );
              return (
                <div key={`${professional.id}-${weekday}`} className="min-h-[72px] bg-surface/40 p-1.5">
                  {windows.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => onSetHours(professional.id, weekday)}
                      aria-label={`Folga de ${professional.name} em ${WEEKDAYS[weekday]}`}
                      className="bloco-micro flex min-h-8 w-full items-center justify-center gap-1 rounded-[var(--r-sm)] border border-dashed border-border py-2 text-fg-faint transition-colors hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <CalendarOff size={12} aria-hidden />
                      Folga
                    </button>
                  ) : (
                    windows.map((window, index) => (
                      <span
                        key={`${window.startMinutes}-${index}`}
                        className="mb-1 block rounded-[var(--r-sm)] bg-accent-soft px-2 py-1 bloco-label font-medium tabular-nums text-accent-ink"
                      >
                        {formatMinutes(window.startMinutes)}–{formatMinutes(window.endMinutes)}
                      </span>
                    ))
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "list"                                                      */
/* ------------------------------------------------------------------ */

function AvailabilityList({
  professionals,
  hours,
  blocks,
  onUnblock,
}: {
  professionals: AvailabilityProfessional[];
  hours: AvailabilityHours[];
  blocks: AvailabilityBlock[];
  onUnblock: (blockId: string) => void;
}) {
  const nameOf = (professionalId: string) =>
    professionals.find((p) => p.id === professionalId)?.name ?? professionalId;

  const hourColumns: Array<Column<AvailabilityHours>> = [
    {
      key: "professional",
      header: "Profissional",
      render: (row) => <span className="font-medium text-fg">{nameOf(row.professionalId)}</span>,
    },
    {
      key: "weekday",
      header: "Dia",
      render: (row) => <span>{WEEKDAYS[row.weekday] ?? "—"}</span>,
    },
    {
      key: "window",
      header: "Horario",
      render: (row) => (
        <span className="tabular-nums">
          {formatMinutes(row.startMinutes)}–{formatMinutes(row.endMinutes)}
        </span>
      ),
    },
    {
      key: "slot",
      header: "Slot",
      align: "right",
      render: (row) => <span className="tabular-nums">{row.slotMinutes ?? 30} min</span>,
    },
  ];

  const blockColumns: Array<Column<AvailabilityBlock>> = [
    {
      key: "date",
      header: "Data",
      render: (row) => (
        <span className="tabular-nums">
          {row.date.split("-").reverse().join("/")}
        </span>
      ),
    },
    {
      key: "professional",
      header: "Profissional",
      render: (row) => <span>{nameOf(row.professionalId)}</span>,
    },
    {
      key: "window",
      header: "Horario",
      render: (row) => (
        <span className="tabular-nums">
          {formatMinutes(row.startMinutes)}–{formatMinutes(row.endMinutes)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Motivo",
      render: (row) => <span>{row.reason}</span>,
    },
    {
      key: "actions",
      header: "Acoes",
      align: "right",
      render: (row) => (
        <IconButton
          label={`Liberar bloqueio de ${row.date.split("-").reverse().join("/")} (${formatMinutes(row.startMinutes)}-${formatMinutes(row.endMinutes)}) de ${nameOf(row.professionalId)}`}
          size="icon"
          onClick={() => onUnblock(row.id)}
        >
          <Unlock size={15} aria-hidden />
        </IconButton>
      ),
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel tone="outline" padding="none" className="flex flex-col gap-3 p-4">
        <div>
          <p className="bloco-headline">Horarios de atendimento</p>
          <p className="bloco-caption text-fg-muted">Grade semanal por profissional.</p>
        </div>
        <DataTable columns={hourColumns} rows={hours} rowKey={(row) => `${row.professionalId}-${row.weekday}`} />
      </Panel>

      <Panel tone="outline" padding="none" className="flex flex-col gap-3 p-4">
        <div>
          <p className="bloco-headline">Folgas e bloqueios</p>
          <p className="bloco-caption text-fg-muted">
            Bloqueio vale mesmo sobre folga: bloqueado nunca vira slot.
          </p>
        </div>
        <DataTable columns={blockColumns} rows={blocks} rowKey={(row) => row.id} />
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao "slots"                                                     */
/* ------------------------------------------------------------------ */

function SlotsDay({
  data,
  onBlock,
}: {
  data: AvailabilityData;
  onBlock: (professionalId: string, date: string, slot: SlotState) => void;
}) {
  const date = data.date ?? "";
  const professionals = data.professionals ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="bloco-caption text-fg-muted">
        Slots livres de {date.split("-").reverse().join("/")} — ja descontando atendimento marcado e
        horario bloqueado.
      </p>

      {professionals.map((professional) => {
        const slots = freeSlots(data, professional.id, date);
        const free = slots.filter((s) => s.free);
        return (
          <Panel key={professional.id} tone="outline" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="bloco-headline">{professional.name}</p>
                <p className="bloco-caption text-fg-muted">{professional.specialty}</p>
              </div>
              <Badge tone={free.length > 0 ? "success" : "warn"}>
                {free.length} {free.length === 1 ? "slot livre" : "slots livres"}
              </Badge>
            </div>

            {slots.length === 0 ? (
              <p className="bloco-caption text-fg-faint">
                Sem horario de atendimento neste dia (folga).
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const key = `${slot.start}-${slot.end}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!slot.free}
                      onClick={() => onBlock(professional.id, date, slot)}
                      title={slot.free ? "Bloquear este slot" : slot.reason}
                      className={
                        "inline-flex items-center gap-1.5 rounded-[var(--r-pill)] border px-3 py-1.5 bloco-label tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                        (slot.free
                          ? "border-transparent bg-success-soft text-success hover:opacity-80"
                          : "cursor-not-allowed border-border bg-surface-strong/50 text-fg-faint line-through")
                      }
                    >
                      {slot.free ? <LockOpen size={12} aria-hidden /> : null}
                      {formatMinutes(slot.start)}–{formatMinutes(slot.end)}
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
