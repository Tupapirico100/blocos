import type { AuthLoginData } from "./auth-login.js";
import type { AuthRecoveryData } from "./auth-recovery.js";
import type { AuthTwoFactorData } from "./auth-two-factor.js";

/* ------------------------------------------------------------------ */
/* Dados ficticios do dominio de identidade                             */
/* Nomes, e-mails e telefones sao inventados (@exemplo.com.br).         */
/* ------------------------------------------------------------------ */

/** Tela de login no passo de credenciais. */
export const authLoginMock: AuthLoginData = {
  step: "credentials",
  brand: {
    name: "Nutri Aurora",
    tagline:
      "Do primeiro contato no WhatsApp ao plano alimentar, com o consultorio no controle.",
  },
  email: "mariana.albuquerque@exemplo.com.br",
  support: { label: "Falar com o suporte", href: "https://suporte.exemplo.com.br" },
};

/** Tela de login ja no desafio de segundo fator. */
export const authLoginTwoFactorMock: AuthLoginData = {
  ...authLoginMock,
  step: "2fa",
  method: "totp",
  destination: "***4321",
  challengeId: "desafio_7c2f",
  notice: "Enviamos um codigo de 6 digitos para o seu autenticador.",
};

/** Painel de segundo fator com fator TOTP ativo. */
export const authTwoFactorMock: AuthTwoFactorData = {
  factor: {
    id: "fator_9f3a2c",
    type: "totp",
    label: "Aplicativo autenticador",
    issuer: "Aurora",
    secret: "JBSW Y3DP EHPK 3PXP",
    createdAt: "2025-10-28T13:20:00-03:00",
    lastUsedAt: "2025-11-17T09:12:00-03:00",
    status: "active",
  },
  recoveryCodes: [
    { id: "rec_01", code: "4F7A-92KD" },
    { id: "rec_02", code: "P1QX-77MB" },
    { id: "rec_03", code: "ZK3D-08RE" },
    { id: "rec_04", code: "M9WT-6HYQ" },
    { id: "rec_05", code: "C2VN-45LS" },
    { id: "rec_06", code: "R8GA-11XB", usedAt: "2025-11-04T16:41:00-03:00" },
  ],
  challenge: { pending: false },
  canRemove: true,
};

/** Recuperacao de senha no passo de pedido do link. */
export const authRecoveryMock: AuthRecoveryData = {
  mode: "request",
  email: "rafael.nogueira@exemplo.com.br",
  policy: {
    minLength: 8,
    requireUpper: true,
    requireNumber: true,
    requireSymbol: false,
  },
};

/** Recuperacao de senha no passo de definicao da nova senha. */
export const authRecoverySetPasswordMock: AuthRecoveryData = {
  ...authRecoveryMock,
  mode: "set-password",
  email: undefined,
  token: { masked: "••••••••3f9a", expiresAt: "2025-11-17T18:00:00-03:00" },
};

export const identidadeMocks = {
  authLogin: authLoginMock,
  authLoginTwoFactor: authLoginTwoFactorMock,
  authTwoFactor: authTwoFactorMock,
  authRecovery: authRecoveryMock,
  authRecoverySetPassword: authRecoverySetPasswordMock,
};

export default identidadeMocks;
