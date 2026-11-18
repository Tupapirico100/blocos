import * as React from "react";
import { motion } from "motion/react";
import { ArrowRight, Check, KeyRound, Link2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button, Callout, Field, Input, Panel, ProgressBar, cn } from "@blocos/ui";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { authRecoveryRecipe } from "./auth-recovery.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type AuthRecoveryMode = "request" | "set-password";
export type AuthRecoveryVariant = "form" | "steps" | "split";
export type AuthRecoveryStep = "request" | "sent" | "set-password";

export interface AuthRecoveryPolicy {
  /** Tamanho minimo da senha. */
  minLength: number;
  /** Exige letra maiuscula. */
  requireUpper?: boolean;
  /** Exige numero. */
  requireNumber?: boolean;
  /** Exige caractere especial. */
  requireSymbol?: boolean;
}

export interface AuthRecoveryData {
  /** `request` pede o link; `set-password` define a nova senha. */
  mode: AuthRecoveryMode;
  /** E-mail informado (ou para onde o link foi enviado). */
  email?: string;
  /** O link de recuperacao ja foi enviado. */
  sent?: boolean;
  /** Token de uso unico — sempre exibido mascarado. */
  token?: { masked: string; expiresAt?: string };
  /** Politica de senha do programa. */
  policy?: AuthRecoveryPolicy;
  error?: string;
  notice?: string;
}

const MOTION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] } as const;

const DEFAULT_POLICY: AuthRecoveryPolicy = {
  minLength: 8,
  requireUpper: true,
  requireNumber: true,
  requireSymbol: false,
};

/* ------------------------------------------------------------------ */
/* Forca da senha (calculo local, simples)                              */
/* ------------------------------------------------------------------ */

interface StrengthResult {
  /** 0 a 4. */
  score: number;
  label: string;
  tone: "danger" | "warn" | "accent" | "success";
  checks: Array<{ id: string; label: string; met: boolean }>;
}

