import * as React from "react";
import { motion } from "motion/react";
import { ChevronRight, Search, ShieldCheck, ShieldQuestion, ShieldX, UserRound } from "lucide-react";
import { Avatar, Badge, DataTable, Panel, Skeleton } from "@blocos/ui";
import type { BadgeTone, Column } from "@blocos/ui";
import { BlockFrame, requiresOf, rolesOf } from "../shared/index.js";
import type { BlockProps } from "../shared/index.js";
import { formatDate, formatPhone, normalizeText } from "./format.js";
import { patientsListRecipe } from "./patients-list.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type ConsentSituation = "vigente" | "ausente" | "revogado";

export interface PatientSummary {
  id: string;
  name: string;
  /** Telefone E.164. */
  phone: string;
  email?: string;
  /** Consentimento de TRATAMENTO (art. 11). */
  treatmentConsent: ConsentSituation;
  /** Ultima consulta (ISO). */
  lastVisitAt?: string;
  birthDate?: string;
  tags?: string[];
}

export interface PatientsListData {
  patients: PatientSummary[];
}

const CONSENT_LABEL: Record<ConsentSituation, string> = {
  vigente: "Consentido",
  ausente: "Sem consentimento",
  revogado: "Revogado",
};

const CONSENT_TONE: Record<ConsentSituation, BadgeTone> = {
  vigente: "success",
  ausente: "danger",
  revogado: "warn",
};

const CONSENT_ICON: Record<ConsentSituation, React.ReactNode> = {
  vigente: <ShieldCheck size={11} aria-hidden />,
  ausente: <ShieldX size={11} aria-hidden />,
  revogado: <ShieldQuestion size={11} aria-hidden />,
};

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function PatientsList(props: BlockProps<PatientsListData, "table" | "cards" | "grid">) {
  const { data, onAction, variant = "table", state = "success", className, connectors, onRequestConnector } = props;

  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const term = normalizeText(query);
    if (!term) return data.patients;
    return data.patients.filter((patient) => normalizeText(patient.name).includes(term));
  }, [data.patients, query]);

  const open = (patient: PatientSummary) => {
    void onAction?.("patient.open", { patientId: patient.id });
  };

  return (
    <BlockFrame
      state={state}
      className={className}
      loading={
        <div className="flex flex-col gap-2 rounded-[var(--r-lg)] border border-border p-4"
      >
          <Skeleton className="h-9 w-64" />
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-12 w-full" />
          ))}
        </div>
      }
      empty={
        <div className="rounded-[var(--r-lg)] border border-dashed border-border p-6 text-center">
          <p className="bloco-headline">Nenhum paciente cadastrado</p>
          <p className="bloco-callout mt-1 text-fg-muted">
            O paciente aparece aqui assim que o primeiro atendimento for registrado.
          </p>
        </div>
      }
        recipe={patientsListRecipe}
        
        connectors={connectors}
        onRequestConnector={onRequestConnector}
        onAction={onAction}
      >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-xs">
            <span className="sr-only">Buscar paciente por nome</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome"
              aria-label="Buscar paciente por nome"
              className="h-9 w-full rounded-[var(--r-md)] border border-border bg-surface-strong/60 pl-8 pr-3 bloco-control-sm text-fg placeholder:text-fg-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:ring-4 focus-visible:ring-accent/15"
            />
          </label>
          <p className="bloco-caption text-fg-muted">
            {filtered.length} de {data.patients.length} paciente(s)
          </p>
        </div>

        {variant === "table" ? (
          <PatientTable patients={filtered} onOpen={open} />
        ) : variant === "cards" ? (
          <PatientCards patients={filtered} onOpen={open} />
        ) : (
          <PatientGrid patients={filtered} onOpen={open} />
        )}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: tabela                                                     */
/* ------------------------------------------------------------------ */

