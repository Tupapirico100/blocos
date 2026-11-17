import * as React from "react";
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  Field,
  Input,
  Panel,
  SectionHeader,
  Select,
  type BadgeTone,
} from "@blocos/ui";
import { formatBRL } from "@blocos/core";
import { Download, Printer, RotateCcw, ShieldCheck } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { paymentsCheckoutRecipe } from "./payments-checkout.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type PaymentVariant = "form" | "receipt" | "split";
export type PaymentStatus = "pendente" | "pago" | "estornado";

export interface PaymentMethodOption {
  id: string;
  label: string;
  kind: "pix" | "cartao_credito" | "cartao_debito" | "dinheiro" | "transferencia";
  /** Taxa da forma de pagamento, em centavos. */
  feeCents?: number;
}

export interface PaymentPackageOption {
  id: string;
  name: string;
  priceCents: number;
  sessions: number;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  patientId: string;
  patientName: string;
  packageId?: string;
  packageName: string;
  /** Valor em centavos. */
  amountCents: number;
  methodId: string;
  methodLabel: string;
  status: PaymentStatus;
  paidAt?: string;
  refundedAt?: string;
  /** Lead que originou a compra — volta para a etapa "new" em caso de estorno. */
  leadId?: string;
}

export interface PaymentsCheckoutData {
  payment?: PaymentRecord;
  methods: PaymentMethodOption[];
  packages?: PaymentPackageOption[];
  selectedPackageId?: string;
  selectedMethodId?: string;
  /** Valor em centavos ja apurado (desconto, parcelamento). */
  amountCents?: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  estornado: "Estornado",
};

const STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  pendente: "warn",
  pago: "success",
  estornado: "danger",
};

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function PaymentsCheckout(props: BlockProps<PaymentsCheckoutData, PaymentVariant>) {
  const {
    data,
    onAction,
    variant = "form",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const methods = data.methods ?? [];
  const packages = data.packages ?? [];

  const [packageId, setPackageId] = React.useState(data.selectedPackageId ?? packages[0]?.id ?? "");
  const [methodId, setMethodId] = React.useState(data.selectedMethodId ?? methods[0]?.id ?? "");
  const [patientName, setPatientName] = React.useState(data.payment?.patientName ?? "");
  /** Confirmacao pendente de uma acao destrutiva. */
  const [confirmando, setConfirmando] = React.useState<{ acao: string; payload?: unknown } | null>(
    null,
  );

  const selectedPackage = packages.find((p) => p.id === packageId) ?? null;
  const selectedMethod = methods.find((m) => m.id === methodId) ?? null;

  const amountCents =
    data.amountCents ?? selectedPackage?.priceCents ?? data.payment?.amountCents ?? 0;

  const confirmPayload = (confirmando?.payload ?? {}) as { id?: string };
  const pagamentoEmConfirmacao =
    confirmando?.acao === "payment.refund" && data.payment?.id === confirmPayload.id
      ? data.payment
      : null;

  const effectiveState =
    state === "success" && !data.payment && packages.length === 0 && methods.length === 0
      ? "empty"
      : state;

  function registerPayment() {
    onAction?.("payment.create", {
      patientName,
      packageId: selectedPackage?.id,
      packageName: selectedPackage?.name,
      methodId: selectedMethod?.id,
      amountCents,
    });
  }

  /** Estornar e destrutivo: passa pelo dialogo de confirmacao. */
  function requestRefund(payment: PaymentRecord) {
    setConfirmando({
      acao: "payment.refund",
      payload: {
        id: payment.id,
        amountCents: payment.amountCents,
        reason: "estorno_solicitado",
        returnLead: true,
        leadId: payment.leadId,
      },
    });
  }

  const form = (
    <PaymentForm
      packages={packages}
      methods={methods}
      packageId={packageId}
      methodId={methodId}
      patientName={patientName}
      amountCents={amountCents}
      onPackageChange={setPackageId}
      onMethodChange={setMethodId}
      onPatientChange={setPatientName}
      onSubmit={registerPayment}
    />
  );

  const receipt = data.payment ? (
    <PaymentReceipt
      payment={data.payment}
      onRefund={() => requestRefund(data.payment!)}
      onPrint={() => onAction?.("payment.receipt", { id: data.payment!.id, format: "print" })}
      onDownload={() => onAction?.("payment.receipt", { id: data.payment!.id, format: "pdf" })}
    />
  ) : (
    <Panel tone="outline" className="flex flex-col items-center gap-2 text-center">
      <p className="bloco-headline">Sem recibo para exibir</p>
      <p className="bloco-caption text-fg-muted">
        Registre um pagamento para gerar o recibo do paciente.
      </p>
    </Panel>
  );

  return (
    <BlockFrame
      state={effectiveState}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      className={className}
        recipe={paymentsCheckoutRecipe}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Financeiro"
          title="Pagamento e recibo"
          description="Valores em centavos exibidos em BRL. O estorno devolve o lead ao funil."
        />

        {variant === "form" ? form : null}
        {variant === "receipt" ? receipt : null}
        {variant === "split" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {form}
            {receipt}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmando !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmando(null);
        }}
        title={
          pagamentoEmConfirmacao
            ? `Estornar o pagamento de ${pagamentoEmConfirmacao.patientName}`
            : "Estornar pagamento"
        }
        description={
          pagamentoEmConfirmacao
            ? `O valor de ${formatBRL(pagamentoEmConfirmacao.amountCents)} volta ao paciente e o lead retorna para a etapa new do funil. A operacao fica registrada e o paciente precisa ser notificado. Para reverter, registre um novo pagamento.`
            : "Esta acao nao pode ser desfeita pela interface."
        }
        confirmLabel={
          pagamentoEmConfirmacao
            ? `Estornar ${formatBRL(pagamentoEmConfirmacao.amountCents)}`
            : "Estornar"
        }
        onConfirm={() => {
          if (!confirmando) return;
          void onAction?.(confirmando.acao, confirmando.payload);
        }}
      />
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Formulario                                                           */
/* ------------------------------------------------------------------ */

function PaymentForm({
  packages,
  methods,
  packageId,
  methodId,
  patientName,
  amountCents,
  onPackageChange,
  onMethodChange,
  onPatientChange,
  onSubmit,
}: {
  packages: PaymentPackageOption[];
  methods: PaymentMethodOption[];
  packageId: string;
  methodId: string;
  patientName: string;
  amountCents: number;
  onPackageChange: (value: string) => void;
  onMethodChange: (value: string) => void;
  onPatientChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Panel tone="glass" className="flex flex-col gap-4">
      <p className="bloco-headline">Registrar pagamento</p>

      <Field label="Paciente" htmlFor="payment-patient">
        <Input
          id="payment-patient"
          value={patientName}
          placeholder="Nome do paciente"
          onChange={(e) => onPatientChange(e.target.value)}
        />
      </Field>

      <Field label="Pacote" htmlFor="payment-package">
        <Select
          id="payment-package"
          value={packageId}
          onChange={(e) => onPackageChange(e.target.value)}
        >
          {packages.length === 0 ? <option value="">Nenhum pacote cadastrado</option> : null}
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} — {formatBRL(pkg.priceCents)} ({pkg.sessions} sessoes)
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Forma de pagamento" htmlFor="payment-method">
        <Select id="payment-method" value={methodId} onChange={(e) => onMethodChange(e.target.value)}>
          {methods.length === 0 ? <option value="">Nenhuma forma disponivel</option> : null}
          {methods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-end justify-between gap-3 rounded-[var(--r-md)] border border-border bg-surface-strong/50 p-4">
        <div>
          <p className="bloco-micro">Valor</p>
          <p className="bloco-title2 tabular-nums">{formatBRL(amountCents)}</p>
        </div>
        <Button onClick={onSubmit} disabled={!packageId || !methodId}>
          Registrar pagamento
        </Button>
      </div>

      <p className="bloco-micro">
        Valor calculado em centavos (inteiro) e formatado em BRL apenas na exibicao.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Recibo                                                               */
/* ------------------------------------------------------------------ */

function PaymentReceipt({
  payment,
  onRefund,
  onPrint,
  onDownload,
}: {
  payment: PaymentRecord;
  onRefund: () => void;
  onPrint: () => void;
  onDownload: () => void;
}) {
  return (
    <Panel tone="glass" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="bloco-title3">Recibo {payment.receiptNumber}</p>
          <p className="bloco-caption text-fg-muted">
            {payment.patientName} · {payment.packageName}
          </p>
        </div>
        <Badge tone={STATUS_TONE[payment.status]}>{STATUS_LABEL[payment.status]}</Badge>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="bloco-micro">Valor</dt>
          <dd className="bloco-title3 tabular-nums">{formatBRL(payment.amountCents)}</dd>
        </div>
        <div>
          <dt className="bloco-micro">Forma de pagamento</dt>
          <dd className="bloco-body text-fg">{payment.methodLabel}</dd>
        </div>
        <div>
          <dt className="bloco-micro">Pago em</dt>
          <dd className="bloco-body text-fg">{formatDateTime(payment.paidAt)}</dd>
        </div>
        <div>
          <dt className="bloco-micro">Estornado em</dt>
          <dd className="bloco-body text-fg">{formatDateTime(payment.refundedAt)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="secondary"
          icon={<Printer size={14} aria-hidden />}
          onClick={onPrint}
        >
          Imprimir
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Download size={14} aria-hidden />}
          onClick={onDownload}
        >
          Baixar recibo
        </Button>
        {payment.status === "pago" ? (
          <Button size="sm" variant="danger" icon={<RotateCcw size={14} aria-hidden />} onClick={onRefund}>
            Estornar
          </Button>
        ) : null}
      </div>

      {payment.status === "pago" ? (
        <Callout
          tone="warn"
          title="Estorno devolve o lead"
          icon={<ShieldCheck size={16} aria-hidden />}
        >
          Ao estornar, o valor volta e o lead retorna para a etapa <strong>new</strong> do funil. A
          operacao e registrada e o paciente precisa ser notificado.
        </Callout>
      ) : null}
    </Panel>
  );
}
