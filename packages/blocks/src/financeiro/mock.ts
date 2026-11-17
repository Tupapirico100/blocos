import type { FinanceOverviewData } from "./finance-overview.js";
import type { PackagesPricingData } from "./packages-pricing.js";
import type { PaymentMethodOption, PaymentPackageOption, PaymentRecord, PaymentsCheckoutData } from "./payments-checkout.js";

/**
 * Dados ficticios do dominio "financeiro" para o catalogo.
 * Todos os valores em centavos. Nomes brasileiros. Nenhum dado real de paciente.
 */

export const servicePackages = [
  {
    id: "pkg-01",
    name: "Avaliacao inicial",
    description: "Primeira consulta com plano de atendimento.",
    priceCents: 28000,
    sessions: 1,
    validDays: 30,
    active: true,
  },
  {
    id: "pkg-02",
    name: "Pacote 4 sessoes",
    description: "Quatro sessoes de acompanhamento.",
    priceCents: 96000,
    sessions: 4,
    validDays: 60,
    active: true,
    sessionsPerWeek: 1,
  },
  {
    id: "pkg-03",
    name: "Pacote 8 sessoes",
    description: "Oito sessoes com reavaliacao no meio do caminho.",
    priceCents: 176000,
    sessions: 8,
    validDays: 90,
    active: true,
    sessionsPerWeek: 1,
  },
  {
    id: "pkg-04",
    name: "Pacote 12 sessoes",
    description: "Ciclo completo de trimestre.",
    priceCents: 240000,
    sessions: 12,
    validDays: 120,
    active: true,
    sessionsPerWeek: 1,
  },
  {
    id: "pkg-05",
    name: "Pacote empresa (inativo)",
    description: "Plano corporativo descontinuado.",
    priceCents: 320000,
    sessions: 10,
    validDays: 180,
    active: false,
  },
];

export const packagesPricingMock: PackagesPricingData = {
  packages: servicePackages,
};

export const paymentMethods: PaymentMethodOption[] = [
  { id: "pix", label: "Pix", kind: "pix" },
  { id: "cartao-credito", label: "Cartao de credito", kind: "cartao_credito" },
  { id: "cartao-debito", label: "Cartao de debito", kind: "cartao_debito" },
  { id: "dinheiro", label: "Dinheiro", kind: "dinheiro" },
  { id: "transferencia", label: "Transferencia", kind: "transferencia" },
];

export const paymentPackages: PaymentPackageOption[] = servicePackages
  .filter((pkg) => pkg.active)
  .map((pkg) => ({ id: pkg.id, name: pkg.name, priceCents: pkg.priceCents, sessions: pkg.sessions }));

export const paymentRecord: PaymentRecord = {
  id: "pay-2041",
  receiptNumber: "REC-2024-0312-018",
  patientId: "pac-03",
  patientName: "Camila Rezende",
  packageId: "pkg-02",
  packageName: "Pacote 4 sessoes",
  amountCents: 96000,
  methodId: "cartao-credito",
  methodLabel: "Cartao de credito",
  status: "pago",
  paidAt: "2024-03-12T10:42:00-03:00",
  refundedAt: undefined,
  leadId: "lead-882",
};

export const paymentsCheckoutMock: PaymentsCheckoutData = {
  payment: paymentRecord,
  methods: paymentMethods,
  packages: paymentPackages,
  selectedPackageId: "pkg-02",
  selectedMethodId: "cartao-credito",
  amountCents: 96000,
};

export const financeOverviewMock: FinanceOverviewData = {
  month: "2024-03",
  revenueCents: 12846000,
  previousRevenueCents: 11230000,
  ticketAverageCents: 214100,
  attendanceRate: 0.842,
  paidSessions: 60,
  scheduledSessions: 71,
  days: [
    { date: "2024-03-01", amountCents: 480000, sessions: 3, attended: true },
    { date: "2024-03-04", amountCents: 640000, sessions: 4, attended: true },
    { date: "2024-03-05", amountCents: 320000, sessions: 2, attended: true },
    { date: "2024-03-06", amountCents: 560000, sessions: 3, attended: false },
    { date: "2024-03-08", amountCents: 720000, sessions: 4, attended: true },
    { date: "2024-03-11", amountCents: 880000, sessions: 5, attended: true },
    { date: "2024-03-12", amountCents: 960000, sessions: 5, attended: true },
    { date: "2024-03-13", amountCents: 720000, sessions: 4, attended: true },
    { date: "2024-03-14", amountCents: 480000, sessions: 3, attended: false },
    { date: "2024-03-15", amountCents: 1040000, sessions: 6, attended: true },
    { date: "2024-03-18", amountCents: 1280000, sessions: 7, attended: true },
    { date: "2024-03-19", amountCents: 640000, sessions: 4, attended: true },
    { date: "2024-03-20", amountCents: 1120000, sessions: 6, attended: true },
    { date: "2024-03-21", amountCents: 960000, sessions: 5, attended: false },
    { date: "2024-03-22", amountCents: 1360000, sessions: 8, attended: true },
  ],
  byPackage: [
    { name: "Avaliacao inicial", amountCents: 1680000, sessions: 6 },
    { name: "Pacote 4 sessoes", amountCents: 5760000, sessions: 24 },
    { name: "Pacote 8 sessoes", amountCents: 3520000, sessions: 16 },
    { name: "Pacote 12 sessoes", amountCents: 1880000, sessions: 8 },
  ],
};

export const financeiroMocks = {
  "packages-pricing": packagesPricingMock,
  "payments-checkout": paymentsCheckoutMock,
  "finance-overview": financeOverviewMock,
};
