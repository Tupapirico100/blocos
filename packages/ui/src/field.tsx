import * as React from "react";
import { cn } from "./cn.js";

/* ------------------------------------------------------------------ */
/* Field wrapper                                                       */
/* ------------------------------------------------------------------ */

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  /** Ajudante visual exibido a direita do label. */
  aside?: React.ReactNode;
}

export function Field({ label, hint, error, required, htmlFor, children, className, aside }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label || aside ? (
        <div className="flex items-baseline justify-between gap-3">
          {label ? (
            <label htmlFor={htmlFor} className="bloco-callout font-medium text-fg-secondary">
              {label}
              {required ? <span className="ml-0.5 text-danger">*</span> : null}
            </label>
          ) : null}
          {aside ? <span className="bloco-caption">{aside}</span> : null}
        </div>
      ) : null}
      {children}
      {error ? (
        <p role="alert" className="bloco-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="bloco-caption">{hint}</p>
      ) : null}
    </div>
  );
}

const controlBase =
  "w-full rounded-[var(--r-md)] border border-input bg-surface-strong/60 px-3 bloco-control text-fg " +
  "placeholder:text-fg-placeholder transition-[border-color,box-shadow,background-color] duration-[var(--dur-2)] " +
  "focus:outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:ring-4 focus-visible:ring-accent/15 " +
  "disabled:opacity-50";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "h-10",
        invalid ? "border-danger" : "border-border-input",
        className,
      )}
      {...props}
    />
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "min-h-[88px] resize-y py-2.5 leading-relaxed",
        invalid ? "border-danger" : "border-border-input",
        className,
      )}
      {...props}
    />
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "h-10 appearance-none bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        invalid ? "border-danger" : "border-border-input",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8e96' d='M6 8.5 2 4.5h8z'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  /** Nome acessivel quando `label` nao e texto puro. */
  ariaLabel?: string;
}

export function Switch({ checked, onCheckedChange, disabled, label, description, className, ariaLabel }: SwitchProps) {
  const id = React.useId();
  return (
    <label className={cn("flex items-start gap-3", disabled && "opacity-50", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={!label ? (ariaLabel ?? "Alternar") : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "relative mt-0.5 h-8 w-11 shrink-0 rounded-[var(--r-pill)] transition-colors duration-[var(--dur-2)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          checked ? "bg-accent" : "bg-surface-active",
        )}
      >
        {/* trilha visual (24px) dentro de um alvo clicavel de 32x44 */}
        <span
          aria-hidden
          className={cn(
            "absolute left-0.5 top-1 h-6 w-10 rounded-[var(--r-pill)] transition-colors duration-[var(--dur-2)]",
            checked ? "bg-accent" : "bg-surface-active",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute top-2 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-[var(--dur-3)] ease-[var(--ease-spring)]",
            checked ? "translate-x-6" : "translate-x-2",
          )}
        />
      </button>
      {label || description ? (
        <span className="min-w-0">
          {label ? (
            <span id={`${id}-label`} className="bloco-callout block font-medium text-fg">
              {label}
            </span>
          ) : null}
          {description ? <span className="bloco-caption block">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
  /** Nome acessivel quando `label` nao e texto puro. */
  ariaLabel?: string;
}

export function Checkbox({ checked, onCheckedChange, disabled, label, className, ariaLabel }: CheckboxProps) {
  const id = React.useId();
  return (
    <label className={cn("inline-flex items-center gap-2", disabled && "opacity-50", className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={!label ? (ariaLabel ?? "Selecionar") : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          // alvo de 32x32 com a caixa visual de 18px dentro
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition-colors",
            checked ? "border-accent bg-accent text-accent-fg" : "border-border-strong bg-surface-strong",
          )}
        >
          {checked ? (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
              <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
      </button>
      {label ? (
        <span id={`${id}-label`} className="bloco-callout text-fg-secondary">
          {label}
        </span>
      ) : null}
    </label>
  );
}

/** Segmented control — o seletor de variacao de bloco. */
export interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: React.ReactNode; hint?: string }>;
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function Segmented<T extends string>({ options, value, onChange, size = "md", className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label="Selecionar opcao"
      className={cn(
        "bloco-scroll inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[var(--r-md)] border border-border bg-surface/60 p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            type="button"
            aria-checked={active}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-[var(--r-sm)] font-medium transition-all duration-[var(--dur-2)] ease-[var(--ease-apple)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              size === "sm" ? "h-8 px-2.5 bloco-label" : "h-9 px-3 bloco-control-sm",
              active
                ? "bg-surface-strong text-fg shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_2px_8px_-4px_rgba(0,0,0,0.6)]"
                : "text-fg-muted hover:text-fg-secondary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
