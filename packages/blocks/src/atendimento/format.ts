/**
 * Formatacao pt-BR compartilhada pelo dominio de atendimento.
 * Sem dependencia externa: Intl nativo + helpers locais.
 *
 * Regra do programa: fuso unico America/Sao_Paulo.
 */

export const TZ = "America/Sao_Paulo";

const dtFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
});

/** Converte ISO em Date; devolve null quando a data nao e valida. */
export function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "12/03/2025 09:14" */
export function formatDateTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? dtFormatter.format(date) : "—";
}

/** "12/03/2025" */
export function formatDate(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? dateFormatter.format(date) : "—";
}

/** "09:14" */
export function formatTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? timeFormatter.format(date) : "—";
}

/** "12 de mar." */
export function formatDayMonth(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? dayMonthFormatter.format(date) : "—";
}

/** "+55 (11) 98765-4321" a partir de um E.164. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return "—";
  const digits = e164.replace(/\D/g, "");
  const hasCountry = digits.startsWith("55");
  const cc = hasCountry ? digits.slice(0, 2) : "55";
  const local = hasCountry ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `+${cc} (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `+${cc} (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return e164;
}

/** Horas passadas desde um instante ISO (fracionarias). */
export function hoursSince(iso: string | null | undefined, now: Date): number {
  const date = toDate(iso);
  if (!date) return Number.POSITIVE_INFINITY;
  return (now.getTime() - date.getTime()) / 3_600_000;
}

/**
 * Janela de 24h: mensagem livre so dentro de 24h depois que o cliente escreveu.
 * Fora disso, so template aprovado.
 */
export function isWithin24h(lastInboundAt: string | null | undefined, now: Date): boolean {
  const hours = hoursSince(lastInboundAt, now);
  return hours >= 0 && hours <= 24;
}

/** "12h" / "2d" — distancia curta a partir de um instante ISO. */
export function formatAge(iso: string | null | undefined, now: Date): string {
  const hours = hoursSince(iso, now);
  if (!Number.isFinite(hours)) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

/** Remove acentos e caixa para busca tolerante. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
