import * as React from "react";
import { cn } from "./cn.js";

type ButtonVariant = "primary" | "secondary" | "ghost" | "glass" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg shadow-[0_1px_0_rgba(255,255,255,0.16)_inset,0_6px_18px_-8px_var(--accent)] hover:bg-accent-hover active:scale-[0.985]",
  secondary:
    "bg-surface-strong text-fg border border-border hover:bg-surface-hover active:scale-[0.985]",
  glass:
    "bloco-glass text-fg hover:bg-surface-hover active:scale-[0.985]",
  ghost: "text-fg-secondary hover:bg-surface-hover hover:text-fg",
  outline: "border border-border-strong text-fg hover:bg-surface-hover active:scale-[0.985]",
  danger: "bg-danger text-white hover:brightness-110 active:scale-[0.985]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[var(--r-sm)]",
  md: "h-10 px-4 text-[14px] gap-2 rounded-[var(--r-md)]",
  lg: "h-12 px-6 text-[16px] gap-2.5 rounded-[var(--r-lg)]",
  icon: "h-9 w-9 rounded-[var(--r-md)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, icon, trailingIcon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      data-variant={variant}
      data-size={size}
      className={cn(
        "relative inline-flex items-center justify-center font-medium whitespace-nowrap",
        "transition-[background-color,transform,box-shadow,opacity] duration-[var(--dur-2)] ease-[var(--ease-apple)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="absolute" /> : null}
      <span className={cn("inline-flex items-center", sizes[size].includes("gap") && "gap-[inherit]")}>
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
      role="status"
      aria-label="Carregando"
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
