import * as React from "react";
import { cn } from "./cn.js";

/* ------------------------------------------------------------------ */
/* Badge / Pill                                                        */
/* ------------------------------------------------------------------ */

export type BadgeTone = "neutral" | "accent" | "success" | "warn" | "danger" | "info" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-strong text-fg-secondary border-border",
  accent: "bg-accent-soft text-accent-ink border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  info: "bg-info-soft text-info border-transparent",
  outline: "bg-transparent text-fg-muted border-border-strong",
};

export function Badge({ tone = "neutral", size = "sm", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--r-pill)] border font-medium whitespace-nowrap",
        size === "sm" ? "h-5 px-2 bloco-label-sm" : "h-6 px-2.5 bloco-label",
        badgeTones[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Stat — numero grande com rotulo e variacao                          */
/* ------------------------------------------------------------------ */

export interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: { value: string; direction: "up" | "down" | "flat"; goodWhen?: "up" | "down" } | React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Stat({ label, value, delta, hint, icon, className, onClick }: StatProps) {
  const deltaNode =
    delta && typeof delta === "object" && delta !== null && "direction" in delta ? (
      <span
        className={cn(
          "bloco-caption font-medium",
          delta.direction === "up"
            ? delta.goodWhen === "down"
              ? "text-danger"
              : "text-success"
            : delta.direction === "down"
              ? delta.goodWhen === "up"
                ? "text-danger"
                : "text-success"
              : "text-fg-muted",
        )}
      >
        {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—"}{" "}
        {delta.value}
      </span>
    ) : (
      delta
    );

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[var(--r-lg)] border border-border bg-surface/60 p-4 transition-all duration-[var(--dur-2)]",
        onClick && "cursor-pointer hover:border-border-strong hover:bg-surface-strong",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="bloco-micro">{label}</span>
        {icon ? <span className="text-fg-faint">{icon}</span> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="bloco-title2 min-w-0 break-words tabular-nums">{value}</span>
        {deltaNode}
      </div>
      {hint ? <div className="bloco-caption mt-1.5">{hint}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-accent-soft bloco-label font-semibold text-accent-ink ring-1 ring-inset ring-hairline",
        className,
      )}
      style={{ width: size, height: size }}
      title={name}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tabela                                                              */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Alinhamento da celula. */
  align?: "left" | "right" | "center";
  width?: string;
  render: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  onRowClick,
  className,
  stickyHeader = true,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <div className={className}>{empty}</div>;
  }
  return (
    // relative: an absolutely positioned descendant (the sr-only label of a Switch
    // in a cell) takes this box as its containing block, so the scroll clips it
    // instead of letting it stretch the page sideways.
    <div className={cn("bloco-scroll relative overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left">
        <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  "bloco-micro bg-surface/80 px-[var(--density-cell-x)] py-[var(--density-cell-y)] backdrop-blur-sm",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-border/60 transition-colors duration-[var(--dur-2)] last:border-0",
                onRowClick && "cursor-pointer hover:bg-surface-hover",
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-[var(--density-cell-x)] py-[var(--density-cell-y)] bloco-cell",
                    col.align === "right" && "text-right tabular-nums",
                    col.align === "center" && "text-center",
                  )}
                >
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Estados                                                             */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--r-lg)] border border-dashed border-border px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-strong text-fg-muted">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="bloco-headline">{title}</p>
        {description ? <p className="bloco-callout mt-1 max-w-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bloco-skeleton h-4 w-full", className)} aria-hidden />;
}

export function KeyValue({
  items,
  className,
  columns = 2,
}: {
  items: Array<{ label: React.ReactNode; value: React.ReactNode }>;
  className?: string;
  columns?: 1 | 2 | 3;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i}>
          <dt className="bloco-micro">{item.label}</dt>
          <dd className="bloco-body mt-1 text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = "accent",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "accent" | "success" | "warn" | "danger";
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = {
    accent: "bg-accent",
    success: "bg-success",
    warn: "bg-warn",
    danger: "bg-danger",
  } as const;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-[var(--r-pill)] bg-surface-active", className)}
    >
      <div
        className={cn("h-full rounded-[var(--r-pill)] transition-[width] duration-[var(--dur-4)] ease-[var(--ease-apple)]", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
