#!/usr/bin/env python3
"""Medicao definitiva das 2 colisoes reais, nas 5 larguras rubricadas."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
import numpy as np
from PIL import Image
from io import BytesIO

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
OUT = Path("/workspace/blocos/docs/qa-r3-conf/shots")
LARGURAS = [390, 768, 1280, 1440, 1920]

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        res = {}
        for w in LARGURAS:
            c = await br.new_context(viewport={"width": w, "height": 900})
            q = await c.new_page()
            await q.goto(URL, wait_until="networkidle")
            await q.wait_for_timeout(800)
            narrow = w < 768
            res[w] = {}

            # ---------- social-composer: nome do arquivo x rotulo do tamanho
            if narrow: await q.select_option('select[aria-label="Escolher bloco"]', "social-composer")
            else: await q.click('aside nav button:has-text("social-composer")')
            await q.wait_for_timeout(400)
            await q.click('section .sticky [role="radiogroup"] >> nth=0 >> [role="radio"]:has-text("Composer")')
            await q.wait_for_timeout(400)
            r = await q.evaluate("""() => {
              const s=document.querySelector('section');
              const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
              const scope=box||s;
              const rows=[...scope.querySelectorAll('div.flex.items-center.gap-2')].filter(d=>d.querySelector('span.sr-only'));
              const out=[];
              for (const row of rows) {
                const nome=row.querySelector('span.truncate'), label=row.querySelector('span.bloco-micro');
                if(!nome||!label) continue;
                const rn=nome.getBoundingClientRect(), rl=label.getBoundingClientRect();
                const sn=getComputedStyle(nome);
                const ox=Math.min(rn.right,rl.right)-Math.max(rn.left,rl.left);
                out.push({txt:(nome.innerText||'').replace(/\\s+/g,' ').trim().slice(0,22),
                  display:sn.display, overflow:sn.overflow, textOverflow:sn.textOverflow,
                  paiDisplay:getComputedStyle(nome.parentElement).display,
                  paiFlex:getComputedStyle(nome.parentElement).flex,
                  overlap_px: Math.round(ox*10)/10});
              }
              return out;
            }""")
            res[w]["social-composer"] = r
            el = await q.query_selector('[class*="--r-xl"]')
            await el.screenshot(path=str(OUT / f"def-social-{w}.png"))

            # ---------- office-settings: cartoes de canal
            if narrow: await q.select_option('select[aria-label="Escolher bloco"]', "office-settings")
            else: await q.click('aside nav button:has-text("office-settings")')
            await q.wait_for_timeout(400)
            await q.click('section .sticky [role="radiogroup"] >> nth=0 >> [role="radio"]:has-text("Cartões")')
            await q.wait_for_timeout(450)
            r2 = await q.evaluate("""() => {
              const s=document.querySelector('section');
              const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
              const scope=box||s;
              const out=[];
              for (const cd of scope.querySelectorAll('div')) {
                const t=(cd.innerText||'').replace(/\\s+/g,' ');
                if (!/^WhatsApp \\+55/.test(t) && !/^Instagram sem numero/.test(t)) continue;
                if (cd.querySelector('div')) continue; // pega so o cartao
                const b=cd.getBoundingClientRect();
                out.push({card:t.slice(0,26), x:Math.round(b.left), w:Math.round(b.width),
                          scrollW:cd.scrollWidth, clientW:cd.clientWidth,
                          overflow_px: cd.scrollWidth-cd.clientWidth});
              }
              return out;
            }""")
            res[w]["office-settings"] = r2
            el2 = await q.query_selector('[class*="--r-xl"]')
            await el2.screenshot(path=str(OUT / f"def-office-{w}.png"))
            await c.close()
        await br.close()

    Path("/workspace/blocos/docs/qa-r3-conf/colisoes.json").write_text(
        json.dumps(res, indent=1, ensure_ascii=False), encoding="utf-8")

    print("="*104)
    print("COLISAO 1 — social-composer: nome do arquivo x 'IMAGEM/VIDEO · <tamanho>'")
    print("="*104)
    for w in LARGURAS:
        rows = res[w]["social-composer"]
        ov = [x for x in rows if x["overlap_px"] > 0]
        print(f"  {w}px: {len(ov)}/{len(rows)} linhas com sobreposicao de caixa | "
              f"pior sobreposicao = {max([x['overlap_px'] for x in rows], default=0)} px")
        if ov:
            x = ov[0]
            print(f"      exemplo: {x['txt']!r} | display={x['display']} overflow={x['overflow']} "
                  f"text-overflow={x['textOverflow']} | pai display={x['paiDisplay']} flex={x['paiFlex']}")
    print()
    print("="*104)
    print("COLISAO 2 — office-settings: cartao de canal estourando a celula do grid")
    print("="*104)
    for w in LARGURAS:
        rows = res[w]["office-settings"]
        if not rows:
            print(f"  {w}px: cartoes nao encontrados (layout empilhado)"); continue
        print(f"  {w}px:")
        for x in rows:
            print(f"      {x['card']:28} x={x['x']:5} w={x['w']:4} scrollW={x['scrollW']:4} "
                  f"clientW={x['clientW']:4} ESTOURA {x['overflow_px']} px")

asyncio.run(main())