function PatientTable({
  patients,
  onOpen,
}: {
  patients: PatientSummary[];
  onOpen: (patient: PatientSummary) => void;
}) {
  const columns: Array<Column<PatientSummary>> = [
    {
      key: "name",
      header: "Nome",
      render: (patient) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={patient.name} size={28} />
          <div className="min-w-0">
            <p className="bloco-headline truncate text-fg" title={patient.name}>{patient.name}</p>
            {patient.tags && patient.tags.length > 0 ? (
              <p className="bloco-caption truncate text-fg-muted" title={patient.tags.join(" · ")}>{patient.tags.join(" · ")}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contato",
      width: "220px",
      render: (patient) => (
        <div className="min-w-0">
          <p className="truncate text-fg-secondary" title={formatPhone(patient.phone)}>{formatPhone(patient.phone)}</p>
          {patient.email ? (
            <p className="bloco-caption truncate text-fg-muted" title={patient.email}>{patient.email}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "consent",
      header: "Consentimento de tratamento",
      width: "190px",
      render: (patient) => (
        <Badge tone={CONSENT_TONE[patient.treatmentConsent]} icon={CONSENT_ICON[patient.treatmentConsent]}>
          {CONSENT_LABEL[patient.treatmentConsent]}
        </Badge>
      ),
    },
    {
      key: "lastVisit",
      header: "Ultima consulta",
      width: "150px",
      render: (patient) => (
        <span className="text-fg-secondary">{formatDate(patient.lastVisitAt)}</span>
      ),
    },
    {
      key: "open",
      header: "",
      align: "right",
      width: "60px",
      render: (patient) => (
        <button
          type="button"
          onClick={() => onOpen(patient)}
          aria-label={`Abrir prontuario de ${patient.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--r-sm)] text-fg-faint transition-colors hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <Panel tone="solid" padding="none">
      <DataTable
        columns={columns}
        rows={patients}
        rowKey={(patient) => patient.id}
        onRowClick={onOpen}
        empty={
          <p className="bloco-callout px-4 py-6 text-center text-fg-muted">
            Nenhum paciente encontrado.
          </p>
        }
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: cartoes em lista                                           */
/* ------------------------------------------------------------------ */

function PatientCards({
  patients,
  onOpen,
}: {
  patients: PatientSummary[];
  onOpen: (patient: PatientSummary) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {patients.length === 0 ? (
        <p className="bloco-callout rounded-[var(--r-md)] border border-dashed border-border px-4 py-8 text-center text-fg-muted">
          Nenhum paciente encontrado.
        </p>
      ) : (
        patients.map((patient) => (
          <button
            key={patient.id}
            type="button"
            onClick={() => onOpen(patient)}
            className="flex items-center gap-3 rounded-[var(--r-md)] border border-border bg-surface/70 p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Avatar name={patient.name} size={38} />
            <span className="min-w-0 flex-1">
              <span className="bloco-headline block truncate text-fg" title={patient.name}>{patient.name}</span>
              <span className="bloco-caption block truncate text-fg-muted">
                {formatPhone(patient.phone)}
                {patient.email ? ` · ${patient.email}` : ""}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge
                  tone={CONSENT_TONE[patient.treatmentConsent]}
                  icon={CONSENT_ICON[patient.treatmentConsent]}
                >
                  {CONSENT_LABEL[patient.treatmentConsent]}
                </Badge>
                <span className="bloco-caption text-fg-muted">
                  Ultima consulta: {formatDate(patient.lastVisitAt)}
                </span>
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-fg-faint" aria-hidden />
          </button>
        ))
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: grade compacta                                             */
/* ------------------------------------------------------------------ */

function PatientGrid({
  patients,
  onOpen,
}: {
  patients: PatientSummary[];
  onOpen: (patient: PatientSummary) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {patients.length === 0 ? (
        <p className="bloco-callout rounded-[var(--r-md)] border border-dashed border-border px-4 py-8 text-center text-fg-muted sm:col-span-2 lg:col-span-3 xl:col-span-4">
          Nenhum paciente encontrado.
        </p>
      ) : (
        patients.map((patient) => (
          <motion.button
            key={patient.id}
            type="button"
            onClick={() => onOpen(patient)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col gap-2 rounded-[var(--r-md)] border border-border bg-surface/70 p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="flex items-center gap-2">
              <Avatar name={patient.name} size={32} />
              <span className="min-w-0">
                <span className="bloco-headline block truncate text-fg" title={patient.name}>{patient.name}</span>
                <span className="bloco-caption block truncate text-fg-muted">
                  {formatPhone(patient.phone)}
                </span>
              </span>
            </span>
            <Badge tone={CONSENT_TONE[patient.treatmentConsent]} icon={CONSENT_ICON[patient.treatmentConsent]}>
              {CONSENT_LABEL[patient.treatmentConsent]}
            </Badge>
            <span className="bloco-micro text-fg-faint">
              <UserRound size={11} className="mr-1 inline" aria-hidden />
              Ultima consulta: {formatDate(patient.lastVisitAt)}
            </span>
          </motion.button>
        ))
      )}
    </div>
  );
}
