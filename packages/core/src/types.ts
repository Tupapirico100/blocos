/**
 * @blocos/core — contratos da biblioteca.
 *
 * Um "bloco" e uma receita: um mesmo conjunto de capacidades (acoes) que pode
 * ser renderizado como tela, chamado por HTTP, exposto como tool de agente ou
 * invocado por outro programa novo. A logica entra por portas (interfaces),
 * nunca por implementacao concreta de vendor.
 */

import type { z } from "zod";

/* ------------------------------------------------------------------ */
/* Acoes: uma capacidade = um tool de agente + uma chamada de UI       */
/* ------------------------------------------------------------------ */

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ActionDefinition<I extends z.ZodTypeAny = z.ZodTypeAny, O extends z.ZodTypeAny = z.ZodTypeAny> {
  /** id estavel, snake_case. Usado por UI, HTTP, MCP, A2A e CLI. */
  id: string;
  /** Titulo curto em pt-BR. */
  title: string;
  /** Descricao em linguagem natural: QUANDO o agente deve usar esta acao. */
  description: string;
  /** Schema de entrada — validacao compartilhada por UI e agente. */
  input?: I;
  /** Schema de saida — tipa o retorno para a UI e para o agente. */
  output?: O;
  /** Metodo HTTP quando exposto como rota. */
  http?: { method: HttpMethod; path: string };
  /** Leitura pura? (define se pode ser executado sem confirmacao) */
  readOnly?: boolean;
  /** Papeis autorizados a executar. Vazio = qualquer membro autenticado. */
  permissions?: string[];
  /** Conectores externos necessarios. Resolvidos pelo dono da plataforma. */
  connectors?: string[];
  /** Sinais de estado da UI esta acao pode produzir. */
  states?: BlockState[];
}

export type BlockState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "forbidden"
  | "not-provisioned";

/* ------------------------------------------------------------------ */
/* Conectores: acesso de implementacao SO do dono do programa          */
/* ------------------------------------------------------------------ */

export type ConnectorKind = "api" | "whatsapp" | "webhook" | "oauth" | "llm" | "storage" | "database";

export interface ConnectorRequirement {
  /** id do conector, referenciado por ActionDefinition.connectors */
  id: string;
  label: string;
  kind: ConnectorKind;
  /** Descricao do que o dono precisa configurar. */
  description: string;
  /** Variaveis de ambiente / referencias de segredo esperadas. */
  env?: string[];
  /** Documentacao de como provisionar. */
  howTo?: string;
  /** Padrao: true. Conectores owner-only nao podem ser provisionados por terceiros. */
  ownerOnly?: boolean;
  /** Risco aceito pelo dono (versao do texto de risco, quando aplicavel). */
  riskVersion?: string;
}

/** Estado de um conector no runtime. */
export interface ConnectorState {
  id: string;
  status: "provisioned" | "missing" | "error";
  /** Ultimo erro conhecido, se houver. Nunca contem segredo. */
  message?: string;
}

/* ------------------------------------------------------------------ */
/* Portas: onde a logica de negocio entra                               */
/* ------------------------------------------------------------------ */

export interface PortDefinition {
  /** id da porta (ex.: "leadsRepository") */
  id: string;
  label: string;
  /** Descricao do contrato esperado. */
  contract: string;
  /** Metodos que a porta deve expor, em notacao `nome(args): retorno`. */
  methods: string[];
  /** Conectores de que a porta depende. */
  connectors?: string[];
  /** Se true, a porta pode ser simulada (fake) para desenvolvimento/testes. */
  mockable?: boolean;
}

/* ------------------------------------------------------------------ */
/* Blocos: a receita completa                                           */
/* ------------------------------------------------------------------ */

export interface BlockVariant {
  /** id da variacao (ex.: "board" | "table"). O usuario escolhe. */
  id: string;
  label: string;
  /** Quando usar esta variacao. */
  intent: string;
  /** Trade-off honesto da variacao. */
  tradeoff?: string;
}

export interface BlockRecipe {
  /** id estavel do bloco (kebab-case). */
  id: string;
  /** Nome de exibicao em pt-BR. */
  name: string;
  /** Dominio: auth | admin | crm | atendimento | agenda | financeiro | social | operacao */
  domain: BlockDomain;
  /** Resumo em uma frase. */
  summary: string;
  /** De quais repositorios este bloco foi extraido. */
  origins: string[];
  /** Portas de logica necessarias. */
  ports: PortDefinition[];
  /** Acoes que o bloco expoe. */
  actions: ActionDefinition[];
  /** Conectores externos (owner-only) necessarios. */
  connectors: ConnectorRequirement[];
  /** Regras de negocio / invariantes que a implementacao DEVE respeitar. */
  rules: string[];
  /** Variacoes de UI disponiveis para este bloco. */
  variants: BlockVariant[];
  /** Estados de UI a cobertura. */
  states: BlockState[];
  /** Acoes sensiveis (saude, dinheiro, credencial) — proibidas em logs/URL. */
  sensitive?: boolean;
}

export type BlockDomain =
  | "identidade"
  | "administracao"
  | "atendimento"
  | "agenda"
  | "clinico"
  | "financeiro"
  | "social"
  | "relatorios"
  | "operacao";

/* ------------------------------------------------------------------ */
/* Utilidades de definicao                                             */
/* ------------------------------------------------------------------ */

export function defineAction<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  def: ActionDefinition<I, O>,
): ActionDefinition<I, O> {
  return def;
}

export function defineBlock(recipe: BlockRecipe): BlockRecipe {
  return recipe;
}

export function defineConnector(req: ConnectorRequirement): ConnectorRequirement {
  return req;
}

export function definePort(port: PortDefinition): PortDefinition {
  return port;
}

/* ------------------------------------------------------------------ */
/* Erros de dominio                                                     */
/* ------------------------------------------------------------------ */

/** Lancado quando um bloco precisa de um conector que o dono nao provisionou. */
export class ConnectorNotProvisionedError extends Error {
  readonly code = "CONNECTOR_NOT_PROVISIONED";
  constructor(
    readonly connectorId: string,
    readonly ownerOnly: boolean,
  ) {
    super(
      ownerOnly
        ? `O conector "${connectorId}" so pode ser provisionado pelo dono da plataforma.`
        : `O conector "${connectorId}" ainda nao foi provisionado.`,
    );
    this.name = "ConnectorNotProvisionedError";
  }
}

/** Lancado quando a acao exige um papel que o ator nao tem. */
export class PermissionDeniedError extends Error {
  readonly code = "PERMISSION_DENIED";
  constructor(readonly required: string[]) {
    super(`Permissao negada. Requer: ${required.join(", ")}.`);
    this.name = "PermissionDeniedError";
  }
}
