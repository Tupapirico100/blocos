import * as React from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Panel,
  SectionHeader,
  type BadgeTone,
  type Column,
} from "@blocos/ui";
import { formatBRL } from "@blocos/core";
import { BadgeCheck, CalendarClock, PackageOpen } from "lucide-react";
import { BlockFrame, requiresOf, rolesOf, type BlockProps } from "../shared/index.js";
import { packagesPricingRecipe } from "./packages-pricing.recipe.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type PackagesPricingVariant = "cards" | "table" | "split";

export interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  /** Preco em CENTAVOS (inteiro). Nunca ponto flutuante. */
  priceCents: number;
  /** Numero de sessoes que o pacote inclui. */
  sessions: number;
  /** Validade em dias a partir da compra. */
  validDays?: number;
  /** Validade em data ISO (YYYY-MM-DD). */
  expiresAt?: string;
  active: boolean;
  /** Sessoes por semana (opcional). */
  sessionsPerWeek?: number;
}

export interface PackagesPricingData {
  packages: ServicePackage[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function validityLabel(pkg: ServicePackage): string {
  if (pkg.expiresAt) {
    const [, m = "", d = "", y = ""] = pkg.expiresAt.split("-");
    return `Ate ${d}/${m}/${y}`;
  }
  if (pkg.validDays) return `Validade de ${pkg.validDays} dias`;
  return "Sem validade definida";
}

function statusTone(active: boolean): BadgeTone {
  return active ? "success" : "neutral";
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function PackagesPricing(props: BlockProps<PackagesPricingData, PackagesPricingVariant>) {
  const {
    data,
    onAction,
    variant = "cards",
    state = "success",
    connectors,
    onRequestConnector,
    className,
  } = props;

  const packages = data.packages ?? [];
  const [selectedId, setSelectedId] = React.useState<string | null>(packages[0]?.id ?? null);
  /** Confirmacao pendente de uma acao destrutiva. */
  const [confirmando, setConfirmando] = React.useState<{ acao: string; payload?: unknown } | null>(
    null,
  );

  const effectiveState = state === "success" && packages.length === 0 ? "empty" : state;
  const selected = packages.find((p) => p.id === selectedId) ?? packages[0] ?? null;

  const confirmPayload = (confirmando?.payload ?? {}) as { id?: string };
  const pacoteEmConfirmacao =
    confirmando?.acao === "package.toggleActive"
      ? (packages.find((pkg) => pkg.id === confirmPayload.id) ?? null)
      : null;

  function toggleActive(pkg: ServicePackage) {
    onAction?.("package.toggleActive", { id: pkg.id, active: !pkg.active });
  }

  /** Desativar e destrutivo: passa pelo dialogo de confirmacao. */
  function requestDeactivate(pkg: ServicePackage) {
    setConfirmando({ acao: "package.toggleActive", payload: { id: pkg.id, active: false } });
  }

  function save(pkg: ServicePackage) {
    onAction?.("package.save", {
      id: pkg.id,
      name: pkg.name,
      priceCents: pkg.priceCents,
      sessions: pkg.sessions,
      validDays: pkg.validDays,
      active: pkg.active,
    });
  }

  return (
    <BlockFrame
      state={effectiveState}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      className={className}
        recipe={packagesPricingRecipe}
        onAction={onAction}
      >
      <div className="@container flex flex-col gap-4">
        <SectionHeader
          eyebrow="Financeiro"
          title="Pacotes e precos"
          description="Precos sempre em centavos e exibidos em BRL. Sessao incluida e validade por pacote."
        />

        {variant === "cards" ? (
          /* Grade por CONTAINER: quantas colunas cabem depende do espaco real do
             bloco, nao da viewport. Com 3 colunas apertadas o preco e o titulo
             do pacote atravessavam a borda do cartao. */
          <div className="grid grid-cols-1 gap-3 @[560px]:grid-cols-2 @[860px]:grid-cols-3">
            {packages.map((pkg) => (
              <Panel key={pkg.id} tone="glass" className="flex min-w-[248px] flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="bloco-title3 truncate" title={pkg.name}>{pkg.name}</p>
                    {pkg.description ? (
                      <p className="bloco-caption mt-0.5 break-words text-fg-muted">{pkg.description}</p>
                    ) : null}
                  </div>
                  <Badge tone={statusTone(pkg.active)}>
                    {pkg.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <p className="bloco-title1 break-words tabular-nums">{formatBRL(pkg.priceCents)}</p>

                <dl className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <dt className="bloco-micro break-words">Sessoes</dt>
                    <dd className="bloco-body tabular-nums text-fg">{pkg.sessions}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="bloco-micro break-words">Validade</dt>
                    <dd className="bloco-body break-words text-fg">{validityLabel(pkg)}</dd>
                  </div>
                </dl>

                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Salvar pacote ${pkg.name}`}
                    onClick={() => save(pkg)}
                  >
                    Salvar
                  </Button>
                  {pkg.active ? (
                    <Button
                      size="sm"
                      variant="danger-ghost"
                      aria-label={`Desativar pacote ${pkg.name}`}
                      onClick={() => requestDeactivate(pkg)}
                    >
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Ativar pacote ${pkg.name}`}
                      onClick={() => toggleActive(pkg)}
                    >
                      Ativar
                    </Button>
                  )}
                </div>
              </Panel>
            ))}
          </div>
        ) : null}

        {variant === "table" ? (
          <Panel tone="outline" padding="none">
            <DataTable
              columns={packageColumns(packages, onAction, requestDeactivate)}
              rows={packages}
              rowKey={(row) => row.id}
            />
          </Panel>
        ) : null}

        {variant === "split" && selected ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Panel tone="outline" className="flex flex-col gap-2">
              <p className="bloco-headline">Pacotes</p>
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedId(pkg.id)}
                  aria-pressed={pkg.id === selected.id}
                  className={
                    "flex items-center justify-between gap-3 rounded-[var(--r-md)] border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                    (pkg.id === selected.id
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-surface-strong/40 hover:bg-surface-hover")
                  }
                >
                  <span className="min-w-0">
                    <span className="bloco-caption block truncate font-medium text-fg" title={pkg.name}>{pkg.name}</span>
                    <span className="bloco-micro block tabular-nums">{formatBRL(pkg.priceCents)}</span>
                  </span>
                  <Badge tone={statusTone(pkg.active)}>{pkg.active ? "Ativo" : "Inativo"}</Badge>
                </button>
              ))}
            </Panel>

            <Panel tone="glass" className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="bloco-title3 truncate" title={selected.name}>{selected.name}</p>
                  {selected.description ? (
                    <p className="bloco-caption mt-0.5 break-words text-fg-muted">{selected.description}</p>
                  ) : null}
                </div>
                <Badge tone={statusTone(selected.active)}>
                  {selected.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <p className="bloco-display tabular-nums">{formatBRL(selected.priceCents)}</p>

              <dl className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="bloco-micro">Sessoes</dt>
                  <dd className="bloco-body tabular-nums text-fg">{selected.sessions}</dd>
                </div>
                <div>
                  <dt className="bloco-micro">Sessoes por semana</dt>
                  <dd className="bloco-body tabular-nums text-fg">
                    {selected.sessionsPerWeek ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="bloco-micro">Validade</dt>
                  <dd className="bloco-body text-fg">{validityLabel(selected)}</dd>
                </div>
              </dl>

              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Salvar pacote ${selected.name}`}
                  onClick={() => save(selected)}
                >
                  Salvar
                </Button>
                {selected.active ? (
                  <Button
                    size="sm"
                    variant="danger-ghost"
                    aria-label={`Desativar pacote ${selected.name}`}
                    onClick={() => requestDeactivate(selected)}
                  >
                    Desativar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Ativar pacote ${selected.name}`}
                    onClick={() => toggleActive(selected)}
                  >
                    Ativar
                  </Button>
                )}
              </div>
            </Panel>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmando !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmando(null);
        }}
        title={
          pacoteEmConfirmacao
            ? `Desativar o pacote ${pacoteEmConfirmacao.name}`
            : "Confirmar acao destrutiva"
        }
        description={
          pacoteEmConfirmacao
            ? `O pacote ${pacoteEmConfirmacao.name} deixa de aparecer para novos pacientes e nao pode mais ser vendido. Para reverter, ative o pacote novamente na lista.`
            : "Esta acao nao pode ser desfeita pela interface."
        }
        confirmLabel={pacoteEmConfirmacao ? `Desativar ${pacoteEmConfirmacao.name}` : "Confirmar"}
        onConfirm={() => {
          if (!confirmando) return;
          void onAction?.(confirmando.acao, confirmando.payload);
        }}
      />
    </BlockFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Colunas da tabela                                                    */
