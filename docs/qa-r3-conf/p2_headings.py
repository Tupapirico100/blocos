#!/usr/bin/env python3
"""Rodada 3 (2a passagem) — P2 / criterio 10 (headings).

Para cada um dos 29 blocos e CADA variante:
  - sequencia de h1,h2,h3,h4 DENTRO do bloco
  - sequencia de h1..h4 do DOCUMENTO (page h1 'Blocos' + o bloco)
Regras:
  - sem salto (nivel n+1 nao pode pular para n+2 ou mais)
  - no maximo 1 h1 por bloco (e o documento nao pode ter 2 h1)
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-r3-conf/p2.json"

MARK = """
() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); return true; }
"""

PROBE = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const levels = (root) => [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .filter(el => el.getClientRects().length || el.closest('[data-qa-stage]'))
    .map(el => ({ tag: el.tagName.toLowerCase(), lvl: Number(el.tagName[1]),
                  text: (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,60),
                  cls: String(el.className).slice(0,40) }));
  const block = levels(scope);
  const doc = levels(document);
  return { block, doc };
}
"""

def check(seq, label):
    """devolve (ok, motivo, saltos, h1count)"""
    lv = [h['lvl'] for h in seq]
    skips = []
    prev = 0
    for h in seq:
        if h['lvl'] > prev + 1:
            skips.append((prev, h['lvl'], h['text']))
        prev = h['lvl']
    h1 = lv.count(1)
    return (not skips and h1 <= 1), skips, h1, lv

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
            await pg.wait_for_timeout(250)
            # variantes do bloco = primeiro radiogroup do palco
            labels = await pg.evaluate("""() => {
              const g = document.querySelector('section .sticky [role="radiogroup"]');
              return g ? [...g.querySelectorAll('[role="radio"]')].map(b=>b.innerText.trim()) : [];
            }""")
            variants = {}
            for lab in labels or ["(unica)"]:
                if lab != "(unica)":
                    await pg.click(f'section .sticky [role="radiogroup"] >> nth=0 >> [role="radio"]:has-text("{lab}")')
                    await pg.wait_for_timeout(320)
                await pg.evaluate(MARK)
                variants[lab] = await pg.evaluate(PROBE)
            out[bid] = {"variantes": variants, "labels": labels}
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(150)
        await br.close()

    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    print("="*100)
    print("P2 — HIERARQUIA DE HEADINGS (29 blocos x variantes)")
    print("="*100)
    print(f"{'bloco':22} {'variante':16} {'seq bloco':28} {'seq doc':26} veredito")
    falhas = []
    for bid, r in out.items():
        for lab, d in r["variantes"].items():
            okb, skb, h1b, lvb = check(d["block"], "bloco")
            okd, skd, h1d, lvd = check(d["doc"], "doc")
            vb = "OK" if okb else f"SALTO {skb} h1x{h1b}"
            vd = "OK" if okd else f"SALTO {skd} h1x{h1d}"
            ok = okb and okd
            if not ok: falhas.append((bid, lab, vb, vd, d))
            print(f"{bid:22} {lab[:16]:16} {str(lvb):28} {str(lvd):26} {'OK' if ok else 'FALHA'}  {'' if okb else vb} {'' if okd else vd}")

    print()
    print(f"  combinacoes bloco x variante: {sum(len(r['variantes']) for r in out.values())}")
    print(f"  FALHAS: {len(falhas)}")
    for f in falhas[:20]:
        print("   ", f[0], f[1], f[2], f[3])

    # h1 por bloco (documento inteiro, contagem de h1 no stage)
    print()
    print("  h1 por bloco (dentro do stage):")
    for bid, r in out.items():
        for lab, d in r["variantes"].items():
            n = sum(1 for h in d["block"] if h['lvl']==1)
            nd = sum(1 for h in d["doc"] if h['lvl']==1)
            if n or nd > 1:
                print(f"    {bid}/{lab}: h1 no bloco={n} | h1 no documento={nd} | seq doc={ [h['lvl'] for h in d['doc']] }")
    print("gravado", OUT)

asyncio.run(main())
