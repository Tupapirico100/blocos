import * as React from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Panel,
  SectionHeader,
  useBlocosLocale,
  type BadgeTone,
  type BlocosFormat,
  type Column,
} from "@blocos/ui";
import { formatCurrency } from "@blocos/core";
import { BadgeCheck, CalendarClock, PackageOpen } from "lucide-react";
import { BlockFrame, type BlockProps } from "../shared/index.js";
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
  /** Moeda ISO-4217 deste pacote. Sem ela, a moeda do `LocaleProvider` (padrao BRL). */
  currency?: string;
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
  /** Mostra "Salvar" (acao `package.save`). Padrao: sim. Desligue onde o pacote nao se edita. */
  canSave?: boolean;
  /** Mostra ativar/desativar. Padrao: sim. Desligue para quem so pode ver (ex.: recepcao). */
  canToggle?: boolean;
  /** Mostra a validade. Padrao: sim. Desligue onde o pacote nao tem validade. */
  showValidity?: boolean;
  /** Mostra o cabecalho do bloco. Padrao: sim. */
  showHeader?: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function validityLabel(L: BlocosFormat, pkg: ServicePackage): string {
  if (pkg.expiresAt) {
    const [y = "", m = "", d = ""] = pkg.expiresAt.split("-");
    return L.t("packages.validUntil", "Ate {date}", { date: `${d}/${m}/${y}` });
  }
  if (pkg.validDays) return L.t("packages.validDays", "Validade de {days} dias", { days: pkg.validDays });
  return L.t("packages.noValidity", "Sem validade definida");
}

function price(L: BlocosFormat, pkg: ServicePackage): string {
  return formatCurrency(pkg.priceCents, { currency: pkg.currency ?? L.config.currency, locale: L.config.locale });
}

function statusTone(active: boolean): BadgeTone {
  return active ? "success" : "neutral";
}

