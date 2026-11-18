#!/usr/bin/env python3
"""Rodada 3 (2a passagem) — P3 / criterio 7 (estados).

Estado 'Sem permissao' (forbidden) dos 29 blocos:
  - tem que dizer 'Esta area e visivel apenas para <PAPEL>' (o BlockFrame)
  - clinical-entry specifically: nao pode mostrar so 'sem consentimento'
"""
import asyncio, json, re
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-r3-conf/p3.json"

MARK = """
() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); return true; }
"""

PROBE = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const txt = (scope.innerText||'').replace(/\s+/g,' ').trim();
  const alerts = [...scope.querySelectorAll('[role="alert"],[role="status"]')].map(e => ({
    role: e.getAttribute('role'),
    text: (e.innerText||'').replace(/\s+/g,' ').trim().slice(0,400)
  }));
  return { txt: txt.slice(0,600), alerts, len: txt.length };
}
"""

RE_VISIVEL = re.compile(r"vis[ií]vel apenas para\s+(.+?)(?:\.\s|\s*Fale com|$)", re.I)

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await br.new_context(viewport={"width":1440,"height":900})
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(900)
        out = {}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(220)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Sem permissao")')
            await pg.wait_for_timeout(340)
            await pg.evaluate(MARK)
            out[bid] = await pg.evaluate(PROBE)
            out[bid]['state'] = 'forbidden'
            # volta pra Normal
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(150)
        await br.close()

    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    print("="*110)
    print("P3 — ESTADO 'SEM PERMISSAO': o bloco nomeia o PAPEL que falta?")
    print("="*110)
    falhas = []
    for bid, r in out.items():
        txt = r['txt']
        m = RE_VISIVEL.search(txt)
        papel = m.group(1).strip() if m else None
        ok = papel is not None and len(papel) > 0
        semconsent = "sem consentimento" in txt.lower()
        if not ok: falhas.append((bid, txt))
        flag = "OK " if ok else "FALHA"
        extra = "  [+menciona 'sem consentimento']" if semconsent else ""
        print(f"  {flag} {bid:22} papel={str(papel)[:70]!r}{extra}")
    print()
    print(f"  blocos que nomeiam o papel: {len(out)-len(falhas)}/{len(out)}")
    print(f"  FALHAS: {len(falhas)}")
    for f in falhas: print("   ", f)

    print()
    print("="*110)
    print("  clinical-entry (o caso do P3) — texto integral do estado 'Sem permissao'")
    print("="*110)
    print(" ", out['clinical-entry']['txt'])
    print("  alerts:", json.dumps(out['clinical-entry']['alerts'], ensure_ascii=False, indent=1))

    print()
    print("  — quem ainda fala em consentimento —")
    for bid, r in out.items():
        if "consentimento" in r['txt'].lower():
            print(f"    {bid}: {r['txt'][:260]}")
    print("gravado", OUT)

asyncio.run(main())
