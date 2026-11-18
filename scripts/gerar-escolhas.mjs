#!/usr/bin/env node
/**
 * Gera docs/ESCOLHAS-DO-DONO.md a partir das receitas (fonte da verdade).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const mod = await import(resolve(root, "packages/blocks/dist/index.js"));
const recipes = mod.allRecipes;

const TEMA = "aurora";
const DENSIDADE = "comfortable";

const porDominio = new Map();
for (const r of recipes) {
  if (!porDominio.has(r.domain)) porDominio.set(r.domain, []);
  porDominio.get(r.domain).push(r);
}

const linhas = [];
linhas.push("# Escolhas do dono — o que a plataforma usa");
linhas.push("");
linhas.push("> Gerado por `node scripts/gerar-escolhas.mjs` a partir das receitas.");
linhas.push("> Fonte da verdade: o campo `defaultVariant` de cada receita.");
linhas.push("");
linhas.push("## Decisao transversal");
linhas.push("");
linhas.push("| Eixo | Escolha | Onde fica |");
linhas.push("|---|---|---|");
linhas.push(`| Tema | **${TEMA}** (Aurora) | \`ThemeProvider theme="${TEMA}"\` |`);
linhas.push(`| Densidade padrao | **${DENSIDADE}** | \`ThemeProvider density="${DENSIDADE}"\` |`);
linhas.push("| Contraste | WCAG AA (4.5:1 texto, 3:1 texto grande/UI) | `qa-contraste*.py` |");
linhas.push("");
linhas.push("As **outras** variacoes continuam na biblioteca como alternativas para outros");
linhas.push("programas — so o padrao do produto foi fixado.");
linhas.push("");

linhas.push("## Variacao escolhida por bloco");
linhas.push("");
for (const [dominio, lista] of porDominio) {
  linhas.push(`### ${dominio}`);
  linhas.push("");
  linhas.push("| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |");
  linhas.push("|---|---|---|---|");
  for (const r of lista.sort((a, b) => a.name.localeCompare(b.name))) {
    const escolhida = r.variants.find((v) => v.id === r.defaultVariant);
    const alternativas = r.variants.filter((v) => v.id !== r.defaultVariant).map((v) => v.label);
    linhas.push(
      `| \`${r.id}\` | **${escolhida?.label ?? r.defaultVariant}** | ${alternativas.join(" · ") || "—"} | ${escolhida?.intent ?? ""} |`,
    );
  }
  linhas.push("");
}

linhas.push("## Como trocar");
linhas.push("");
linhas.push("1. Edite o `defaultVariant` na receita do bloco.");
linhas.push("2. `npm run build && npm run build:app` — o catalogo ja abre na nova variacao.");
linhas.push("3. `npm run mapa` e `npm run html` para regerar os artefatos.");
linhas.push("4. `bash scripts/placar-final.sh` para revalidar os 100 pontos.");
linhas.push("");
linhas.push("O `defaultVariant` tambem e lido por qualquer programa novo que importe a biblioteca:");
linhas.push("```tsx");
linhas.push('<LeadBoard data={leads} variant={recipe.defaultVariant} />');
linhas.push("```");

mkdirSync(resolve(root, "docs"), { recursive: true });
writeFileSync(resolve(root, "docs/ESCOLHAS-DO-DONO.md"), linhas.join("\n"), "utf8");
console.log(`escolhas geradas: ${recipes.length} blocos`);
