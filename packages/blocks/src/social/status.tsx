import * as React from "react";
import { cn } from "@blocos/ui";

/**
 * Estado = texto + bolinha (nunca so cor). Usado nos blocos sociais para
 * post (agendado, publicado...) e resposta automatica (enviada, erro...).
 */
export type StatusTone = "info" | "warn" | "success" | "danger" | "neutral";

const DOT: Record<StatusTone, string> = {
  info: "bg-accent-ink",
  warn: "bg-warn",
  success: "bg-success",
  danger: "bg-danger",
  neutral: "bg-fg-muted",
};

const TEXT: Record<StatusTone, string> = {
  info: "text-accent-ink",
  warn: "text-warn",
  success: "text-success",
  danger: "text-danger",
  neutral: "text-fg-muted",
};

export function StatusDot({ tone, label, className }: { tone: StatusTone; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 bloco-label font-semibold", TEXT[tone], className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT[tone])} aria-hidden />
      {label}
    </span>
  );
}

export type SocialPostStatus = "scheduled" | "processing" | "publishing" | "published" | "error" | "canceled";

export const POST_STATUS: Record<SocialPostStatus, { label: string; tone: StatusTone }> = {
  scheduled: { label: "Agendado", tone: "info" },
  processing: { label: "Processando na Meta", tone: "warn" },
  publishing: { label: "Publicando", tone: "warn" },
  published: { label: "Publicado", tone: "success" },
  error: { label: "Com erro", tone: "danger" },
  canceled: { label: "Cancelado", tone: "neutral" },
};

export function PostStatus({ status }: { status: SocialPostStatus }) {
  return <StatusDot tone={POST_STATUS[status].tone} label={POST_STATUS[status].label} />;
}
