import * as React from "react";
import { motion } from "motion/react";
import {
  CircleAlert,
  ClipboardList,
  NotebookPen,
  Scale,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { localToUtc, utcToLocal } from "@blocos/core";
import { Badge, Button, Field, Input, Panel, Segmented, Select, Skeleton, Textarea } from "@blocos/ui";
import { BlockFrame, requiresOf, rolesOf } from "../shared/index.js";
import type { BlockProps } from "../shared/index.js";
import { TZ, formatDateTime } from "./format.js";
import { clinicalEntryRecipe } from "./clinical-entry.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type ClinicalEntryKind = "consulta" | "medida";

export interface ClinicalEntryMeasures {
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
}

export interface ClinicalEntryData {
  patient: { id: string; name: string };
  /** Tipo de registro que o bloco vai gravar. */
  kind: ClinicalEntryKind;
  /** Consentimento de tratamento vigente. Ausente = gravacao bloqueada. */
  hasTreatmentConsent: boolean;
  treatmentConsent?: { grantedAt: string; textVersion: string } | null;
  /** Profissionais que podem registrar atendimento. */
  professionals?: string[];
  defaultProfessional?: string;
  /** Ultimas medidas conhecidas, para pre-preencher. */
  lastMeasures?: ClinicalEntryMeasures;
}

const KIND_META: Record<ClinicalEntryKind, { label: string; hint: string }> = {
  consulta: { label: "Consulta", hint: "Anamnese, evolucao e orientacoes" },
  medida: { label: "Medida", hint: "Peso, gordura corporal e cintura" },
};

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function ClinicalEntry(
  props: BlockProps<ClinicalEntryData, "form" | "wizard" | "inline">,
) {
  const { data, onAction, variant = "form", state = "success", className, connectors, onRequestConnector } = props;

  const [kind, setKind] = React.useState<ClinicalEntryKind>(data.kind);
  const [professional, setProfessional] = React.useState(data.defaultProfessional ?? data.professionals?.[0] ?? "");
  const [at, setAt] = React.useState(() => nowInConsultorio());
  const [summary, setSummary] = React.useState("");
  const [weight, setWeight] = React.useState(
    data.lastMeasures?.weightKg !== undefined ? String(data.lastMeasures.weightKg) : "",
  );
  const [bodyFat, setBodyFat] = React.useState(
    data.lastMeasures?.bodyFatPct !== undefined ? String(data.lastMeasures.bodyFatPct) : "",
  );
  const [waist, setWaist] = React.useState(
    data.lastMeasures?.waistCm !== undefined ? String(data.lastMeasures.waistCm) : "",
  );

  const hasConsent = Boolean(data.hasTreatmentConsent);

  /**
   * Portao de gravacao: sem consentimento de tratamento vigente nao da para
   * gravar. O `state` do BlockProps e o canal usado pelo host para sinalizar
   * o caso "forbidden" (sem consentimento) — e a ausencia de consentimento
   * nos dados tambem bloqueia.
   */
  // o estado "forbidden" (sem permissao) e do BlockFrame — ele nomeia o papel.
  // aqui so bloqueamos a GRAVACAO por falta de consentimento.
  const blocked = !hasConsent;

  const submit = () => {
    if (blocked) return;
    void onAction?.("clinical.entry.create", {
      patientId: data.patient.id,
      kind,
      professional,
      at,
      summary: summary.trim(),
      measures:
        kind === "medida"
          ? {
              weightKg: toNumber(weight),
              bodyFatPct: toNumber(bodyFat),
              waistCm: toNumber(waist),
            }
          : undefined,
    });
  };

  if (blocked) {
    return (
      <ConsentGate
        patientName={data.patient.name}
        consent={data.treatmentConsent ?? null}
        className={className}
      />
    );
  }

  return (
    <BlockFrame
      state={state}
      className={className}
      loading={
        <div className="flex flex-col gap-4"
      >
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      }
      empty={
        <div className="rounded-[var(--r-lg)] border border-dashed border-border p-6 text-center">
          <p className="bloco-headline">Nada para registrar</p>
          <p className="bloco-callout mt-1 text-fg-muted">
            O registro de consulta ou medida aparece aqui durante o atendimento.
          </p>
        </div>
      }
        recipe={clinicalEntryRecipe}
        
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <Panel tone="solid" padding="md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent-ink">
                <Stethoscope size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="bloco-title3 truncate">Novo registro para {data.patient.name}</h2>
                <p className="bloco-caption text-fg-muted">
                  {KIND_META[kind].hint}
                  {data.treatmentConsent
                    ? ` · consentimento ${data.treatmentConsent.textVersion}`
                    : ""}
                </p>
              </div>
            </div>
            <Badge tone="success" icon={<ShieldCheck size={11} aria-hidden />}>
              Consentimento vigente
            </Badge>
          </div>
        </Panel>

        {variant === "wizard" ? (
          <EntryWizard
            kind={kind}
            setKind={setKind}
            professionals={data.professionals ?? []}
            professional={professional}
            setProfessional={setProfessional}
            at={at}
            setAt={setAt}
            summary={summary}
            setSummary={setSummary}
            weight={weight}
            setWeight={setWeight}
            bodyFat={bodyFat}
            setBodyFat={setBodyFat}
            waist={waist}
            setWaist={setWaist}
            onSubmit={submit}
          />
        ) : variant === "inline" ? (
          <EntryInline
            kind={kind}
            summary={summary}
            setSummary={setSummary}
            onSubmit={submit}
          />
        ) : (
          <EntryForm
            kind={kind}
            setKind={setKind}
            professionals={data.professionals ?? []}
            professional={professional}
            setProfessional={setProfessional}
            at={at}
            setAt={setAt}
            summary={summary}
            setSummary={setSummary}
            weight={weight}
            setWeight={setWeight}
            bodyFat={bodyFat}
            setBodyFat={setBodyFat}
            waist={waist}
            setWaist={setWaist}
            onSubmit={submit}
          />
        )}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Portao: gravacao bloqueada                                           */
/* ------------------------------------------------------------------ */

function ConsentGate({
  patientName,
  consent,
  className,
}: {
  patientName: string;
  consent: { grantedAt: string; textVersion: string } | null;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`rounded-[var(--r-lg)] border border-warn/30 bg-warn-soft p-5 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn">
          <CircleAlert size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="bloco-headline text-warn">Gravacao bloqueada</p>
          <p className="bloco-body mt-1 text-fg-secondary">
            Gravacao bloqueada: sem consentimento de tratamento.
          </p>
          <p className="bloco-caption mt-2 text-fg-muted">
            O prontuario de {patientName} so aceita gravar consultas e medidas com consentimento de
            tratamento vigente (art. 11). Registre o consentimento com o texto vigente do consultorio
            para liberar o atendimento.
          </p>
          {consent ? (
            <p className="bloco-caption mt-2 text-fg-muted">
              Ultimo consentimento registrado: {consent.textVersion} em {formatDateTime(consent.grantedAt)}.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: formulario                                                 */
/* ------------------------------------------------------------------ */

interface EntryFieldsProps {
  kind: ClinicalEntryKind;
  setKind: (kind: ClinicalEntryKind) => void;
  professionals: string[];
  professional: string;
  setProfessional: (value: string) => void;
  at: string;
  setAt: (value: string) => void;
  summary: string;
  setSummary: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  bodyFat: string;
  setBodyFat: (value: string) => void;
  waist: string;
  setWaist: (value: string) => void;
  onSubmit: () => void;
}

function EntryForm(props: EntryFieldsProps) {
  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-4">
      <KindPicker kind={props.kind} setKind={props.setKind} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Profissional" required htmlFor="clinical-entry-professional">
          <Select
            id="clinical-entry-professional"
            value={props.professional}
            onChange={(event) => props.setProfessional(event.target.value)}
          >
            {props.professionals.length === 0 ? (
              <option value="">Selecione</option>
            ) : (
              props.professionals.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))
            )}
          </Select>
        </Field>
        <Field label="Data e hora" required htmlFor="clinical-entry-at">
          <Input
            id="clinical-entry-at"
            type="datetime-local"
            value={props.at}
            onChange={(event) => props.setAt(event.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Resumo do atendimento"
        hint="Fica no prontuario do paciente. Dado de saude: nao vai para log nem URL."
        htmlFor="clinical-entry-summary"
      >
        <Textarea
          id="clinical-entry-summary"
          value={props.summary}
          onChange={(event) => props.setSummary(event.target.value)}
          placeholder="Anamnese, orientacoes, plano do dia..."
          rows={4}
        />
      </Field>

      {props.kind === "medida" ? <MeasureFields {...props} /> : null}

      <div className="flex items-center justify-end gap-2">
        <Button onClick={props.onSubmit} icon={<NotebookPen size={15} aria-hidden />}>
          Gravar registro
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: wizard (passo a passo)                                      */
/* ------------------------------------------------------------------ */

function EntryWizard(props: EntryFieldsProps) {
  const [step, setStep] = React.useState(0);
  const steps = ["Tipo e atendimento", "Detalhes", "Revisar"];

  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-4">
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((label, index) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border bloco-label-sm font-semibold ${
                index <= step
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-border text-fg-faint"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`bloco-caption ${index === step ? "text-fg" : "text-fg-muted"}`}
              aria-current={index === step ? "step" : undefined}
            >
              {label}
            </span>
            {index < steps.length - 1 ? <span className="h-px w-6 bg-border" aria-hidden /> : null}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="flex flex-col gap-4">
          <KindPicker kind={props.kind} setKind={props.setKind} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Profissional" required htmlFor="wizard-professional">
              <Select
                id="wizard-professional"
                value={props.professional}
                onChange={(event) => props.setProfessional(event.target.value)}
              >
                {props.professionals.length === 0 ? (
                  <option value="">Selecione</option>
                ) : (
                  props.professionals.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                )}
              </Select>
            </Field>
            <Field label="Data e hora" required htmlFor="wizard-at">
              <Input
                id="wizard-at"
                type="datetime-local"
                value={props.at}
                onChange={(event) => props.setAt(event.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <Field label="Resumo do atendimento" htmlFor="wizard-summary">
            <Textarea
              id="wizard-summary"
              value={props.summary}
              onChange={(event) => props.setSummary(event.target.value)}
              placeholder="Anamnese, orientacoes, plano do dia..."
              rows={4}
            />
          </Field>
          {props.kind === "medida" ? <MeasureFields {...props} idPrefix="wizard" /> : null}
        </div>
      ) : null}

      {step === 2 ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col gap-3 rounded-[var(--r-md)] border border-border bg-surface/60 p-4"
        >
          <p className="bloco-headline text-fg">Revise antes de gravar</p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="bloco-micro">Tipo</dt>
              <dd className="bloco-body mt-0.5 text-fg">{KIND_META[props.kind].label}</dd>
            </div>
            <div>
              <dt className="bloco-micro">Profissional</dt>
              <dd className="bloco-body mt-0.5 text-fg">{props.professional || "—"}</dd>
            </div>
            <div>
              <dt className="bloco-micro">Data e hora</dt>
              <dd className="bloco-body mt-0.5 text-fg">{formatDateTime(toIso(props.at))}</dd>
            </div>
            <div>
              <dt className="bloco-micro">Medidas</dt>
              <dd className="bloco-body mt-0.5 text-fg">
                {props.kind === "medida" ? describeMeasureFields(props) : "—"}
              </dd>
            </div>
          </dl>
          {props.summary ? (
            <p className="bloco-caption rounded-[var(--r-sm)] border border-border bg-surface/70 p-3 text-fg-secondary">
              {props.summary}
            </p>
          ) : null}
        </motion.div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-8"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Voltar
        </Button>
        {step < steps.length - 1 ? (
          <Button
            size="sm"
            className="min-h-8"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          >
            Avancar
          </Button>
        ) : (
          <Button
            size="sm"
            className="min-h-8"
            onClick={props.onSubmit}
            icon={<NotebookPen size={14} aria-hidden />}
          >
            Gravar
          </Button>
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: inline (registro rapido)                                   */
/* ------------------------------------------------------------------ */

function EntryInline({
  kind,
  summary,
  setSummary,
  onSubmit,
}: {
  kind: ClinicalEntryKind;
  summary: string;
  setSummary: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Panel tone="solid" padding="sm" className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Badge tone={kind === "medida" ? "info" : "accent"} icon={kind === "medida" ? <Scale size={11} aria-hidden /> : <ClipboardList size={11} aria-hidden />}>
        {KIND_META[kind].label}
      </Badge>
      <Textarea
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        rows={1}
        placeholder="Registro rapido do atendimento..."
        className="min-h-[40px] flex-1"
      />
      <Button onClick={onSubmit} icon={<NotebookPen size={14} aria-hidden />}>
        Gravar
      </Button>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Blocos internos                                                      */
/* ------------------------------------------------------------------ */

function KindPicker({
  kind,
  setKind,
}: {
  kind: ClinicalEntryKind;
  setKind: (kind: ClinicalEntryKind) => void;
}) {
  return (
    <Field label="Tipo de registro" required>
      <Segmented
        options={[
          { value: "consulta", label: "Consulta", hint: KIND_META.consulta.hint },
          { value: "medida", label: "Medida", hint: KIND_META.medida.hint },
        ]}
        value={kind}
        onChange={setKind}
      />
    </Field>
  );
}

function MeasureFields(props: EntryFieldsProps & { idPrefix?: string }) {
  const prefix = props.idPrefix ?? "clinical-entry";
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Peso (kg)" htmlFor={`${prefix}-weight`}>
        <Input
          id={`${prefix}-weight`}
          type="number"
          step="0.1"
          inputMode="decimal"
          value={props.weight}
          onChange={(event) => props.setWeight(event.target.value)}
          placeholder="82,4"
        />
      </Field>
      <Field label="Gordura corporal (%)" htmlFor={`${prefix}-body-fat`}>
        <Input
          id={`${prefix}-body-fat`}
          type="number"
          step="0.1"
          inputMode="decimal"
          value={props.bodyFat}
          onChange={(event) => props.setBodyFat(event.target.value)}
          placeholder="24,5"
        />
      </Field>
      <Field label="Cintura (cm)" htmlFor={`${prefix}-waist`}>
        <Input
          id={`${prefix}-waist`}
          type="number"
          step="0.1"
          inputMode="decimal"
          value={props.waist}
          onChange={(event) => props.setWaist(event.target.value)}
          placeholder="88"
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function toNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function describeMeasureFields(props: EntryFieldsProps): string {
  const parts: string[] = [];
  const weight = toNumber(props.weight);
  const bodyFat = toNumber(props.bodyFat);
  const waist = toNumber(props.waist);
  if (weight !== undefined) parts.push(`${weight.toFixed(1)} kg`);
  if (bodyFat !== undefined) parts.push(`${bodyFat.toFixed(1)}% gordura`);
  if (waist !== undefined) parts.push(`${waist} cm cintura`);
  return parts.length > 0 ? parts.join(" · ") : "Sem medidas";
}

/**
 * "2025-03-14T15:30" -> ISO.
 * A conversao local -> UTC do fuso do consultorio (America/Sao_Paulo) faz DUAS
 * passadas por causa do DST — e por isso que usamos o helper do @blocos/core
 * em vez de `new Date(localInput)`.
 */
function toIso(localInput: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localInput);
  if (!match) return "";
  const [, year, month, day, hour, minute] = match;
  const date = localToUtc(TZ, {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: 0,
  });
  return date.toISOString();
}

/** Agora no fuso do consultorio, no formato aceito por <input type="datetime-local">. */
function nowInConsultorio(): string {
  const parts = utcToLocal(TZ, new Date());
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}