function scorePassword(password: string, policy: AuthRecoveryPolicy): StrengthResult {
  const checks: Array<{ id: string; label: string; met: boolean }> = [
    {
      id: "length",
      label: `Pelo menos ${policy.minLength} caracteres`,
      met: password.length >= policy.minLength,
    },
    {
      id: "upper",
      label: "Uma letra maiuscula",
      met: !policy.requireUpper || /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "Um numero",
      met: !policy.requireNumber || /[0-9]/.test(password),
    },
    {
      id: "symbol",
      label: "Um caractere especial",
      met: !policy.requireSymbol || /[^A-Za-z0-9]/.test(password),
    },
  ];

  const met = checks.filter((check) => check.met).length;
  const score = password.length === 0 ? 0 : met;

  const label = score <= 1 ? "fraca" : score === 2 ? "media" : score === 3 ? "boa" : "forte";
  const tone: StrengthResult["tone"] =
    score <= 1 ? "danger" : score === 2 ? "warn" : score === 3 ? "accent" : "success";

  return { score, label, tone, checks };
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function AuthRecovery(props: BlockProps<AuthRecoveryData, AuthRecoveryVariant>) {
  const {
    data,
    onAction,
    variant = "form",
    labels,
    state,
    connectors,
    onRequestConnector,
  } = props;

  const policy = data.policy ?? DEFAULT_POLICY;
  const isSettingPassword = data.mode === "set-password";

  const [email, setEmail] = React.useState(data.email ?? "");
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [step, setStep] = React.useState<AuthRecoveryStep>(
    isSettingPassword ? "set-password" : data.sent ? "sent" : "request",
  );

  const strength = scorePassword(password, policy);
  const confirmationError =
    confirmation.length > 0 && confirmation !== password
      ? "As senhas nao conferem."
      : undefined;
  const passwordReady =
    password.length >= policy.minLength &&
    strength.checks.every((check) => check.met) &&
    confirmation.length > 0 &&
    confirmation === password;

  const handleRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onAction?.("auth.recovery.request", { email: email.trim() });
    setStep("sent");
  };

  const handleSetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordReady) return;
    // O token de recuperacao vem da sessao do backend — nunca do cliente.
    void onAction?.("auth.password.set", { password, passwordConfirmation: confirmation });
  };

  /* ---- Etapa: pedir link ---- */

  const requestForm = (
    <form onSubmit={handleRequest} className="flex flex-col gap-4" noValidate>
      <Field label="E-mail da conta" htmlFor="auth-recovery-email" required>
        <Input
          id="auth-recovery-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com.br"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Button type="submit" trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
        {labels?.submit ?? "Enviar link de recuperacao"}
      </Button>
    </form>
  );

  const sentMessage = (
    <div className="flex flex-col gap-4">
      <Callout tone="success" title="Link enviado" icon={<Check className="h-4 w-4" aria-hidden />}>
        {data.email
          ? `Se houver uma conta com este e-mail, o link de recuperacao foi enviado para ${data.email}.`
          : "Se houver uma conta com este e-mail, enviamos o link de recuperacao."}
        {" "}O link vale por um tempo limitado e so pode ser usado uma vez.
      </Callout>
      <Button variant="ghost" onClick={() => setStep("request")}>
        Usar outro e-mail
      </Button>
    </div>
  );

  /* ---- Etapa: definir nova senha ---- */

  const setPasswordForm = (
    <form onSubmit={handleSetPassword} className="flex flex-col gap-4" noValidate>
      {data.token ? (
        <p className="bloco-caption text-fg-muted">
          Token de recuperacao: <span className="bloco-mono text-fg">{data.token.masked}</span>
          {data.token.expiresAt ? " · uso unico" : ""}
        </p>
      ) : null}

      <Field label="Nova senha" htmlFor="auth-recovery-password" required>
        <Input
          id="auth-recovery-password"
          type="password"
          autoComplete="new-password"
          placeholder="Escolha uma senha forte"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="bloco-micro text-fg-muted">Forca da senha</span>
          <span
            className={cn(
              "bloco-caption font-medium",
              strength.tone === "danger" && "text-danger",
              strength.tone === "warn" && "text-warn",
              strength.tone === "accent" && "text-accent-ink",
              strength.tone === "success" && "text-success",
            )}
          >
            {password.length === 0 ? "—" : strength.label}
          </span>
        </div>
        <ProgressBar
          value={strength.score}
          max={4}
          tone={strength.tone}
          label="Forca da senha"
        />
        <ul className="mt-1 grid gap-1 sm:grid-cols-2">
          {strength.checks.map((check) => (
            <li key={check.id} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px]",
                  check.met ? "bg-success-soft text-success" : "bg-surface-active text-fg-faint",
                )}
                aria-hidden
              >
                {check.met ? <Check className="h-2.5 w-2.5" /> : "•"}
              </span>
              <span className="bloco-caption text-fg-muted">{check.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <Field
        label="Repetir a senha"
        htmlFor="auth-recovery-confirmation"
        required
        error={confirmationError}
      >
        <Input
          id="auth-recovery-confirmation"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          invalid={Boolean(confirmationError)}
        />
      </Field>

      <Button type="submit" disabled={!passwordReady} trailingIcon={<Check className="h-4 w-4" aria-hidden />}>
        {labels?.submit ?? "Salvar nova senha"}
      </Button>
    </form>
  );

  /* ---- Bloco lateral (variacao split) ---- */

  const asidePanel = (
    <div className="flex flex-col gap-4">
      <div>
        <p className="bloco-micro text-fg-muted">Aurora</p>
        <p className="bloco-title3 mt-1">Recuperacao de acesso</p>
        <p className="bloco-callout mt-2 text-fg-secondary">
          Voce precisa de uma conta com e-mail e senha. Se nao lembra a senha, enviamos um link de
          uso unico para o e-mail cadastrado.
        </p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {[
          { icon: <Lock className="h-4 w-4" aria-hidden />, text: "O link expira e vale uma unica vez" },
          { icon: <ShieldCheck className="h-4 w-4" aria-hidden />, text: "A resposta e igual para e-mails existentes e inexistentes" },
          { icon: <Mail className="h-4 w-4" aria-hidden />, text: "Nunca enviamos dado de saude por e-mail" },
        ].map((item) => (
          <li key={item.text} className="flex items-start gap-2.5">
            <span className="mt-0.5 text-accent-ink">{item.icon}</span>
            <span className="bloco-callout text-fg-secondary">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  /* ---- Variacao em passos ---- */

  const steps: Array<{ id: AuthRecoveryStep; label: string }> = [
    { id: "request", label: "Pedir link" },
    { id: "sent", label: "Confirmar envio" },
    { id: "set-password", label: "Definir senha" },
  ];
  const stepIndex = steps.findIndex((item) => item.id === step);

  const stepIndicator = (
    <ol className="flex items-center gap-2" aria-label="Etapas da recuperacao">
      {steps.map((item, index) => {
        const active = index === stepIndex;
        const done = index < stepIndex;
        return (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                done && "border-accent bg-accent text-accent-fg",
                active && "border-accent text-accent-ink",
                !done && !active && "border-border text-fg-faint",
              )}
              aria-hidden
            >
              {done ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span className={cn("bloco-caption", active ? "text-fg" : "text-fg-faint")}>{item.label}</span>
            {index < steps.length - 1 ? <span className="mx-1 h-px w-6 bg-border" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );

  /* ---- Cabecalho ---- */

  const header = (
    <div className="mb-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent-ink">
          <KeyRound className="h-4 w-4" aria-hidden />
        </span>
        <span className="bloco-micro text-fg-muted">Aurora</span>
      </div>
      <h2 className="bloco-title2">
        {isSettingPassword ? "Definir nova senha" : "Esqueci minha senha"}
      </h2>
      <p className="bloco-callout mt-1.5 text-fg-muted">
        {isSettingPassword
          ? "Escolha uma senha nova para voltar a entrar no programa."
          : "Informe o e-mail cadastrado e enviaremos o link de recuperacao."}
      </p>
    </div>
  );

  const body = (() => {
    if (isSettingPassword) return setPasswordForm;
    if (step === "sent") return sentMessage;
    return requestForm;
  })();

  const messages = (
    <>
      {data.error ? (
        <Callout tone="danger" title="Nao foi possivel continuar">
          {data.error}
        </Callout>
      ) : null}
      {data.notice ? <Callout tone="info">{data.notice}</Callout> : null}
    </>
  );

  /* ---- Variacoes ---- */

  if (variant === "split") {
    return (
      <BlockFrame
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        state={state}
        className="w-full"
        recipe={authRecoveryRecipe}
        onAction={onAction}
      >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION}
        className="grid w-full gap-6 lg:grid-cols-2"
      >
        <Panel tone="glass" padding="lg" className="flex flex-col justify-center">
          {asidePanel}
        </Panel>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-[420px]">
            {header}
            {messages}
            {body}
          </div>
        </div>
      </motion.div>
      </BlockFrame>
    );
  }

  if (variant === "steps") {
    return (
      <BlockFrame
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        state={state}
        className="w-full"
        recipe={authRecoveryRecipe}
        requires={requiresOf(authRecoveryRecipe)}
        requiredRoles={rolesOf(authRecoveryRecipe)}
        onAction={onAction}
      >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION}
        className="flex w-full flex-col gap-5"
      >
        {stepIndicator}
        {header}
        {messages}
        {body}
      </motion.div>
      </BlockFrame>
    );
  }

  return (
    <BlockFrame
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className="w-full"
        recipe={authRecoveryRecipe}
        requires={requiresOf(authRecoveryRecipe)}
        requiredRoles={rolesOf(authRecoveryRecipe)}
        onAction={onAction}
      >
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION}
      className="flex w-full items-center justify-center"
    >
      <div className="w-full max-w-[420px]">
        {header}
        {messages}
        {body}
        <p className="bloco-caption mt-5 text-fg-faint">
          <Link2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          O link de recuperacao nunca e enviado por WhatsApp.
        </p>
      </div>
    </motion.div>
    </BlockFrame>
  );
}

export default AuthRecovery;
