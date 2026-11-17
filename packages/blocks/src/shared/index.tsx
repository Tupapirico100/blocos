import * as React from "react";
import { cn } from "@blocos/ui";
import type { BlockRecipe, BlockState, ConnectorState } from "@blocos/core";
import { Button, ConnectorLock, EmptyState, Skeleton } from "@blocos/ui";

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
  /** Receita do bloco: deriva conectores, papeis e a acao do estado vazio. */
  recipe?: BlockRecipe;
  /** Funcao que dispara acoes do bloco. */
  onAction?: (action: string, payload?: unknown) => void | Promise<void>;
  /** Conectores exigidos por esta variacao do bloco. */
  requires?: string[];
  /** Papeis que podem ver esta parte. Usado para dizer QUAL papel falta. */
  requiredRoles?: string[];
  connectors?: ConnectorState[];
  onRequestConnector?: (connectorId: string) => void;
  state?: BlockState;
  loading?: React.ReactNode;
  empty?: React.ReactNode;
  /** Acao sugerida no estado vazio (ex.: "Novo consultorio"). */
  emptyAction?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ROLE_LABEL: Record<string, string> = {
  owner: "dono do consultório",
  nutritionist: "nutricionista",
  receptionist: "recepcionista",
  employee: "funcionário",
  admin: "administrador da plataforma",
  platform_admin: "administrador da plataforma",
  platform_owner: "administrador da plataforma",
  agent: "agente",
};

/**
 * Envolve o conteudo do bloco e resolve os estados na ordem:
 * 1. conector faltando -> tela de bloqueio (owner-only)
 * 2. carregando -> skeleton que descreve a forma do conteudo
 * 3. vazio -> explica o que vai aparecer e oferece a proxima acao
 * 4. erro -> aviso com role="alert"
 * 5. sem permissao -> diz QUAL papel falta
 */
export function BlockFrame({
  recipe,
  onAction,
  requires: requiresProp,
  requiredRoles: requiredRolesProp,
  connectors = [],
  onRequestConnector,
  state = "success",
  loading,
  empty,
  emptyAction,
  error,
  children,
  className,
}: BlockFrameProps) {
  const requires = requiresProp ?? (recipe ? requiresOf(recipe) : []);
  const requiredRoles = requiredRolesProp ?? (recipe ? rolesOf(recipe) : undefined);
  const acaoDoVazio = recipe ? primaryActionOf(recipe) : undefined;

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
      database: "Banco de dados",
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
      <div className={cn("flex flex-col gap-3", className)} aria-busy="true" aria-live="polite">
        {loading ?? <ContentSkeleton />}
      </div>
    );
  }

  if (state === "empty") {
    const acao =
      emptyAction ??
      (acaoDoVazio && onAction ? (
        <Button
          type="button"
          variant="primary"
          onClick={() => onAction(acaoDoVazio.id)}
        >
          {acaoDoVazio.label}
        </Button>
      ) : undefined);
    const conteudo = empty ?? (
      <EmptyState
        title="Nada por aqui ainda"
        description="Os itens vao aparecer aqui assim que existirem."
        action={acao}
      />
    );
    return (
      <div className={className}>
        {conteudo}
        {empty && acao && !hasButton(empty) ? (
          <div className="mt-4 flex justify-center">{acao}</div>
        ) : null}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        role="alert"
        className={cn("rounded-[var(--r-lg)] border border-danger/30 bg-danger-soft p-4", className)}
      >
        <p className="bloco-headline text-danger">Algo deu errado</p>
        <div className="bloco-callout mt-1 text-fg-secondary">
          {error ?? "Nao foi possivel carregar este bloco. Tente novamente."}
        </div>
      </div>
    );
  }

  if (state === "forbidden") {
    const papeis = requiredRoles?.map((r) => ROLE_LABEL[r] ?? r).join(" ou ");
    return (
      <div className={cn("rounded-[var(--r-lg)] border border-warn/30 bg-warn-soft p-4", className)} role="alert">
        <p className="bloco-headline text-warn">Acesso restrito</p>
        <p className="bloco-callout mt-1 text-fg-secondary">
          {papeis
            ? `Esta area e visivel apenas para ${papeis}. Fale com o dono do consultório para pedir acesso.`
            : "Seu perfil nao tem permissao para ver esta informacao."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Skeleton que descreve a forma: um titulo, uma lista e um cartao. */
export function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-[var(--r-md)]" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-full rounded-[var(--r-md)]" />
        <Skeleton className="h-9 w-[92%] rounded-[var(--r-md)]" />
        <Skeleton className="h-9 w-[78%] rounded-[var(--r-md)]" />
      </div>
      <Skeleton className="h-24 w-full rounded-[var(--r-lg)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Portoes de conector e papeis                                        */
/* ------------------------------------------------------------------ */

/** Conectores que INFRA do programa (nao bloqueiam o bloco). */
const INFRA = new Set(["database", "storage", "email", "pdf"]);

/**
 * Conectores externos que o bloco exige para funcionar de verdade.
 * Sem eles o bloco mostra o bloqueio (owner-only) em vez de fingir.
 */
export function requiresOf(recipe: {
  connectors: Array<{ id: string }>;
}): string[] {
  return recipe.connectors.filter((c) => !INFRA.has(c.id)).map((c) => c.id);
}

/**
 * Acao principal do bloco: a primeira que escreve algo.
 * E o que o estado vazio oferece como proximo passo.
 */
export function primaryActionOf(recipe: BlockRecipe): { id: string; label: string } | undefined {
  return recipe.emptyAction ? { id: recipe.emptyAction.id, label: recipe.emptyAction.label } : undefined;
}

/** O elemento ja contem um botao? (evita duplicar a acao no estado vazio) */
function hasButton(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false;
  const props = node.props as { children?: React.ReactNode };
  if ((node.type as { name?: string })?.name === "Button") return true;
  const kids = React.Children.toArray(props.children);
  return kids.some((k) => hasButton(k));
}

/** Papeis que podem ver o bloco (uniao das permissoes das acoes). */
export function rolesOf(recipe: { actions: Array<{ permissions?: string[] }> }): string[] {
  const roles = new Set<string>();
  for (const a of recipe.actions) for (const p of a.permissions ?? []) roles.add(p);
  return [...roles];
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
