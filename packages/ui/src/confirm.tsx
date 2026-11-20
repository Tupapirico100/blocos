import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button.js";
import { Dialog } from "./overlay.js";
import { cn } from "./cn.js";
import { useBlocosLocale } from "./locale.js";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** O que vai acontecer, em uma frase: "Remover Ana da equipe". */
  title: React.ReactNode;
  /** Consequencia e como reverter, se houver. */
  description?: React.ReactNode;
  /** Rotulo do botao de confirmacao. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` (padrao) para acao destrutiva; `primary` para acao neutra. */
  tone?: "danger" | "primary";
  /** Execucao em andamento — trava o botao e mostra o spinner. */
  busy?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmacao para acao destrutiva. Usar SEMPRE em remocao, cancelamento,
 * desativacao e estorno — o clique unico nao pode ser irreversivel.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  busy,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useBlocosLocale();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          {tone === "danger" ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            </span>
          ) : null}
          {title}
        </span>
      }
      description={description}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel ?? t("ui.cancel", "Cancelar")}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            loading={busy}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel ?? t("ui.confirm", "Confirmar")}
          </Button>
        </>
      }
    >
      <p className={cn("bloco-callout text-fg-secondary")}>
        {t("ui.irreversible", "Esta acao nao pode ser desfeita pela interface.")}
      </p>
    </Dialog>
  );
}
