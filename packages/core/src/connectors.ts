/**
 * Registro de conectores — o unico lugar onde segredos entram.
 *
 * Regra do dono: chaves de API, credenciais de WhatsApp/Meta, webhooks e
 * tokens de LLM sao provisionados exclusivamente pelo dono do programa.
 * O resto do sistema so enxerga o slot; nunca o segredo.
 */

import { ConnectorNotProvisionedError, type ConnectorRequirement, type ConnectorState } from "./types.js";

export interface ConnectorResolver {
  /** Retorna o estado do conector, sem revelar segredo. */
  (id: string): ConnectorState;
}

export interface ProvisionedConnector {
  id: string;
  status: "provisioned" | "missing" | "error";
  message?: string;
  /**
   * Resolve o segredo/handle real. Deve devolver `undefined` quando nao
   * provisionado. SOMENTE o owner da plataforma pode registrar um
   * provisioned com `ownerOnly: true`.
   */
  resolve?: () => unknown;
  /** Quem provisionou (email do dono, por exemplo). */
  provisionedBy?: string;
  /** Quando foi provisionado (ISO). */
  provisionedAt?: string;
}

export class ConnectorRegistry {
  private readonly requirements = new Map<string, ConnectorRequirement>();
  private readonly provisioned = new Map<string, ProvisionedConnector>();

  constructor(requirements: ConnectorRequirement[] = []) {
    for (const req of requirements) this.require(req);
  }

  /** Declara um requisito de conector (metadado, sem segredo). */
  require(req: ConnectorRequirement): this {
    this.requirements.set(req.id, req);
    return this;
  }

  /** Registra um conector efetivamente provisionado. */
  provision(connector: ProvisionedConnector): this {
    const req = this.requirements.get(connector.id);
    if (req?.ownerOnly && connector.provisionedBy === undefined) {
      throw new ConnectorNotProvisionedError(connector.id, true);
    }
    this.provisioned.set(connector.id, connector);
    return this;
  }

  /** Estado publico (sem segredo) — seguro para UI e para logs. */
  state(id: string): ConnectorState {
    const p = this.provisioned.get(id);
    if (p) return { id, status: p.status, message: p.message };
    return { id, status: "missing" };
  }

  states(ids: string[]): ConnectorState[] {
    return ids.map((id) => this.state(id));
  }

  /** Resolucao de handle/segredo. Lanca se nao provisionado. */
  resolve<T = unknown>(id: string): T {
    const req = this.requirements.get(id);
    const p = this.provisioned.get(id);
    if (!p || p.status !== "provisioned" || !p.resolve) {
      throw new ConnectorNotProvisionedError(id, req?.ownerOnly ?? false);
    }
    return p.resolve() as T;
  }

  /** Versao segura: devolve undefined em vez de lancar. */
  tryResolve<T = unknown>(id: string): T | undefined {
    try {
      return this.resolve<T>(id);
    } catch {
      return undefined;
    }
  }

  /** Ids de conectores que faltam provisionar. */
  missing(ids: string[]): string[] {
    return ids.filter((id) => this.state(id).status !== "provisioned");
  }

  /** Snapshot serializavel — usado pela tela "Conexoes" e por auditoria. */
  snapshot(): Array<ConnectorState & { label: string; ownerOnly: boolean; kind: string }> {
    return [...this.requirements.values()].map((req) => ({
      ...this.state(req.id),
      label: req.label,
      ownerOnly: req.ownerOnly ?? true,
      kind: req.kind,
    }));
  }
}

/** Registro global padrao (singleton simples). */
export const connectors = new ConnectorRegistry();
