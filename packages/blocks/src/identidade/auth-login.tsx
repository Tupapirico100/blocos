import * as React from "react";
import { motion } from "motion/react";
import { ArrowRight, KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, Button, Callout, Field, Input, Panel } from "@blocos/ui";
import { BlockFrame, type BlockProps } from "../shared/index.js";
import { AuthCodeInput } from "./code-input.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type AuthLoginStep = "credentials" | "2fa";
export type AuthLoginVariant = "split" | "centered" | "minimal";
export type AuthTwoFactorMethod = "totp" | "sms" | "email";

export interface AuthLoginBrand {
  /** Nome do programa exibido na marca. */
  name: string;
  /** Frase de apoio da marca. */
  tagline?: string;
}

export interface AuthLoginData {
  /** `credentials` mostra e-mail + senha; `2fa` pede o codigo de 6 digitos. */
  step: AuthLoginStep;
  brand: AuthLoginBrand;
  /** E-mail ja preenchido (quem voltou de um desafio de 2FA). */
  email?: string;
  /** Metodo do segundo fator quando `step === "2fa"`. */
  method?: AuthTwoFactorMethod;
  /** Destino mascarado do desafio (ex.: `***4321`). */
  destination?: string;
  /** Identificador do desafio devolvido pelo backend. */
  challengeId?: string;
  /** Erro devolvido pela ultima tentativa. */
  error?: string;
  /** Aviso informativo (ex.: link de recuperacao enviado). */
  notice?: string;
  /** Link de suporte exibido no rodape do cartao. */
  support?: { label: string; href: string };
}

const MOTION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] } as const;

