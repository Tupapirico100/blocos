import * as React from "react";
import { motion } from "motion/react";
import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { Badge, Button, Callout, Field, Panel, cn } from "@blocos/ui";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { AuthCodeInput } from "./code-input.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type AuthTwoFactorVariant = "cards" | "inline" | "steps";
export type AuthTwoFactorFactorStatus = "active" | "pending" | "disabled";
export type AuthTwoFactorStep = "verify" | "challenge" | "confirm";

export interface AuthTwoFactorFactor {
  id: string;
  /** Tipo do fator. Hoje o programa oferece apenas TOTP. */
  type: "totp";
  /** Rotulo legivel ("Aplicativo autenticador"). */
  label: string;
  /** Emissor do QR (nome do programa). */
  issuer?: string;
  /** Segredo em base32, exibido no momento da vinculacao. */
  secret?: string;
  createdAt: string;
  lastUsedAt?: string;
  status: AuthTwoFactorFactorStatus;
}

export interface AuthTwoFactorRecoveryCode {
  id: string;
  /** Codigo de recuperacao. */
  code: string;
  /** Preenchido quando o codigo ja foi usado. */
  usedAt?: string;
}

export interface AuthTwoFactorData {
  factor: AuthTwoFactorFactor;
  recoveryCodes: AuthTwoFactorRecoveryCode[];
  /** Existe um desafio de verificacao aguardando? */
  challenge?: { pending: boolean; expiresAt?: string };
  /** O perfil pode remover o fator? */
  canRemove: boolean;
  error?: string;
  notice?: string;
}

const MOTION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] } as const;

const STATUS_TONE: Record<AuthTwoFactorFactorStatus, "success" | "warn" | "neutral"> = {
  active: "success",
  pending: "warn",
  disabled: "neutral",
};

const STATUS_LABEL: Record<AuthTwoFactorFactorStatus, string> = {
  active: "Ativo",
  pending: "Pendente",
  disabled: "Desativado",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/* QR ilustrativo (desenhado em SVG, sem imagem externa)                */
/* ------------------------------------------------------------------ */

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Matriz 21x21 no estilo QR — apenas ilustrativa, nao e um QR valido. */
function buildQrMatrix(seed: string, size = 21): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const finderAt = (row: number, col: number): boolean => {
    const corners: Array<[number, number]> = [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ];
    return corners.some(([r0, c0]) => row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7);
  };

  const finderCell = (row: number, col: number): boolean => {
    const corners: Array<[number, number]> = [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ];
    for (const [r0, c0] of corners) {
      if (row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7) {
        const r = row - r0;
        const c = col - c0;
        const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
        return ring === 3 || ring <= 1;
      }
    }
    return false;
  };

  let state = hashSeed(seed) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (finderAt(row, col)) {
        matrix[row]![col] = finderCell(row, col);
        continue;
      }
      matrix[row]![col] = random() > 0.52;
    }
  }

  return matrix;
}