/* ------------------------------------------------------------------ */

function packageColumns(
  packages: ServicePackage[],
  onAction?: (action: string, payload?: unknown) => void | Promise<void>,
  onRequestDeactivate?: (pkg: ServicePackage) => void,
): Array<Column<ServicePackage>> {
  return [
    {
      key: "name",
      header: "Pacote",
      render: (row) => (
        <span className="flex items-center gap-1.5 font-medium text-fg">
          <PackageOpen size={13} className="text-fg-faint" aria-hidden />
          {row.name}
        </span>
      ),
    },
    {
      key: "price",
      header: "Preco",
      align: "right",
      render: (row) => <span className="tabular-nums text-fg">{formatBRL(row.priceCents)}</span>,
    },
    {
      key: "sessions",
      header: "Sessoes",
      align: "right",
      render: (row) => <span className="tabular-nums">{row.sessions}</span>,
    },
    {
      key: "validity",
      header: "Validade",
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <CalendarClock size={13} className="text-fg-faint" aria-hidden />
          {validityLabel(row)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Situacao",
      render: (row) => (
        <Badge tone={statusTone(row.active)}>{row.active ? "Ativo" : "Inativo"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Acoes",
      align: "right",
      render: (row) =>
        row.active ? (
          <Button
            size="sm"
            variant="danger-ghost"
            icon={<BadgeCheck size={13} aria-hidden />}
            aria-label={`Desativar pacote ${row.name}`}
            onClick={() => onRequestDeactivate?.(row)}
          >
            Desativar
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            icon={<BadgeCheck size={13} aria-hidden />}
            aria-label={`Ativar pacote ${row.name}`}
            onClick={() => onAction?.("package.toggleActive", { id: row.id, active: true })}
          >
            Ativar
          </Button>
        ),
    },
  ];
}
