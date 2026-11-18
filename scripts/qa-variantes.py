#!/usr/bin/env python3
"""
QA de variantes (criterio 8): para cada bloco, alterna entre as variacoes e
verifica que cada uma renderiza conteudo distinto, sem erro e sem overflow.

Saida: docs/qa-variantes.json
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path("/workspace/blocos")
CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
CATALOGO = ROOT / "packages/blocks/dist/catalog.js"

# variantes por bloco (do catalogo compilado)
import subprocess

out = subprocess.run(
    ["node", "-e",
     "import('./packages/blocks/dist/catalog.js').then(m=>console.log(JSON.stringify(m.BLOCO_CATALOG.map(e=>[e.id,e.recipe.variants.map(v=>v.id)]))))"],
    cwd=str(ROOT), capture_output=True, text=True).stdout
BLOCOS = json.loads(out)

achados = []
resumo = {}


def snapshot(page):
    return page.evaluate("""()=>{
      const palco = document.querySelector('section .bloco-scroll.flex-1');
      const bruto = (palco ? palco.innerText : '') || '';
      const txt = bruto.split(String.fromCharCode(10)).join(' ').split(String.fromCharCode(9)).join(' ')
                  .split(String.fromCharCode(13)).join(' ').replace(/  +/g, ' ').trim();
      // assinatura estrutural: distingue variacoes que so mudam o LAYOUT
      const els = palco ? [...palco.querySelectorAll('*')].slice(0, 600) : [];
      const sig = els.map(e => e.tagName + '.' + String(e.className || '').split(' ').slice(0, 2).join('.')).join('>');
      let h = 0;
      for (let i = 0; i < sig.length; i++) { h = (h * 31 + sig.charCodeAt(i)) | 0; }
      return {
        txt: txt.length,
        hash: txt,
        sig: (h >>> 0).toString(16),
        overflow: document.documentElement.scrollWidth - window.innerWidth
      };
    }""")


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    erros = []
    page.on("pageerror", lambda e: erros.append(str(e)[:140]))
    page.on("console", lambda m: erros.append(m.text[:140]) if m.type == "error" else None)
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1000)

    for bid, variantes in BLOCOS:
        page.click(f'button:has-text("{bid}")')
        page.wait_for_timeout(280)
        hashes = []
        sigs = []
        for v in variantes:
            # a barra de variantes usa o rotulo da receita; localiza pelo id do bloco
            botoes = page.query_selector_all("section button[role='radio']")  # variantes primeiro, estados depois
            # clica SEMPRE: o estado inicial e a variante escolhida pelo dono,
            # nao a primeira da lista
            idx = variantes.index(v)
            if idx < len(botoes):
                botoes[idx].click()
                page.wait_for_timeout(320)
                sel = botoes[idx].get_attribute("aria-checked") or botoes[idx].get_attribute("aria-selected")
                if sel != "true":
                    achados.append({"bloco": bid, "variante": v, "tipo": "variante_nao_ativa",
                                    "detalhe": f"aria-checked={sel}"})
            s = snapshot(page)
            hashes.append(s["hash"])
            sigs.append(s["sig"])
            print(f"    {bid} / {v}: {s['txt']} chars | hash={hash(s['hash']) & 0xffffff:06x}")
            if s["txt"] < 40:
                achados.append({"bloco": bid, "variante": v, "tipo": "vazia", "detalhe": f"{s['txt']} chars"})
            if s["overflow"] > 2:
                achados.append({"bloco": bid, "variante": v, "tipo": "overflow", "detalhe": f"{s['overflow']}px"})
        if len(set(sigs)) != len(sigs):
            # identicas em texto E estrutura = variante NAO implementada
            if len(set(hashes)) == 1:
                achados.append({"bloco": bid, "variante": "*", "tipo": "variante_nao_implementada",
                                 "detalhe": f"{len(variantes)} variante(s) renderizam exatamente igual"})
            else:
                achados.append({"bloco": bid, "variante": "*", "tipo": "variante_equivalente",
                                 "detalhe": "mesma estrutura, texto levemente diferente"})
        resumo[bid] = {"variantes": variantes, "distintos": len(set(hashes))}

    browser.close()

reais = [e for e in erros if "404" not in e and "favicon" not in e.lower()]
if reais:
    achados.append({"bloco": "*", "variante": "*", "tipo": "erro_console", "detalhe": str(reais[:3])})

(ROOT / "docs/qa-variantes.json").write_text(
    json.dumps({"achados": achados, "resumo": resumo}, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"blocos verificados: {len(resumo)}")
print(f"achados: {len(achados)}")
for a in achados:
    print(f"  [{a['tipo']}] {a['bloco']} / {a['variante']}: {a['detalhe']}")
iguais = [b for b, r in resumo.items() if r["distintos"] < len(r["variantes"])]
if iguais:
    print("variantes com conteudo repetido:", iguais)