function QrPlaceholder({ seed, className }: { seed: string; className?: string }) {
  const matrix = React.useMemo(() => buildQrMatrix(seed), [seed]);
  const size = matrix.length;

  const cells: React.ReactNode[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (matrix[row]?.[col]) {
        cells.push(<rect key={`${row}-${col}`} x={col} y={row} width={1} height={1} />);
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="QR Code ilustrativo de configuracao do autenticador"
      className={cn(
        "h-40 w-40 rounded-[var(--r-md)] border border-border bg-surface-solid p-2 text-fg",
        className,
      )}
    >
      {cells}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function AuthTwoFactor(props: BlockProps<AuthTwoFactorData, AuthTwoFactorVariant>) {
  const {
    data,
    onAction,
    variant = "cards",
    state,
    connectors,
    onRequestConnector,
  } = props;

  const [step, setStep] = React.useState<AuthTwoFactorStep>("verify");
  const [code, setCode] = React.useState("");
  const [codesVisible, setCodesVisible] = React.useState(false);

  const factor = data.factor;
  const qrSeed = `${factor.id}:${factor.secret ?? factor.createdAt}`;

  const handleVerifySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onAction?.("auth.twoFactor.verify", { code: code.trim(), factorId: factor.id });
    setStep("confirm");
  };

  const handleRemove = () => {
    void onAction?.("auth.twoFactor.remove", { factorId: factor.id });
  };

  const handleCopyCodes = () => {
    void onAction?.("auth.twoFactor.copyRecoveryCodes", {
      ids: data.recoveryCodes.filter((item) => !item.usedAt).map((item) => item.id),
    });
  };

  const handleRegenerate = () => {
    void onAction?.("auth.twoFactor.regenerateRecoveryCodes", { factorId: factor.id });
  };

  /* ---- Cartao do fator TOTP ---- */

  const factorCard = (
    <Panel tone="glass" padding="lg" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent">
            <Smartphone className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="bloco-headline">{factor.label}</p>
            <p className="bloco-caption text-fg-muted">
              {factor.issuer ? `${factor.issuer} · ` : ""}TOTP
            </p>
          </div>
        </div>
        <Badge tone={STATUS_TONE[factor.status]}>{STATUS_LABEL[factor.status]}</Badge>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <QrPlaceholder seed={qrSeed} />
        <div className="min-w-0 flex-1">
          <p className="bloco-callout text-fg-secondary">
            Aponte a camera do aplicativo autenticador para este codigo.
          </p>
          {factor.secret ? (
            <div className="mt-3">
              <p className="bloco-micro text-fg-muted">Chave de configuracao</p>
              <p className="bloco-mono mt-1 break-all rounded-[var(--r-md)] border border-border bg-surface-strong/60 px-3 py-2 text-[13px] text-fg">
                {factor.secret}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                icon={<Copy className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => void onAction?.("auth.twoFactor.copySecret", { factorId: factor.id })}
              >
                Copiar chave
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <p className="bloco-micro text-fg-muted">Criado em</p>
          <p className="bloco-callout text-fg">{formatDate(factor.createdAt)}</p>
        </div>
        <div>
          <p className="bloco-micro text-fg-muted">Ultimo uso</p>
          <p className="bloco-callout text-fg">
            {factor.lastUsedAt ? formatDate(factor.lastUsedAt) : "Nunca usado"}
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
          disabled={!data.canRemove || factor.status === "disabled"}
          onClick={handleRemove}
        >
          Remover fator
        </Button>
        {data.canRemove ? (
          <p className="bloco-micro mt-2 text-fg-faint">
            Ao remover, o acesso passa a depender apenas de e-mail e senha.
          </p>
        ) : (
          <p className="bloco-micro mt-2 text-warn">
            Este fator nao pode ser removido pelo seu perfil.
          </p>
        )}
      </div>
    </Panel>
  );

  /* ---- Cartao de codigos de recuperacao ---- */

  const recoveryPanel = (
    <Panel tone="glass" padding="lg" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] bg-info-soft text-info">
            <KeyRound className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="bloco-headline">Codigos de recuperacao</p>
            <p className="bloco-caption text-fg-muted">
              {data.recoveryCodes.filter((item) => !item.usedAt).length} disponiveis
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={codesVisible ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => setCodesVisible((current) => !current)}
        >
          {codesVisible ? "Ocultar" : "Mostrar"}
        </Button>
      </div>

      <p className="bloco-callout text-fg-secondary">
        Cada codigo entra uma unica vez quando voce nao tem o aplicativo autenticador. Guarde
        em lugar seguro.
      </p>

      <ul className="flex flex-col gap-1.5">
        {data.recoveryCodes.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-[var(--r-md)] border border-border bg-surface-strong/40 px-3 py-2",
              item.usedAt && "opacity-60",
            )}
          >
            <span
              className={cn(
                "bloco-mono text-[13px] tracking-wide text-fg",
                item.usedAt && "line-through",
                !codesVisible && !item.usedAt && "text-fg-faint",
              )}
            >
              {codesVisible || item.usedAt ? item.code : "••••-••••"}
            </span>
            {item.usedAt ? (
              <Badge tone="neutral">usado</Badge>
            ) : (
              <Badge tone="success">disponivel</Badge>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          variant="secondary"
          size="sm"
          icon={<Copy className="h-3.5 w-3.5" aria-hidden />}
          onClick={handleCopyCodes}
        >
          Copiar codigos
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
          onClick={handleRegenerate}
        >
          Gerar novos codigos
        </Button>
      </div>
    </Panel>
  );

  /* ---- Variacao em passos ---- */

  const steps: Array<{ id: AuthTwoFactorStep; label: string }> = [
    { id: "verify", label: "Verificar" },
    { id: "challenge", label: "Desafio" },
    { id: "confirm", label: "Confirmar" },
  ];

  const stepIndex = steps.findIndex((item) => item.id === step);

  const stepIndicator = (
    <ol className="flex items-center gap-2" aria-label="Etapas da verificacao">
      {steps.map((item, index) => {
        const active = index === stepIndex;
        const done = index < stepIndex;
        return (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                done && "border-accent bg-accent text-accent-fg",
                active && "border-accent text-accent",
                !done && !active && "border-border text-fg-faint",
              )}
              aria-hidden
            >
              {done ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span
              className={cn(
                "bloco-caption",
                active ? "text-fg" : "text-fg-faint",
              )}
            >
              {item.label}
            </span>
            {index < steps.length - 1 ? (
              <span className="mx-1 h-px w-6 bg-border" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );

  const stepContent = (() => {
    if (step === "verify") {
      return (
        <div className="flex flex-col gap-4">
          <Callout tone="info" icon={<ShieldCheck className="h-4 w-4" />}>
            Confirme que o aplicativo autenticador mostra o mesmo codigo de 6 digitos antes de
            continuar.
          </Callout>
          {factorCard}
          <Button onClick={() => setStep("challenge")} trailingIcon={<Check className="h-4 w-4" aria-hidden />}>
            Verificar codigo
          </Button>
        </div>
      );
    }

    if (step === "challenge") {
      return (
        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
          <Field label="Codigo de 6 digitos" htmlFor="mfa-challenge-code" required>
            <AuthCodeInput
              value={code}
              onChange={setCode}
              ariaLabel="Codigo de verificacao de 6 digitos"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={code.length < 6}>
              Confirmar codigo
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep("verify")}>
              Voltar
            </Button>
          </div>
        </form>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <Callout tone="success" title="Segundo fator ativo" icon={<Check className="h-4 w-4" />}>
          A partir de agora o login exige o codigo do aplicativo autenticador.
        </Callout>
        {recoveryPanel}
        <Button variant="ghost" onClick={() => setStep("verify")}>
          Revisar o fator
        </Button>
      </div>
    );
  })();

  /* ---- Variacoes ---- */

  if (variant === "inline") {
    return (
      <BlockFrame
        requires={["database"]}
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        state={state}
        className="w-full"
      >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION}
        className="flex w-full flex-col gap-4"
      >
        {data.error ? <Callout tone="danger" title="Nao foi possivel concluir">{data.error}</Callout> : null}
        {data.notice ? <Callout tone="success">{data.notice}</Callout> : null}
        {factorCard}
        {recoveryPanel}
      </motion.div>
      </BlockFrame>
    );
  }

  if (variant === "steps") {
    return (
      <BlockFrame
        requires={["database"]}
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        state={state}
        className="w-full"
      >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION}
        className="flex w-full flex-col gap-5"
      >
        <div>
          <h1 className="bloco-title3">Verificacao em duas etapas</h1>
          <p className="bloco-callout mt-1 text-fg-muted">
            Vincule seu aplicativo autenticador e guarde os codigos de recuperacao.
          </p>
        </div>
        {stepIndicator}
        {data.error ? <Callout tone="danger" title="Nao foi possivel concluir">{data.error}</Callout> : null}
        {data.notice ? <Callout tone="success">{data.notice}</Callout> : null}
        {stepContent}
      </motion.div>
      </BlockFrame>
    );
  }

  return (
    <BlockFrame
      requires={["database"]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className="w-full"
    >
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION}
      className="flex w-full flex-col gap-4"
    >
      {data.error ? <Callout tone="danger" title="Nao foi possivel concluir">{data.error}</Callout> : null}
      {data.notice ? <Callout tone="success">{data.notice}</Callout> : null}
      <div className="grid w-full gap-4 lg:grid-cols-2">
        {factorCard}
        {recoveryPanel}
      </div>
    </motion.div>
    </BlockFrame>
  );
}

export default AuthTwoFactor;
