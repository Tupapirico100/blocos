/**
 * Dinheiro em centavos (padrao do CRM-Nutricionista e do CRM-HOF).
 * Regra: dinheiro NUNCA e ponto flutuante. Entrada e saida em centavos.
 */

export interface Money {
  /** Valor em centavos. Inteiro. */
  cents: number;
  /** Moeda ISO-4217. Padrao BRL. */
  currency: string;
}

export const BRL = "BRL";

export function money(cents: number, currency: string = BRL): Money {
  if (!Number.isFinite(cents)) throw new TypeError("Valor monetario invalido");
  if (!Number.isInteger(cents)) throw new TypeError("Dinheiro deve ser inteiro em centavos");
  return { cents: Math.round(cents), currency };
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { cents: a.cents + b.cents, currency: a.currency };
}

export function sum(items: Money[], currency: string = BRL): Money {
  return items.reduce<Money>((acc, m) => add(acc, m), money(0, currency));
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { cents: a.cents - b.cents, currency: a.currency };
}

/** Arredondamento half-up (o padrao comercial brasileiro). */
export function percentOf(value: Money, percent: number): Money {
  return { cents: Math.round((value.cents * percent) / 100), currency: value.currency };
}

export interface FormatCurrencyOptions {
  /** Moeda ISO-4217. Padrao BRL. */
  currency?: string;
  /** Idioma BCP 47 do formato. Padrao pt-BR. */
  locale?: string;
  compact?: boolean;
  showCents?: boolean;
}

/**
 * Formata centavos em qualquer moeda e idioma (ex.: PEN em es-PE -> "S/ 150.00").
 * Os padroes (pt-BR, BRL) sao os de `formatBRL`, que continua igual.
 */
export function formatCurrency(cents: number, opts: FormatCurrencyOptions = {}): string {
  const { currency = BRL, locale = "pt-BR", compact = false, showCents = true } = opts;
  const value = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(value);
}

export function formatBRL(cents: number, opts: { compact?: boolean; showCents?: boolean } = {}): string {
  return formatCurrency(cents, { ...opts, currency: BRL, locale: "pt-BR" });
}

export function formatMoney(m: Money, opts?: { compact?: boolean; showCents?: boolean }): string {
  return formatBRL(m.cents, opts);
}

/** "1.234,56" -> 123456 centavos. Aceita "1.234,56", "1234.56", "R$ 10,00". */
export function parseBRLToCents(input: string): number {
  const cleaned = input.replace(/[^\d,.-]/g, "");
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) throw new TypeError(`Valor invalido: ${input}`);
  return Math.round(value * 100);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new TypeError(`Moedas diferentes: ${a.currency} vs ${b.currency}`);
  }
}