function statusLabel(L: BlocosFormat, active: boolean): string {
  return active ? L.t("packages.active", "Ativo") : L.t("packages.inactive", "Inativo");
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
  const L = useBlocosLocale();
  const { t } = L;

  const packages = data.packages ?? [];
  const canSave = data.canSave !== false;
  const canToggle = data.canToggle !== false;
  const showValidity = data.showValidity !== false;
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

  /** Os botoes de um pacote (cartao e detalhe). */
  const actions = (pkg: ServicePackage) =>
    canSave || canToggle ? (
      <div className="flex items-center gap-2 border-t border-border pt-3">
        {canSave ? (
          <Button
            size="sm"
            variant="secondary"
            aria-label={t("packages.saveNamed", "Salvar pacote {name}", { name: pkg.name })}
            onClick={() => save(pkg)}
          >
            {t("packages.save", "Salvar")}
          </Button>
        ) : null}
        {canToggle ? (
          pkg.active ? (
            <Button
              size="sm"
              variant="danger-ghost"
              aria-label={t("packages.deactivateNamed", "Desativar pacote {name}", { name: pkg.name })}
              onClick={() => requestDeactivate(pkg)}
            >
              {t("packages.deactivate", "Desativar")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              aria-label={t("packages.activateNamed", "Ativar pacote {name}", { name: pkg.name })}
              onClick={() => toggleActive(pkg)}
            >
              {t("packages.activate", "Ativar")}
            </Button>
          )
        ) : null}
      </div>
    ) : null;

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
        {data.showHeader === false ? null : (
          <SectionHeader
            eyebrow={t("packages.eyebrow", "Financeiro")}
            title={t("packages.title", "Pacotes e precos")}
            description={t(
              "packages.description",
              "Precos sempre em centavos e exibidos em BRL. Sessao incluida e validade por pacote.",
            )}
          />
        )}

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
                  <Badge tone={statusTone(pkg.active)}>{statusLabel(L, pkg.active)}</Badge>
                </div>

                <p className="bloco-title1 break-words tabular-nums">{price(L, pkg)}</p>

                <dl className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <dt className="bloco-micro break-words">{t("packages.sessions", "Sessoes")}</dt>
                    <dd className="bloco-body tabular-nums text-fg">{pkg.sessions}</dd>
                  </div>
                  {showValidity ? (
                    <div className="min-w-0">
                      <dt className="bloco-micro break-words">{t("packages.validity", "Validade")}</dt>
                      <dd className="bloco-body break-words text-fg">{validityLabel(L, pkg)}</dd>
                    </div>
                  ) : null}
                </dl>

                {actions(pkg)}
              </Panel>
            ))}
          </div>
        ) : null}

        {variant === "table" ? (
          <Panel tone="outline" padding="none">
            <DataTable
              columns={packageColumns(L, { canToggle, showValidity }, onAction, requestDeactivate)}
              rows={packages}
              rowKey={(row) => row.id}
            />
          </Panel>
        ) : null}

        {variant === "split" && selected ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Panel tone="outline" className="flex flex-col gap-2">
              <p className="bloco-headline">{t("packages.list", "Pacotes")}</p>
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
                    <span className="bloco-micro block tabular-nums">{price(L, pkg)}</span>
                  </span>
                  <Badge tone={statusTone(pkg.active)}>{statusLabel(L, pkg.active)}</Badge>
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
                <Badge tone={statusTone(selected.active)}>{statusLabel(L, selected.active)}</Badge>
              </div>

              <p className="bloco-display tabular-nums">{price(L, selected)}</p>

              <dl className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="bloco-micro">{t("packages.sessions", "Sessoes")}</dt>
                  <dd className="bloco-body tabular-nums text-fg">{selected.sessions}</dd>
                </div>
                <div>
                  <dt className="bloco-micro">{t("packages.perWeek", "Sessoes por semana")}</dt>
                  <dd className="bloco-body tabular-nums text-fg">{selected.sessionsPerWeek ?? "—"}</dd>
                </div>
                {showValidity ? (
                  <div>
                    <dt className="bloco-micro">{t("packages.validity", "Validade")}</dt>
                    <dd className="bloco-body text-fg">{validityLabel(L, selected)}</dd>
                  </div>
                ) : null}
              </dl>

              {actions(selected)}
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
            ? t("packages.confirmTitle", "Desativar o pacote {name}", { name: pacoteEmConfirmacao.name })
            : t("packages.confirmGenericTitle", "Confirmar acao destrutiva")
        }
        description={
          pacoteEmConfirmacao
            ? t(
                "packages.confirmBody",
                "O pacote {name} deixa de aparecer para novos pacientes e nao pode mais ser vendido. Para reverter, ative o pacote novamente na lista.",
                { name: pacoteEmConfirmacao.name },
              )
            : t("packages.confirmGenericBody", "Esta acao nao pode ser desfeita pela interface.")
        }
        confirmLabel={
          pacoteEmConfirmacao
            ? t("packages.confirmLabel", "Desativar {name}", { name: pacoteEmConfirmacao.name })
            : undefined
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
/* Colunas da tabela                                                    */
/* ------------------------------------------------------------------ */

function packageColumns(
  L: BlocosFormat,
  opts: { canToggle: boolean; showValidity: boolean },
  onAction?: (action: string, payload?: unknown) => void | Promise<void>,
  onRequestDeactivate?: (pkg: ServicePackage) => void,
): Array<Column<ServicePackage>> {
  const { t } = L;
  const columns: Array<Column<ServicePackage>> = [
    {
      key: "name",
      header: t("packages.col.name", "Pacote"),
      render: (row) => (
        <span className="flex items-center gap-1.5 font-medium text-fg">
          <PackageOpen size={13} className="text-fg-faint" aria-hidden />
          {row.name}
        </span>
      ),
    },
    {
      key: "price",
      header: t("packages.col.price", "Preco"),
      align: "right",
      render: (row) => <span className="tabular-nums text-fg">{price(L, row)}</span>,
    },
    {
      key: "sessions",
      header: t("packages.sessions", "Sessoes"),
      align: "right",
      render: (row) => <span className="tabular-nums">{row.sessions}</span>,
    },
  ];
  if (opts.showValidity) {
    columns.push({
      key: "validity",
      header: t("packages.validity", "Validade"),
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <CalendarClock size={13} className="text-fg-faint" aria-hidden />
          {validityLabel(L, row)}
        </span>
      ),
    });
  }
  columns.push({
    key: "status",
    header: t("packages.col.status", "Situacao"),
    render: (row) => <Badge tone={statusTone(row.active)}>{statusLabel(L, row.active)}</Badge>,
  });
  if (opts.canToggle) {
    columns.push({
      key: "actions",
      header: t("packages.col.actions", "Acoes"),
      align: "right",
      render: (row) =>
        row.active ? (
          <Button
            size="sm"
            variant="danger-ghost"
            icon={<BadgeCheck size={13} aria-hidden />}
            aria-label={t("packages.deactivateNamed", "Desativar pacote {name}", { name: row.name })}
            onClick={() => onRequestDeactivate?.(row)}
          >
            {t("packages.deactivate", "Desativar")}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            icon={<BadgeCheck size={13} aria-hidden />}
            aria-label={t("packages.activateNamed", "Ativar pacote {name}", { name: row.name })}
            onClick={() => onAction?.("package.toggleActive", { id: row.id, active: true })}
          >
            {t("packages.activate", "Ativar")}
          </Button>
        ),
    });
  }
  return columns;
}
