/**
 * @blocos/blocks — os blocos de negocio.
 *
 * Cada bloco vem em par:
 *   `<id>.tsx`       -> a tela (presentacional: recebe `data`, devolve `onAction`)
 *   `<id>.recipe.ts` -> a receita (acoes, portas, conectores, regras, variacoes)
 */

export * from "./shared/index.js";
export * from "./catalog.js";

export * from "./identidade/index.js";
export * from "./administracao/index.js";
export * from "./atendimento/index.js";
export * from "./clinico/index.js";
export * from "./agenda/index.js";
export * from "./financeiro/index.js";
export * from "./relatorios/index.js";
export * from "./social/index.js";
export * from "./operacao/index.js";
