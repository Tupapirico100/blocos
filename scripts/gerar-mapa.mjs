#!/usr/bin/env node
/**
 * Gera docs/MAPA-BLOCOS.md a partir do registro real de receitas.
 * O mapa nunca desatualiza: ele e derivado do codigo.
 *
 *   node scripts/gerar-mapa.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const mod = await import(resolve(root, "packages/blocks/dist/index.js"));
const recipes = mod.allRecipes ?? [];

const DOMAIN = {
  identidade: "Identidade",
  administracao: "Administracao",
  atendimento: "Atendimento",
  clinico: "Clinico",
  agenda: "Agenda",
  financeiro: "Financeiro",
  relatorios: "Relatorios",
  social: "Social",
  operacao: "Operacao",
};

const byDomain = new Map();
for (const r of recipes) {
  const list = byDomain.get(r.domain) ?? [];
  list.push(r);
  byDomain.set(r.domain, list);
}

const owners = new Map();
for (const r of recipes) {
  const repos = new Set(r.origins.map((o) => o.split(":")[0].trim()));
  for (const repo of repos) {
    if (!owners.has(repo)) owners.set(repo, new Map());
    owners.get(repo).set(r.id, r);
  }
}

const lines = [];
lines.push("# Mapa de blocos");
lines.push("");
lines.push("> Gerado por `node scripts/gerar-mapa.mjs` a partir do registro real de receitas.");
lines.push("> Cada bloco e uma receita: acoes (UI + HTTP + agente), portas de logica,");
lines.push("> conectores owner-only, regras e variacoes de UI.");
lines.push("");
lines.push(`**${recipes.length} blocos · ${recipes.reduce((n, r) => n + r.actions.length, 0)} acoes · ${recipes.reduce((n, r) => n + r.variants.length, 0)} variacoes de UI**`);
lines.push("");

lines.push("## 1. Blocos por repositorio de origem");
lines.push("");
lines.push("Onde cada bloco nasceu. Este e o rastreio do que ja existe pronto.");
lines.push("");
for (const [repo, map] of owners) {
  const list = [...map.values()];
  lines.push(`### ${repo} (${list.length} bloco${list.length > 1 ? "s" : ""})`);
  lines.push("");
  lines.push("| Bloco | Dominio | O que faz | Acao principal |");
  lines.push("|---|---|---|---|");
  for (const r of list.sort((a, b) => a.name.localeCompare(b.name))) {
    const main = r.actions[0];
    lines.push(
      `| \`${r.id}\` | ${DOMAIN[r.domain] ?? r.domain} | ${r.summary} | ${main ? `\`${main.id}\`` : "—"} |`,
    );
  }
  lines.push("");
}

lines.push("## 2. Blocos por dominio");
lines.push("");
for (const [domain, list] of byDomain) {
  lines.push(`### ${DOMAIN[domain] ?? domain}`);
  lines.push("");
  for (const r of list.sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`#### \`${r.id}\` — ${r.name}`);
    lines.push("");
    lines.push(r.summary);
    lines.push("");
    lines.push(`**Variacoes de UI:** ${r.variants.map((v) => `\`${v.id}\` (${v.label})`).join(" · ")}`);
    lines.push("");
    if (r.actions.length) {
      lines.push("**Acoes (uma acao = tela + HTTP + tool de agente):**");
      lines.push("");
      for (const a of r.actions) {
        const http = a.http ? ` — \`${a.http.method} ${a.http.path}\`` : "";
        const perms = a.permissions?.length ? ` — papeis: ${a.permissions.join(", ")}` : "";
        const conn = a.connectors?.length ? ` — conectores: ${a.connectors.join(", ")}` : "";
        lines.push(`- \`${a.id}\` — ${a.title}${http}${perms}${conn}`);
        lines.push(`  - ${a.description}`);
      }
      lines.push("");
    }
    if (r.ports.length) {
      lines.push("**Portas de logica:**");
      lines.push("");
      for (const p of r.ports) {
        lines.push(`- \`${p.id}\` — ${p.label}: ${p.contract}`);
        for (const m of p.methods) lines.push(`  - \`${m}\``);
      }
      lines.push("");
    }
    if (r.connectors.length) {
      lines.push(
        `**Conectores:** ${r.connectors.map((c) => `\`${c.id}\`${c.ownerOnly === false ? "" : " (somente dono)"}`).join(" · ")}`,
      );
      lines.push("");
    }
    if (r.rules.length) {
      lines.push("**Regras que a implementacao DEVE respeitar:**");
      lines.push("");
      for (const rule of r.rules) lines.push(`- ${rule}`);
      lines.push("");
    }
    lines.push(`**Origem:** ${r.origins.map((o) => `\`${o}\``).join(" · ")}`);
    lines.push("");
  }
}

lines.push("## 3. Conectores — o que so o dono do programa pode ligar");
lines.push("");
const connectors = new Map();
for (const r of recipes) for (const c of r.connectors) connectors.set(c.id, { ...c, blocks: [...(connectors.get(c.id)?.blocks ?? []), r.id] });
lines.push("| Slot | Tipo | Quem provisiona | Destrava | Variaveis (nome) |");
lines.push("|---|---|---|---|---|");
for (const c of connectors.values()) {
  lines.push(
    `| \`${c.id}\` | ${c.kind} | ${c.ownerOnly === false ? "livre" : "**somente o dono**"} | ${c.description} | ${(c.env ?? []).map((e) => `\`${e}\``).join(", ") || "—"} |`,
  );
}
lines.push("");
lines.push("Detalhe e procedimento em [`RUNBOOK-OWNER.md`](./RUNBOOK-OWNER.md).");
lines.push("");

mkdirSync(resolve(root, "docs"), { recursive: true });
writeFileSync(resolve(root, "docs/MAPA-BLOCOS.md"), lines.join("\n"), "utf8");
console.log(`mapa gerado: ${recipes.length} blocos -> docs/MAPA-BLOCOS.md`);
