#!/usr/bin/env node
/**
 * Gera um HTML autocontido do catalogo (CSS + JS inline).
 * Abre com dois cliques, sem servidor, sem login, funciona offline.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "apps/catalog/dist");

let html = readFileSync(join(dist, "index.html"), "utf8");
const assetsDir = join(dist, "assets");
const assets = readdirSync(assetsDir);

const cssFile = assets.find((f) => f.endsWith(".css"));
const jsFile = assets.find((f) => f.endsWith(".js"));
if (!cssFile || !jsFile) throw new Error("assets nao encontrados em " + dist);

const css = readFileSync(join(assetsDir, cssFile), "utf8");
const js = readFileSync(join(assetsDir, jsFile), "utf8");

// remove as referencias externas
html = html.replace(new RegExp(`\\s*<link[^>]*${cssFile}[^>]*>`), "");
html = html.replace(new RegExp(`\\s*<script[^>]*${jsFile}[^>]*></script>`), "");

// injeta (replacer como funcao: o bundle contem $& e $` que o replace trataria como padrao)
html = html.replace("</head>", () => `<style>\n${css}\n</style>\n</head>`);
html = html.replace("</body>", () => `<script type="module">\n${js}\n</script>\n</body>`);

// titulo e metadados
html = html.replace(
  "<title>",
  "Blocos — Catálogo beta (offline)",
);

const outDir = resolve(root, "docs");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, "catalogo-blocos.html");
writeFileSync(out, html, "utf8");

console.log(`HTML autocontido: ${out} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
