/**
 * Formatacao pt-BR do dominio clinico.
 * Fuso unico America/Sao_Paulo. Sem dependencia externa.
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

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

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

/** "mar. de 2025" */
export function formatMonth(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? monthFormatter.format(date) : "—";
}

/** "09:14" */
export function formatTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? timeFormatter.format(date) : "—";
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

/** Remove acentos e caixa para busca tolerante. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
