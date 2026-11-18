import * as React from "react";
import { Dialog as DialogPrimitive, Tabs as TabsPrimitive, Tooltip as TooltipPrimitive } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "./cn.js";

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const dialogSizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export function Dialog({ open, onOpenChange, title, description, children, footer, size = "md" }: DialogProps) {
  // guarda o elemento que tinha o foco para devolver o foco a ele ao fechar
  const gatilho = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (open) gatilho.current = document.activeElement as HTMLElement | null;
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]"
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content
          asChild
          aria-modal="true"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            gatilho.current?.focus?.();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "bloco-glass bg-surface-solid/95 fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
              "p-5 shadow-[var(--shadow-3)]",
              dialogSizes[size],
            )}
          >
            <DialogPrimitive.Title className="bloco-title3">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="bloco-callout mt-1.5 text-fg-muted">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
            <div className="mt-4">{children}</div>
            {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
            <DialogPrimitive.Close asChild>
              <button
                  type="button"
                aria-label="Fechar"
                className="absolute right-4 top-4 rounded-[var(--r-sm)] p-1 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function Tabs({
  items,
  value,
  onChange,
  children,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onChange}
      className={cn("flex min-w-0 flex-col gap-4", className)}
    >
      <TabsPrimitive.List className="bloco-scroll flex min-w-0 gap-1 overflow-x-auto border-b border-border">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              "group relative flex items-center gap-2 whitespace-nowrap px-3.5 pb-2.5 pt-2 bloco-control font-medium",
              "text-fg-muted transition-colors duration-[var(--dur-2)] hover:text-fg-secondary",
              "data-[state=active]:text-fg",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            )}
          >
            {item.icon}
            {item.label}
            {item.badge}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-accent",
                "scale-x-0 opacity-0 transition-[transform,opacity] duration-[var(--dur-3)] ease-[var(--ease-apple)]",
                "group-data-[state=active]:scale-x-100 group-data-[state=active]:opacity-100",
              )}
            />
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabPanel({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn(
        "bloco-tab-anim focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      {children}
    </TabsPrimitive.Content>
  );
}

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  if (!content) return <>{children}</>;
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              "z-50 rounded-[var(--r-sm)] border border-border bg-surface-solid px-2.5 py-1.5",
              "bloco-caption shadow-[var(--shadow-3)] text-fg-secondary",
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer lateral (React Aria style, mas simples)                     */
/* ------------------------------------------------------------------ */

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
  side = "right",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "left" | "right";
}) {
  // Construido sobre Radix Dialog: foco preso, Esc fecha e o foco volta ao gatilho.
  const gatilho = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (open) gatilho.current = document.activeElement as HTMLElement | null;
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content
          asChild
          aria-modal="true"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            gatilho.current?.focus?.();
          }}
        >
          <motion.aside
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "bloco-glass bg-surface-solid/95 fixed top-0 z-50 flex h-full w-full max-w-md flex-col",
              "rounded-none border-y-0",
              side === "right" ? "right-0 border-l" : "left-0 border-r",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <DialogPrimitive.Title className="bloco-title3">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Fechar"
                  className="rounded-[var(--r-sm)] p-1 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            <div className="bloco-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
          </motion.aside>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
