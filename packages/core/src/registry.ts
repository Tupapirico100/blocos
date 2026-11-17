/**
 * Registro de blocos — o "mapa" consultavel em runtime.
 * A UI do catalogo le daqui; a documentacao e gerada daqui.
 */

import type { BlockDomain, BlockRecipe } from "./types.js";

export class BlockRegistry {
  private readonly blocks = new Map<string, BlockRecipe>();

  register(recipe: BlockRecipe): this {
    this.blocks.set(recipe.id, recipe);
    return this;
  }

  get(id: string): BlockRecipe | undefined {
    return this.blocks.get(id);
  }

  list(): BlockRecipe[] {
    return [...this.blocks.values()];
  }

  byDomain(domain: BlockDomain): BlockRecipe[] {
    return this.list().filter((b) => b.domain === domain);
  }

  /** Blocos que dependem de um conector especifico. */
  requiringConnector(connectorId: string): BlockRecipe[] {
    return this.list().filter((b) => b.connectors.some((c) => c.id === connectorId));
  }

  /** Acoes expostas por todos os blocos (superficie do agente). */
  allActions() {
    return this.list().flatMap((b) =>
      b.actions.map((a) => ({ ...a, blockId: b.id, blockName: b.name })),
    );
  }

  /** Conectores owner-only usados em qualquer lugar do sistema. */
  allConnectors() {
    const map = new Map<string, BlockRecipe["connectors"][number]>();
    for (const block of this.list()) {
      for (const c of block.connectors) map.set(c.id, c);
    }
    return [...map.values()];
  }
}

export const blockRegistry = new BlockRegistry();
