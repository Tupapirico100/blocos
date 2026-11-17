/**
 * Runtime de acoes — "uma acao, todas as superficies".
 *
 * A mesma acao que a UI chama por clique e a que o agente chama como tool
 * atravessa exatamente a mesma validacao, permissao e port. Se a UI mente,
 * o agente mente igual. Por isso o schema fica aqui, e nao dentro do
 * componente.
 */

import type { z } from "zod";
import { PermissionDeniedError, type ActionDefinition, type BlockState } from "./types.js";
import type { ConnectorRegistry } from "./connectors.js";

export interface Actor {
  id: string;
  /** Papeis no consultorio: owner | nutritionist | receptionist | agent | admin */
  roles: string[];
  /** Origem do acesso: member | platform */
  accessSource?: "member" | "platform";
  officeId?: string;
  /** O ator e o dono da plataforma (pode provisionar conectores). */
  isPlatformOwner?: boolean;
}

export interface ActionContext {
  actor: Actor;
  connectors: ConnectorRegistry;
  /** Portas resolvidas por id (repositorios, servicos, provedores). */
  ports: Record<string, unknown>;
  signal?: AbortSignal;
  /** Contexto extra (locale, origem da chamada, id de correlacao). */
  meta?: Record<string, unknown>;
}

export type ActionHandler<I extends z.ZodTypeAny = z.ZodTypeAny, O extends z.ZodTypeAny = z.ZodTypeAny> = (
  input: z.infer<I>,
  ctx: ActionContext,
) => Promise<z.infer<O>> | z.infer<O>;

export interface ActionResult<O> {
  data: O;
  /** Estado de UI resultante — a UI usa isso para escolher o que renderizar. */
  state: BlockState;
}

export interface RegisteredAction {
  definition: ActionDefinition;
  handler: ActionHandler<never, never>;
}

export class ActionRuntime {
  private readonly actions = new Map<string, RegisteredAction>();

  register(definition: ActionDefinition, handler: ActionHandler<never, never>): this {
    this.actions.set(definition.id, { definition, handler });
    return this;
  }

  get(id: string): RegisteredAction | undefined {
    return this.actions.get(id);
  }

  list(): ActionDefinition[] {
    return [...this.actions.values()].map((a) => a.definition);
  }

  /**
   * Executa uma acao aplicando, nesta ordem:
   * 1. schema de entrada  2. permissao por papel  3. conector provisionado
   * 4. execucao  5. normalizacao do estado de UI
   */
  async execute<O = unknown>(
    id: string,
    rawInput: unknown,
    ctx: ActionContext,
  ): Promise<ActionResult<O>> {
    const registered = this.actions.get(id);
    if (!registered) {
      throw new Error(`Acao desconhecida: ${id}`);
    }
    const def = registered.definition;

    const input = def.input ? def.input.parse(rawInput ?? {}) : ((rawInput ?? {}) as never);

    if (def.permissions && def.permissions.length > 0) {
      const ok = def.permissions.some((p) => ctx.actor.roles.includes(p) || ctx.actor.isPlatformOwner);
      if (!ok) throw new PermissionDeniedError(def.permissions);
    }

    const missing = ctx.connectors.missing(def.connectors ?? []);
    if (missing.length > 0) {
      // A UI renderiza "nao provisionado"; a API responde 409/501.
      throw Object.assign(new Error(`Conectores nao provisionados: ${missing.join(", ")}`), {
        code: "CONNECTOR_NOT_PROVISIONED",
        connectors: missing,
      });
    }

    try {
      const data = (await registered.handler(input as never, ctx)) as O;
      const state: BlockState = isEmptyResult(data) ? "empty" : "success";
      return { data, state };
    } catch (err) {
      if (err instanceof PermissionDeniedError) return { data: undefined as O, state: "forbidden" };
      throw err;
    }
  }
}

function isEmptyResult(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items.length === 0;
  }
  return false;
}

/** Registro global padrao. */
export const runtime = new ActionRuntime();
