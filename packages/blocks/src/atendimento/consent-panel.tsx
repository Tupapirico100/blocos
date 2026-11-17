import * as React from "react";
import { motion } from "motion/react";
import { FileCheck2, History, ScrollText, ShieldCheck, ShieldX } from "lucide-react";
import { Badge, Button, DataTable, Field, Panel, Select, Skeleton } from "@blocos/ui";
import type { BadgeTone, Column } from "@blocos/ui";
import { BlockFrame } from "../shared/index.js";
import type { BlockProps } from "../shared/index.js";
import { formatDate, formatDateTime } from "./format.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

/** Tratamento (art. 11) e marketing (art. 7) sao consents separados. */
export type ConsentKind = "tratamento" | "marketing";

export type ConsentChannel = "whatsapp" | "presencial" | "papel" | "email";

export interface ConsentRecord {
  id: string;
  patientId: string;
  patientName: string;
  kind: ConsentKind;
  channel: ConsentChannel;
  /** Instante da concessao (ISO). */
  grantedAt: string;
  /** Versao do texto que foi aceito — o registro guarda um snapshot. */
  textVersion: string;
  /** Snapshot do texto aceito no momento da concessao. */
  textSnapshot: string;
  /** Preenchido quando o consentimento foi revogado. */
  revokedAt?: string;
}

export interface ConsentPanelData {
  consents: ConsentRecord[];
  /** Versao vigente do texto do consultorio, por tipo de consentimento. */
  currentTextVersions?: Partial<Record<ConsentKind, string>>;
  patient?: { id: string; name: string };
}

const KIND_LABEL: Record<ConsentKind, string> = {
  tratamento: "Tratamento de dados",
  marketing: "Marketing",
};

const KIND_TONE: Record<ConsentKind, BadgeTone> = {
  tratamento: "accent",
  marketing: "info",
};

const CHANNEL_LABEL: Record<ConsentChannel, string> = {
  whatsapp: "WhatsApp",
  presencial: "Presencial",
  papel: "Assinado em papel",
  email: "E-mail",
};

