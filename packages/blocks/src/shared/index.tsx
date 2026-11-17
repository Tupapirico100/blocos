import * as React from "react";
import { cn } from "@blocos/ui";
import type { BlockRecipe, BlockState, ConnectorState } from "@blocos/core";
import { ConnectorLock, EmptyState, Skeleton } from "@blocos/ui";

/* ------------------------------------------------------------------ */
/* Tipos comuns                                                        */
/* ------------------------------------------------------------------ */

/** Variacao visual escolhida pelo usuario. Cada bloco expoe seus ids. */
export type VariantId = string;

/**
 * Props minimas de todo bloco de negocio:
 *  - `data`   ja resolvido (a tela nao busca nada; a logica entra por porta)
 *  - `onAction` a UI dispara a acao; quem chama decide como executa
 *  - `variant` a variacao visual escolhida
 */
export interface BlockProps<TData, TVariant extends string = string> {
  data: TData;
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
  variant?: TVariant;
  /** Estado de UI. Padrao "success". */
  state?: BlockState;
  /** Estado dos conectores externos usados pelo bloco. */
  connectors?: ConnectorState[];
  /** Chamado quando o usuario pede acesso a um conector. */
  onRequestConnector?: (connectorId: string) => void;
  className?: string;
  /** Rotulos pt-BR. Permite rebrandar sem tocar no bloco. */
  labels?: Partial<Record<string, string>>;
}

/* ------------------------------------------------------------------ */
/* BlockFrame — guarda de conector + estados                           */
/* ------------------------------------------------------------------ */

export interface BlockFrameProps {
  /** Conectores exigidos por esta variacao do bloco. */
  requires?: string[];
  connectors?: ConnectorState[];
  onRequestConnector?: (connectorId: string) => void;
  state?: BlockState;
  loading?: React.ReactNode;
  empty?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Envolve o conteudo do bloco e resolve os estados na ordem:
 * 1. conector faltando -> tela de bloqueio (owner-only)
 * 2. carregando -> skeleton
 * 3. vazio -> empty state
 * 4. erro -> callout
 */
export function BlockFrame({
  requires = [],
  connectors = [],
  onRequestConnector,
  state = "success",
  loading,
  empty,
  error,
  children,
  className,
}: BlockFrameProps) {
  const missing = requires.filter(
    (id) => connectors.find((c) => c.id === id)?.status !== "provisioned",
  );

  if (missing.length > 0) {
    const labels: Record<string, string> = {
      whatsapp: "WhatsApp (Cloud API)",
      anthropic: "Anthropic (Claude)",
      instagram: "Instagram Graph API",
      meta_ads: "Meta Ads",
      webhooks: "Webhooks de saida",
      storage: "Storage",
    };
    return (
      <ConnectorLock
        connectorLabel={labels[missing[0]!] ?? missing[0]!}
        onRequestAccess={() => onRequestConnector?.(missing[0]!)}
        className={className}
      />
    );
  }

  if (state === "loading") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {loading ?? (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        )}
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className={className}>
        {empty ?? (
          <EmptyState title="Nada por aqui ainda" description="Os itens vao aparecer aqui assim que existirem." />
        )}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={cn("rounded-[var(--r-lg)] border border-danger/30 bg-danger-soft p-4", className)}>
        <p className="bloco-headline text-danger">Algo deu errado</p>
        <div className="bloco-callout mt-1 text-fg-secondary">
          {error ?? "Nao foi possivel carregar este bloco. Tente novamente."}
        </div>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className={cn("rounded-[var(--r-lg)] border border-warn/30 bg-warn-soft p-4", className)}>
        <p className="bloco-headline text-warn">Acesso restrito</p>
        <p className="bloco-callout mt-1 text-fg-secondary">
          Seu perfil nao tem permissao para ver esta informacao.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/* ------------------------------------------------------------------ */
/* Helper de receita                                                   */
/* ------------------------------------------------------------------ */

export type RecipeInput = Omit<BlockRecipe, "variants"> & {
  variants: BlockRecipe["variants"];
};

/** Atalho para criar uma receita preservando a checagem de tipos. */
export function recipe(input: RecipeInput): BlockRecipe {
  return input;
}

/** Titulo de uma coluna em pt-BR a partir de uma chave. */
export function humanize(key: string): string {
  const map: Record<string, string> = {
    id: "ID",
    name: "Nome",
    title: "Titulo",
    email: "E-mail",
    phone: "Telefone",
    status: "Status",
    stage: "Etapa",
    value: "Valor",
    createdAt: "Criado em",
    updatedAt: "Atualizado em",
    source: "Origem",
    tag: "Tag",
    total: "Total",
    count: "Quantidade",
  };
  if (map[key]) return map[key];
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
}
