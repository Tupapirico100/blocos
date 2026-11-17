import * as React from "react";
import { cn } from "./cn.js";

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "glass" (padrao), "solid", "outline", "bare" */
  tone?: "glass" | "solid" | "outline" | "bare";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const tones = {
  glass: "bloco-glass",
  solid: "bg-surface-solid border border-border",
  outline: "border border-border bg-transparent",
  bare: "",
} as const;

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-[var(--density-card-p)]",
  lg: "p-6",
} as const;

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { className, tone = "glass", padding = "md", interactive, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-tone={tone}
      className={cn(
        "relative rounded-[var(--r-lg)] text-fg transition-[transform,box-shadow,background-color] duration-[var(--dur-2)] ease-[var(--ease-apple)]",
        tones[tone],
        paddings[padding],
        interactive &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
});

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, actions, eyebrow, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="bloco-micro mb-1.5">{eyebrow}</div> : null}
        <h2 className="bloco-title3 truncate">{title}</h2>
        {description ? <p className="bloco-callout mt-1 max-w-prose">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header de pagina — titulo grande, acoes a direita                   */
/* ------------------------------------------------------------------ */

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Elemento de navegacao/abas abaixo do titulo. */
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, children, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="bloco-display">{title}</h1>
          {subtitle ? <p className="bloco-body mt-2 max-w-prose">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
