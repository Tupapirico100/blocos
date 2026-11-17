import * as React from "react";
import { cn } from "./cn.js";

type ButtonVariant = "primary" | "secondary" | "ghost" | "glass" | "danger" | "danger-ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /**
   * Padrao "button": sem isso, um botao dentro de <form> dispara submit
   * por acidente. Passe "submit" explicitamente quando for o caso.
   */
  type?: "button" | "submit" | "reset";
}

const variants: Record<ButtonVariant, string> = {
  // fundo preenchido usa --accent-strong (contraste 5.4:1 com o texto)
  primary:
    "bg-accent-strong text-accent-fg shadow-[0_1px_0_rgba(255,255,255,0.16)_inset,0_6px_18px_-8px_var(--accent-strong)] hover:brightness-110 active:scale-[0.985]",
  secondary:
    "bg-surface-strong text-fg border border-border hover:bg-surface-hover active:scale-[0.985]",
  glass:
    "bloco-glass text-fg hover:bg-surface-hover active:scale-[0.985]",
  ghost:
    "text-fg-secondary hover:bg-surface-hover hover:text-fg active:scale-[0.985] active:bg-surface-active",
  outline: "border border-border-strong text-fg hover:bg-surface-hover active:scale-[0.985]",
  danger: "bg-danger-strong text-danger-fg hover:brightness-110 active:scale-[0.985]",
  // acao destrutiva discreta (linha de tabela): mesma semantica do danger
  "danger-ghost": "text-danger hover:bg-danger-soft active:scale-[0.985]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-[var(--btn-h-sm)] px-3 bloco-control-sm gap-1.5 rounded-[var(--r-sm)]",
  md: "h-[var(--btn-h-md)] px-4 bloco-control gap-2 rounded-[var(--r-md)]",
  lg: "h-[var(--btn-h-lg)] px-6 bloco-control-lg gap-2.5 rounded-[var(--r-lg)]",
  icon: "h-9 w-9 rounded-[var(--r-md)]",
  "icon-sm": "h-8 w-8 rounded-[var(--r-sm)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, icon, trailingIcon, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-size={size}
      className={cn(
        "relative inline-flex items-center justify-center font-medium whitespace-nowrap",
        "transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--dur-2)] ease-[var(--ease-apple)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        // desabilitado: estado legivel por token (nunca opacidade global, que derruba o rotulo a 1.8:1)
        "disabled:pointer-events-none disabled:border-border disabled:bg-surface-active disabled:text-fg-muted disabled:opacity-100 disabled:shadow-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : null}
      <span
        aria-hidden={loading || undefined}
        className={cn("inline-flex items-center", sizes[size].includes("gap") && "gap-[inherit]", loading && "invisible")}
      >
        {icon}
        {children}
        {trailingIcon}
      </span>
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      role="status"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, variant = "ghost", size = "icon", ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      aria-label={label}
      title={label}
      variant={variant}
      size={size}
      className={cn("p-0", className)}
      {...props}
    />
  );
});
