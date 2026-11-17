/**
 * Fuso horario local <-> UTC.
 *
 * Portado do CRM-Nutricionista (src/core/time/zone.ts). O ponto critico:
 * o deslocamento muda na virada de DST, entao a conversao faz DUAS
 * passadas com Intl.DateTimeFormat. Uma passagem so erra no dia da mudanca.
 * Sem dependencia externa.
 */

export type LocalDateParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const PARTS_CACHE = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = PARTS_CACHE.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    PARTS_CACHE.set(timeZone, f);
  }
  return f;
}

function partsInZone(date: Date, timeZone: string): LocalDateParts {
  const parts = formatter(timeZone).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const hour = get("hour");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // Intl pode devolver 24 para meia-noite em alguns runtimes.
    hour: hour === 24 ? 0 : hour,
    minute: get("minute"),
    second: get("second"),
  };
}

function asUtcMillis(p: LocalDateParts): number {
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** Minutos desde a meia-noite local. */
export function minutesSinceMidnight(p: LocalDateParts): number {
  return p.hour * 60 + p.minute;
}

/** Converte uma hora local (sem data) em UTC considerando a data local. */
export function localToUtc(
  timeZone: string,
  local: LocalDateParts,
): Date {
  // Passo 1: supoe o deslocamento do instante aproximado.
  const approx = new Date(asUtcMillis(local));
  const offset1 = asUtcMillis(partsInZone(approx, timeZone)) - approx.getTime();

  // Passo 2: recalcula com o deslocamento real — corrige a virada de DST.
  const shifted = new Date(asUtcMillis(local) - offset1);
  const offset2 = asUtcMillis(partsInZone(shifted, timeZone)) - shifted.getTime();

  return new Date(asUtcMillis(local) - offset2);
}

/** Converte UTC para a hora local de um fuso. */
export function utcToLocal(timeZone: string, date: Date): LocalDateParts {
  return partsInZone(date, timeZone);
}

/** Data local em formato YYYY-MM-DD. */
export function localDateKey(timeZone: string, date: Date): string {
  const p = utcToLocal(timeZone, date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "09:30" a partir de minutos desde a meia-noite. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad(h)}:${pad(m)}`;
}

/** Intervalo de 30 em 30 minutos dentro do expediente. */
export function slotsFor(startMinutes: number, endMinutes: number, slotMinutes: number): number[] {
  const out: number[] = [];
  for (let t = startMinutes; t + slotMinutes <= endMinutes; t += slotMinutes) out.push(t);
  return out;
}

/** "Hoje", "Amanhã", "12 de março" — relativo e curto. */
export function formatRelativeDay(
  timeZone: string,
  date: Date,
  now: Date = new Date(),
  locale = "pt-BR",
): string {
  const target = localDateKey(timeZone, date);
  const today = localDateKey(timeZone, now);
  const tomorrow = localDateKey(timeZone, new Date(now.getTime() + 86_400_000));
  const yesterday = localDateKey(timeZone, new Date(now.getTime() - 86_400_000));
  if (target === today) return "Hoje";
  if (target === tomorrow) return "Amanhã";
  if (target === yesterday) return "Ontem";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone }).format(date);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