const METHOD_LABEL: Record<AuthTwoFactorMethod, string> = {
  totp: "Aplicativo autenticador",
  sms: "SMS",
  email: "E-mail",
};

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function AuthLogin(props: BlockProps<AuthLoginData, AuthLoginVariant>) {
  const {
    data,
    onAction,
    variant = "split",
    labels,
    state,
    connectors,
    onRequestConnector,
  } = props;
  const isTwoFactor = data.step === "2fa";

  const [email, setEmail] = React.useState(data.email ?? "");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const brandName = labels?.brand ?? data.brand.name;
  const submitLabel = labels?.submit ?? (isTwoFactor ? "Verificar código" : "Entrar");
  const methodLabel = data.method ? METHOD_LABEL[data.method] : METHOD_LABEL.totp;

  const handleCredentialsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onAction?.("auth.login", { email: email.trim(), password });
  };

  const handleCodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onAction?.("auth.twoFactor.verify", {
      code: code.trim(),
      challengeId: data.challengeId,
      method: data.method ?? "totp",
    });
  };

  const handleRecovery = () => {
    void onAction?.("auth.recovery.request", { email: email.trim() });
  };

  const handleResend = () => {
    void onAction?.("auth.twoFactor.resend", {
      challengeId: data.challengeId,
      method: data.method ?? "totp",
    });
  };

  /* ---- Campos (compartilhados entre as variacoes) ---- */

  const credentialsFields = (
    <>
      <Field label="E-mail" htmlFor="auth-login-email" required>
        <Input
          id="auth-login-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com.br"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field
        label="Senha"
        htmlFor="auth-login-password"
        required
        aside={
          <button
            type="button"
            onClick={handleRecovery}
            className="rounded-[var(--r-sm)] text-[12px] text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Esqueci minha senha
          </button>
        }
      >
        <Input
          id="auth-login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
    </>
  );

  const twoFactorFields = (
    <>
      <Callout tone="info" icon={<ShieldCheck className="h-4 w-4" />}>
        Digite o codigo de 6 digitos do seu {methodLabel.toLowerCase()}
        {data.destination ? ` (${data.destination})` : ""}. O codigo renova a cada 30 segundos.
      </Callout>
      <Field label="Codigo de verificacao" htmlFor="auth-login-code" required>
        <AuthCodeInput value={code} onChange={setCode} ariaLabel="Codigo de verificacao de 6 digitos" />
      </Field>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleResend}
          className="rounded-[var(--r-sm)] text-[13px] text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Reenviar codigo
        </button>
        <button
          type="button"
          onClick={() => void onAction?.("auth.twoFactor.cancel", { challengeId: data.challengeId })}
          className="rounded-[var(--r-sm)] text-[13px] text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Voltar para o login
        </button>
      </div>
    </>
  );

  const formFields = isTwoFactor ? twoFactorFields : credentialsFields;

  const formBody = (
    <form
      onSubmit={isTwoFactor ? handleCodeSubmit : handleCredentialsSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      {data.error ? (
        <Callout tone="danger" title="Nao foi possivel entrar">
          {data.error}
        </Callout>
      ) : null}
      {data.notice ? (
        <Callout tone="success" title="Tudo certo">
          {data.notice}
        </Callout>
      ) : null}

      {formFields}

      <Button type="submit" size="lg" trailingIcon={<ArrowRight className="h-4 w-4" />}>
        {submitLabel}
      </Button>

      {data.support ? (
        <p className="bloco-caption text-fg-muted">
          Precisa de ajuda?{" "}
          <a
            href={data.support.href}
            className="text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {data.support.label}
          </a>
        </p>
      ) : null}
    </form>
  );

  /* ---- Cabecalho do cartao ---- */

  const cardHeader = (
    <div className="mb-5">
      {variant === "minimal" ? null : (
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <span className="bloco-micro text-fg-muted">{brandName}</span>
        </div>
      )}
      <h1 className="bloco-title2">
        {isTwoFactor ? "Verificacao em duas etapas" : "Entrar na sua conta"}
      </h1>
      <p className="bloco-callout mt-1.5 text-fg-muted">
        {isTwoFactor
          ? "Como sua conta tem segundo fator ativo, precisamos de mais uma confirmacao."
          : "Acesse os dados do seu consultorio e o painel de atendimento."}
      </p>
    </div>
  );

  /* ---- Marca (variacao split) ---- */

  const brandPanel = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION}
      className="relative overflow-hidden rounded-[var(--r-lg)] border border-border bg-surface-strong/50 p-6 sm:p-8"
    >
      <div className="bloco-mono text-fg-faint">Aurora</div>
      <p className="bloco-display mt-2">{brandName}</p>
      {data.brand.tagline ? (
        <p className="bloco-body mt-3 max-w-sm text-fg-secondary">{data.brand.tagline}</p>
      ) : null}

      <ul className="mt-6 flex flex-col gap-3">
        {[
          { icon: <Mail className="h-4 w-4" aria-hidden />, text: "Atendimento no WhatsApp com fila unica" },
          { icon: <ShieldCheck className="h-4 w-4" aria-hidden />, text: "Consentimento registrado antes do prontuario" },
          { icon: <KeyRound className="h-4 w-4" aria-hidden />, text: "Acesso do dono da plataforma auditado" },
        ].map((item) => (
          <li key={item.text} className="flex items-start gap-2.5">
            <span className="mt-0.5 text-accent">{item.icon}</span>
            <span className="bloco-callout text-fg-secondary">{item.text}</span>
          </li>
        ))}
      </ul>

      <p className="bloco-micro mt-8 text-fg-faint">
        Dados de saude nunca sao exibidos fora do consultorio.
      </p>
    </motion.div>
  );

  /* ---- Variacoes ---- */

  if (variant === "split") {
    return (
      <BlockFrame
        requires={["database"]}
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        state={state}
        className="w-full"
      >
      <div className="grid w-full gap-6 lg:grid-cols-2">
        {brandPanel}
        <div className="flex items-center justify-center">
          <Panel tone="glass" padding="lg" className="w-full max-w-[440px]">
            {cardHeader}
            {formBody}
          </Panel>
        </div>
      </div>
      </BlockFrame>
    );
  }

  if (variant === "centered") {
    return (
      <BlockFrame
        requires={["database"]}
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        state={state}
        className="w-full"
      >
      <div className="flex w-full items-center justify-center p-2">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={MOTION}
          className="w-full max-w-[420px]"
        >
          <Panel tone="glass" padding="lg" className="w-full">
            {cardHeader}
            {formBody}
          </Panel>
          <p className="bloco-caption mt-4 text-center text-fg-faint">
            Aurora · acesso restrito a equipes autorizadas
          </p>
        </motion.div>
      </div>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={MOTION}
      className="w-full max-w-[380px]"
    >
      {cardHeader}
      {formBody}
      <div className="mt-5 flex items-center gap-2 text-fg-faint">
        <Badge tone="outline">2FA disponivel</Badge>
        <span className="bloco-micro">{brandName}</span>
      </div>
    </motion.div>
    </BlockFrame>
  );
}

export default AuthLogin;
