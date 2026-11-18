import * as React from "react";
import { cn } from "./cn.js";
import { useBlocosLocale } from "./locale.js";

export type CalloutTone = "info" | "success" | "warn" | "danger" | "accent";

export function Callout({
  tone = "info",
  title,
  children,
  icon,
  action,
  className,
}: {
  tone?: CalloutTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const tones: Record<CalloutTone, string> = {
    info: "bg-info-soft border-info/25 text-fg",
    success: "bg-success-soft border-success/25 text-fg",
    warn: "bg-warn-soft border-warn/25 text-fg",
    danger: "bg-danger-soft border-danger/25 text-fg",
    accent: "bg-accent-soft border-accent/25 text-fg",
  };
  return (
    <div className={cn("rounded-[var(--r-md)] border px-4 py-3", tones[tone], className)}>
      <div className="flex items-start gap-3">
        {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          {title ? <p className="bloco-headline">{title}</p> : null}
          {children ? <div className="bloco-callout mt-0.5 text-fg-secondary">{children}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

/** Bloqueio de conector nao provisionado — a UI do "dono" do programa. */
export function ConnectorLock({
  connectorLabel,
  ownerOnly = true,
  onRequestAccess,
  className,
}: {
  connectorLabel: string;
  ownerOnly?: boolean;
  onRequestAccess?: () => void;
  className?: string;
}) {
  const { t } = useBlocosLocale();
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--r-lg)] border border-dashed border-warn/40 bg-warn-soft/40 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-warn-soft text-warn">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <div>
        <p className="bloco-headline">{t("ui.connectorMissing", "{connector} nao esta conectado", { connector: connectorLabel })}</p>
        <p className="bloco-callout mt-1 max-w-sm text-fg-muted">
          {ownerOnly
            ? t("ui.connectorOwnerOnly", "Apenas o dono da plataforma pode provisionar esta conexao. Nenhum segredo trafega pelo bloco.")
            : t("ui.connectorAsk", "Peca ao dono da plataforma para provisionar esta conexao.")}
        </p>
      </div>
      {onRequestAccess ? (
        <button
          type="button"
          onClick={onRequestAccess}
          className="rounded-[var(--r-md)] border border-border-strong bg-surface-strong px-3.5 py-2 bloco-control-sm font-medium transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("ui.requestAccess", "Solicitar acesso")}
        </button>
      ) : null}
    </div>
  );
}

/** Toast simples (empilhado, canto superior direito). */
export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: CalloutTone;
}

export function ToastStack({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss?: (id: string) => void }) {
  const { t: tr } = useBlocosLocale();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "bloco-glass bloco-anim-scale pointer-events-auto flex items-start gap-3 p-3.5 shadow-[var(--shadow-3)]",
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="bloco-headline">{t.title}</p>
            {t.description ? <p className="bloco-caption mt-0.5">{t.description}</p> : null}
          </div>
          {onDismiss ? (
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label={tr("ui.dismiss", "Dispensar")}
              className="text-fg-faint transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
