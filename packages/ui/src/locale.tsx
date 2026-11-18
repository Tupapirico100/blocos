import * as React from "react";
import { formatCurrency } from "@blocos/core";

/**
 * Idioma, moeda, fuso e textos dos blocos.
 *
 * Os padroes sao os de sempre (pt-BR, BRL, America/Sao_Paulo, textos em pt-BR):
 * quem nao usa o provedor ve exatamente o que via antes. Um app de outro pais
 * (ex.: CRM-HOF do Peru: es-PE, PEN, America/Lima) envolve a arvore com
 * `<LocaleProvider>` e passa `messages` com as chaves que quer trocar.
 *
 * Chave ausente = texto padrao em pt-BR. Interpolacao: `{nome}`.
 */
export interface BlocosLocaleConfig {
  /** Idioma BCP 47 dos formatos (datas, numeros). */
  locale: string;
  /** Moeda ISO-4217 do programa. */
  currency: string;
  /** Fuso IANA em que datas e horas sao mostradas. */
  timeZone: string;
  /** Textos por chave (ex.: "ui.confirm", "role.owner", "webhooks.title"). */
  messages: Partial<Record<string, string>>;
}

export const DEFAULT_BLOCOS_LOCALE: BlocosLocaleConfig = {
  locale: "pt-BR",
  currency: "BRL",
  timeZone: "America/Sao_Paulo",
  messages: {},
};

const LocaleContext = React.createContext<BlocosLocaleConfig>(DEFAULT_BLOCOS_LOCALE);

export interface LocaleProviderProps extends Partial<BlocosLocaleConfig> {
  children: React.ReactNode;
}

export function LocaleProvider({ children, ...value }: LocaleProviderProps) {
  const parent = React.useContext(LocaleContext);
  const merged = React.useMemo<BlocosLocaleConfig>(
    () => ({
      locale: value.locale ?? parent.locale,
      currency: value.currency ?? parent.currency,
      timeZone: value.timeZone ?? parent.timeZone,
      messages: { ...parent.messages, ...value.messages },
    }),
    [parent, value.locale, value.currency, value.timeZone, value.messages],
  );
  return <LocaleContext.Provider value={merged}>{children}</LocaleContext.Provider>;
}

export interface BlocosFormat {
  config: BlocosLocaleConfig;
  /** Texto da chave, ou o padrao em pt-BR. `{nome}` e trocado por `vars.nome`. */
  t: (key: string, fallback: string, vars?: Record<string, string | number>) => string;
  /** Centavos na moeda do programa. */
  money: (cents: number, opts?: { compact?: boolean; showCents?: boolean }) => string;
  /** Data e hora curtas no fuso do programa; "—" quando a data nao e valida. */
  dateTime: (iso?: string | null) => string;
  /** Data media no fuso do programa. */
  date: (iso?: string | null) => string;
  /** Hora no fuso do programa. */
  time: (iso?: string | null) => string;
}

/** Monta os formatadores a partir de uma configuracao (sem React). */
export function createBlocosFormat(config: BlocosLocaleConfig): BlocosFormat {
  const dtf = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(config.locale, { ...options, timeZone: config.timeZone });
  const dateTimeF = dtf({ dateStyle: "short", timeStyle: "short" });
  const dateF = dtf({ dateStyle: "medium" });
  const timeF = dtf({ hour: "2-digit", minute: "2-digit" });
  const safe = (f: Intl.DateTimeFormat) => (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : f.format(d);
  };
  return {
    config,
    t: (key, fallback, vars) => {
      const text = config.messages[key] ?? fallback;
      return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
    },
    money: (cents, opts) => formatCurrency(cents, { ...opts, currency: config.currency, locale: config.locale }),
    dateTime: safe(dateTimeF),
    date: safe(dateF),
    time: safe(timeF),
  };
}

/** Idioma, moeda, fuso e textos em vigor para este bloco. */
export function useBlocosLocale(): BlocosFormat {
  const config = React.useContext(LocaleContext);
  return React.useMemo(() => createBlocosFormat(config), [config]);
}