function isVigente(record: ConsentRecord): boolean {
  return !record.revokedAt;
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function ConsentPanel(props: BlockProps<ConsentPanelData, "cards" | "timeline" | "table">) {
  const { data, onAction, variant = "cards", state = "success", className } = props;

  const patient = data.patient ?? {
    id: data.consents[0]?.patientId ?? "",
    name: data.consents[0]?.patientName ?? "Paciente",
  };

  const grant = (kind: ConsentKind, channel: ConsentChannel) => {
    const version =
      data.currentTextVersions?.[kind] ??
      data.consents.find((record) => record.kind === kind)?.textVersion ??
      "";
    void onAction?.("consent.grant", {
      patientId: patient.id,
      kind,
      textVersion: version,
      channel,
    });
  };

  return (
    <BlockFrame
      state={state}
      className={className}
      loading={
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((card) => (
            <div key={card} className="flex flex-col gap-3 rounded-[var(--r-lg)] border border-border p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-48" />
            </div>
          ))}
        </div>
      }
      empty={
        <div className="rounded-[var(--r-lg)] border border-dashed border-border p-6 text-center">
          <p className="bloco-headline">Nenhum consentimento registrado</p>
          <p className="bloco-callout mt-1 text-fg-muted">
            Registre a concessao de tratamento ou marketing com o texto vigente do consultorio.
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-[var(--r-md)] border border-warn/25 bg-warn-soft px-4 py-3">
          <p className="bloco-headline flex items-center gap-2 text-warn">
            <ScrollText size={15} aria-hidden /> Texto vigente do consultorio
          </p>
          <p className="bloco-caption mt-1 text-fg-secondary">
            O consentimento guarda um snapshot do texto aceito. Registre apenas com o texto vigente —
            tratamento e marketing sao separados e o de tratamento nao substitui o de marketing.
          </p>
        </div>

        {variant === "table" ? (
          <ConsentTable consents={data.consents} />
        ) : variant === "timeline" ? (
          <ConsentTimeline consents={data.consents} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <ConsentCard
              kind="tratamento"
              records={data.consents.filter((record) => record.kind === "tratamento")}
              currentVersion={data.currentTextVersions?.tratamento}
              onGrant={(channel) => grant("tratamento", channel)}
            />
            <ConsentCard
              kind="marketing"
              records={data.consents.filter((record) => record.kind === "marketing")}
              currentVersion={data.currentTextVersions?.marketing}
              onGrant={(channel) => grant("marketing", channel)}
            />
          </div>
        )}
      </div>
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: cartoes independentes                                      */
/* ------------------------------------------------------------------ */

function ConsentCard({
  kind,
  records,
  currentVersion,
  onGrant,
}: {
  kind: ConsentKind;
  records: ConsentRecord[];
  currentVersion?: string;
  onGrant: (channel: ConsentChannel) => void;
}) {
  const [channel, setChannel] = React.useState<ConsentChannel>("presencial");
  const latest = [...records].sort((a, b) => b.grantedAt.localeCompare(a.grantedAt))[0];
  const vigente = latest ? isVigente(latest) : false;
  const outdated = Boolean(latest && currentVersion && latest.textVersion !== currentVersion);

  return (
    <Panel tone="solid" padding="md" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="bloco-title3">{KIND_LABEL[kind]}</h3>
          <p className="bloco-caption mt-0.5 text-fg-muted">
            {kind === "tratamento" ? "Art. 11 — dados de saude" : "Art. 7 — comunicacoes de marketing"}
          </p>
        </div>
        {latest ? (
          <Badge tone={vigente ? "success" : "danger"} icon={vigente ? <ShieldCheck size={11} aria-hidden /> : <ShieldX size={11} aria-hidden />}>
            {vigente ? "Vigente" : "Revogado"}
          </Badge>
        ) : (
          <Badge tone="warn" icon={<ShieldX size={11} aria-hidden />}>
            Ausente
          </Badge>
        )}
      </div>

      {latest ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="bloco-micro">Concedido em</dt>
            <dd className="bloco-body mt-0.5 text-fg">{formatDateTime(latest.grantedAt)}</dd>
          </div>
          <div>
            <dt className="bloco-micro">Canal</dt>
            <dd className="bloco-body mt-0.5 text-fg">{CHANNEL_LABEL[latest.channel]}</dd>
          </div>
          <div>
            <dt className="bloco-micro">Versao do texto aceito</dt>
            <dd className="bloco-body mt-0.5 text-fg">
              {latest.textVersion}
              {currentVersion ? (
                <span className="bloco-caption ml-1.5 text-fg-muted">(vigente: {currentVersion})</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="bloco-micro">Paciente</dt>
            <dd className="bloco-body mt-0.5 text-fg">{latest.patientName}</dd>
          </div>
        </dl>
      ) : (
        <p className="bloco-callout text-fg-muted">
          Nenhuma concessao registrada para este tipo de consentimento.
        </p>
      )}

      {latest ? (
        <figure className="rounded-[var(--r-md)] border border-border bg-surface/60 p-3">
          <figcaption className="bloco-micro mb-1 text-fg-faint">
            Snapshot do texto aceito ({latest.textVersion})
          </figcaption>
          <blockquote className="bloco-caption text-fg-secondary">{latest.textSnapshot}</blockquote>
        </figure>
      ) : null}

      {outdated ? (
        <p className="bloco-caption rounded-[var(--r-md)] border border-warn/25 bg-warn-soft px-3 py-2 text-warn">
          O texto aceito ({latest?.textVersion}) nao e a versao vigente ({currentVersion}). Solicite nova
          concessao.
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-end gap-2">
        <Field label="Canal da concessao" className="w-48">
          <Select
            value={channel}
            onChange={(event) => setChannel(event.target.value as ConsentChannel)}
            aria-label={`Canal da concessao de ${KIND_LABEL[kind].toLowerCase()}`}
          >
            {(Object.keys(CHANNEL_LABEL) as ConsentChannel[]).map((value) => (
              <option key={value} value={value}>
                {CHANNEL_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          variant="secondary"
          size="sm"
          icon={<FileCheck2 size={14} aria-hidden />}
          onClick={() => onGrant(channel)}
        >
          Registrar consentimento
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: timeline de concessoes                                     */
/* ------------------------------------------------------------------ */

function ConsentTimeline({ consents }: { consents: ConsentRecord[] }) {
  const ordered = [...consents].sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));

  return (
    <Panel tone="solid" padding="md">
      <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
        {ordered.map((record) => (
          <motion.li
            key={record.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="relative"
          >
            <span className="absolute -left-[26px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-surface-strong text-fg-muted">
              <History size={10} aria-hidden />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={KIND_TONE[record.kind]}>{KIND_LABEL[record.kind]}</Badge>
              <Badge tone={isVigente(record) ? "success" : "danger"}>
                {isVigente(record) ? "Vigente" : "Revogado"}
              </Badge>
              <span className="bloco-caption text-fg-muted">
                {record.patientName} · {CHANNEL_LABEL[record.channel]}
              </span>
            </div>
            <p className="bloco-body mt-1 text-fg">{formatDateTime(record.grantedAt)}</p>
            <p className="bloco-micro mt-0.5 text-fg-faint">
              Texto aceito: {record.textVersion}
              {record.revokedAt ? ` · revogado em ${formatDate(record.revokedAt)}` : ""}
            </p>
            <p className="bloco-caption mt-1.5 text-fg-secondary">{record.textSnapshot}</p>
          </motion.li>
        ))}
      </ol>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Variacao: tabela                                                     */
/* ------------------------------------------------------------------ */

function ConsentTable({ consents }: { consents: ConsentRecord[] }) {
  const columns: Array<Column<ConsentRecord>> = [
    {
      key: "kind",
      header: "Consentimento",
      width: "180px",
      render: (record) => (
        <Badge tone={KIND_TONE[record.kind]}>{KIND_LABEL[record.kind]}</Badge>
      ),
    },
    {
      key: "patient",
      header: "Paciente",
      render: (record) => <span className="text-fg">{record.patientName}</span>,
    },
    {
      key: "channel",
      header: "Canal",
      width: "150px",
      render: (record) => CHANNEL_LABEL[record.channel],
    },
    {
      key: "grantedAt",
      header: "Data",
      width: "150px",
      render: (record) => formatDateTime(record.grantedAt),
    },
    {
      key: "version",
      header: "Versao do texto",
      width: "130px",
      render: (record) => <span className="bloco-mono text-[12px]">{record.textVersion}</span>,
    },
    {
      key: "status",
      header: "Situacao",
      align: "right",
      width: "120px",
      render: (record) => (
        <Badge tone={isVigente(record) ? "success" : "danger"}>
          {isVigente(record) ? "Vigente" : "Revogado"}
        </Badge>
      ),
    },
  ];

  return (
    <Panel tone="solid" padding="none">
      <DataTable
        columns={columns}
        rows={consents}
        rowKey={(record) => record.id}
        empty={
          <p className="bloco-callout px-4 py-6 text-center text-fg-muted">
            Nenhum consentimento registrado.
          </p>
        }
      />
    </Panel>
  );
}
