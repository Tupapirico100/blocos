import * as React from "react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Panel,
  SectionHeader,
  Stat,
  type Column,
} from "@blocos/ui";
import { formatBRL } from "@blocos/core";
import { BarChart3, Download, Percent, Ticket } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { financeOverviewRecipe } from "./finance-overview.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type FinanceOverviewVariant = "cards" | "chart" | "table";

export interface FinanceDayEntry {
  /** Data local (YYYY-MM-DD). */
  date: string;
  /** Receita do dia em centavos. */
  amountCents: number;
  sessions: number;
  attended: boolean;
}

export interface FinancePackageRow {
  name: string;
  /** Receita em centavos. */
  amountCents: number;
  sessions: number;
}

export interface FinanceOverviewData {
  /** Mes de referencia (YYYY-MM). */
  month: string;
  /** Receita do mes em centavos. */
  revenueCents: number;
  /** Receita do mes anterior em centavos (para comparacao). */
  previousRevenueCents?: number;
  /** Ticket medio em centavos. */
  ticketAverageCents: number;
  /** Taxa de comparecimento (0 a 1). */
  attendanceRate: number;
  paidSessions: number;
  scheduledSessions: number;
  days?: FinanceDayEntry[];
  byPackage?: FinancePackageRow[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function percent(rate: number): string {
  return `${(rate * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function revenueDelta(current: number, previous?: number): { value: string; direction: "up" | "down" | "flat" } {
  if (previous === undefined || previous === 0) {
    return { value: "sem comparacao", direction: "flat" };
  }
  const diff = (current - previous) / previous;
  const sign = diff > 0 ? "+" : "";
  return {
    value: `${sign}${percent(diff)}`,
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
  };
}

function dayLabel(date: string): string {
  const [, month = "", day = ""] = date.split("-");
  return `${day}/${month}`;
}

/**
 * Legenda do Stat de receita: a comparacao com o mes anterior fica aqui
 * (o bloco quebra em varias linhas) e o delta fica so com o percentual.
 */
function revenueHint(data: FinanceOverviewData): string {
  const delta = revenueDelta(data.revenueCents, data.previousRevenueCents);
  const sessions = `${data.paidSessions} sessoes pagas`;
  if (delta.direction === "flat") return sessions;
  return `${delta.value} vs mes anterior · ${sessions}`;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function FinanceOverview(props: BlockProps<FinanceOverviewData, FinanceOverviewVariant>) {
  const {
    data,
    onAction,
    variant = "cards",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const days = data.days ?? [];
  const byPackage = data.byPackage ?? [];

  const effectiveState = state === "success" && data.revenueCents === 0 && days.length === 0 ? "empty" : state;

  const monthLabel = (() => {
    const [year = "", month = ""] = data.month.split("-");
    const names = [
      "janeiro",
      "fevereiro",
      "marco",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    const index = Number.parseInt(month ?? "", 10) - 1;
    const name = names[index] ?? month;
    return `${name} de ${year}`;
  })();

  return (
    <BlockFrame
      state={effectiveState}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      className={className}
        recipe={financeOverviewRecipe}
        onAction={onAction}
        empty={
          <EmptyState
            icon={<BarChart3 className="h-5 w-5" aria-hidden />}
            title="Sem lancamentos neste mes"
            description="A receita e o comparecimento chegam sozinhos assim que houver atendimento pago no mes."
          />
        }
      >
      <div className="@container flex flex-col gap-4">
        <SectionHeader
          eyebrow="Financeiro"
          title="Visao financeira"
          description={`Receita, ticket medio e comparecimento de ${monthLabel}. Valores em centavos, exibidos em BRL.`}
          actions={
            <Button
              size="sm"
              variant="secondary"
              icon={<Download size={14} aria-hidden />}
              onClick={() => onAction?.("finance.export", { month: data.month, format: "csv" })}
            >
              Exportar
            </Button>
          }
        />

        {variant === "cards" ? (
          /* Grade por container: o Stat nao cabe em 4 colunas estreitas sem que
             o valor (+ variacao) atravesse a borda do cartao. */
          <div className="grid grid-cols-1 gap-3 @[520px]:grid-cols-2 @[880px]:grid-cols-4">
            <Stat
              label="Receita do mes"
              value={formatBRL(data.revenueCents)}
              delta={revenueDelta(data.revenueCents, data.previousRevenueCents)}
              hint={revenueHint(data)}
              icon={<BarChart3 size={14} aria-hidden />}
            />
            <Stat
              label="Ticket medio"
              value={formatBRL(data.ticketAverageCents)}
              hint="por atendimento pago"
              icon={<Ticket size={14} aria-hidden />}
            />
            <Stat
              label="Taxa de comparecimento"
              value={percent(data.attendanceRate)}
              hint={`${data.scheduledSessions} sessoes agendadas`}
              icon={<Percent size={14} aria-hidden />}
            />
            <Stat
              label="Sessoes pagas"
              value={String(data.paidSessions)}
              delta={
                data.scheduledSessions > 0
                  ? {
                      value: `${data.scheduledSessions - data.paidSessions} a receber`,
                      direction: data.scheduledSessions - data.paidSessions > 0 ? "down" : "flat",
                      goodWhen: "down",
                    }
                  : undefined
              }
            />
          </div>
        ) : null}

        {variant === "chart" ? (
          <RevenueChart days={days} revenueCents={data.revenueCents} ticketAverageCents={data.ticketAverageCents} />
        ) : null}

        {variant === "table" ? (
          <Panel tone="outline" padding="none">
            <DataTable
              columns={dayColumns}
              rows={days}
              rowKey={(row) => row.date}
              empty={
                <p className="bloco-caption p-4 text-fg-muted">Sem lancamentos neste mes.</p>
              }
            />
          </Panel>
        ) : null}

        {byPackage.length > 0 ? (
          <Panel tone="outline" padding="none">
            <DataTable columns={packageColumns} rows={byPackage} rowKey={(row) => row.name} />
          </Panel>
        ) : null}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Grafico em CSS puro (sem libs de chart)                             */
/* ------------------------------------------------------------------ */

function RevenueChart({
  days,
  revenueCents,
  ticketAverageCents,
}: {
  days: FinanceDayEntry[];
  revenueCents: number;
  ticketAverageCents: number;
}) {
  const max = days.reduce((acc, day) => Math.max(acc, day.amountCents), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Receita do mes" value={formatBRL(revenueCents)} />
        <Stat label="Ticket medio" value={formatBRL(ticketAverageCents)} />
        <Stat
          label="Dias com lancamento"
          value={String(days.filter((d) => d.amountCents > 0).length)}
          hint={`de ${days.length} dias`}
        />
      </div>

      <Panel tone="outline" className="flex flex-col gap-3">
        <p className="bloco-headline">Receita por dia</p>

        {days.length === 0 ? (
          <p className="bloco-caption text-fg-muted">Sem dados para o grafico.</p>
        ) : (
          <>
            <div
              className="flex h-[180px] items-end gap-1.5"
              role="img"
              aria-label="Grafico de receita por dia"
            >
              {days.map((day) => {
                const height = max > 0 ? Math.max((day.amountCents / max) * 100, 2) : 0;
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="bloco-micro tabular-nums text-fg-muted">
                      {day.amountCents > 0 ? formatBRL(day.amountCents, { showCents: false }) : ""}
                    </span>
                    <div
                      className={
                        "w-full rounded-t-[var(--r-sm)] transition-[height] duration-[var(--dur-4)] ease-[var(--ease-apple)] " +
                        (day.attended ? "bg-accent" : "bg-accent-soft")
                      }
                      style={{ height: `${height}%` }}
                      title={`${dayLabel(day.date)}: ${formatBRL(day.amountCents)}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1.5">
              {days.map((day) => (
                <span key={day.date} className="bloco-micro flex-1 text-center">
                  {dayLabel(day.date)}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
              <span className="bloco-micro flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
                Compareceu
              </span>
              <span className="bloco-micro flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-accent-soft" aria-hidden />
                Faltou
              </span>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Colunas                                                              */
/* ------------------------------------------------------------------ */

const dayColumns: Array<Column<FinanceDayEntry>> = [
  {
    key: "date",
    header: "Dia",
    render: (row) => <span className="tabular-nums text-fg">{dayLabel(row.date)}</span>,
  },
  {
    key: "sessions",
    header: "Sessoes",
    align: "right",
    render: (row) => <span className="tabular-nums">{row.sessions}</span>,
  },
  {
    key: "attendance",
    header: "Comparecimento",
    render: (row) => (
      <Badge tone={row.attended ? "success" : "danger"}>
        {row.attended ? "Compareceu" : "Faltou"}
      </Badge>
    ),
  },
  {
    key: "amount",
    header: "Receita",
    align: "right",
    render: (row) => <span className="tabular-nums text-fg">{formatBRL(row.amountCents)}</span>,
  },
];

const packageColumns: Array<Column<FinancePackageRow>> = [
  {
    key: "name",
    header: "Pacote",
    render: (row) => <span className="font-medium text-fg">{row.name}</span>,
  },
  {
    key: "sessions",
    header: "Sessoes",
    align: "right",
    render: (row) => <span className="tabular-nums">{row.sessions}</span>,
  },
  {
    key: "amount",
    header: "Receita",
    align: "right",
    render: (row) => <span className="tabular-nums text-fg">{formatBRL(row.amountCents)}</span>,
  },
];
