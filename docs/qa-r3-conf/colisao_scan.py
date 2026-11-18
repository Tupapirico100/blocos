#!/usr/bin/env python3
"""Varredura de colisao/truncacao inerte em 29 blocos x variantes x 5 estados.

(a) elementos com classe `truncate` cujo display computado e inline
    -> `overflow:hidden`/`text-overflow:ellipsis` NAO se aplicam a inline box
       => a truncacao nao acontece e o texto invade o vizinho.
(b) pares de nos de texto (folhas) com caixa sobreposta -> colisao possivel.
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
STATES = ["Normal", "Carregando", "Vazio", "Erro", "Sem permissao"]

MARK = """
() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); return true; }
"""

SCAN = r"""
() => {
  const scope=document.querySelector('[data-qa-stage]');
  const vis=(el)=>{const r=el.getBoundingClientRect(); const s=getComputedStyle(el);
    return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';};
  const inerte=[], overflow=[], folhas=[];
  for (const el of scope.querySelectorAll('*')) {
    if (!vis(el)) continue;
    const s=getComputedStyle(el);
    const cls=String(el.className);
    const temTexto=[...el.childNodes].some(n=>n.nodeType===3 && n.nodeValue.trim().length>1);
    if (cls.includes('truncate')) {
      const inline = s.display==='inline' || s.display==='contents';
      const paiFlex = el.parentElement && getComputedStyle(el.parentElement).display.includes('flex');
      const paiFlexCol = el.parentElement && getComputedStyle(el.parentElement).display.includes('grid');
      if (inline && !paiFlex && !paiFlexCol) {
        inerte.push({tag:el.tagName, cls:cls.slice(0,60), display:s.display,
                     pai:getComputedStyle(el.parentElement).display,
                     txt:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,30)});
      }
    }
    if (temTexto) {
      const r=el.getBoundingClientRect();
      folhas.push({el, r, txt:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,26),
                   cls:cls.slice(0,45), sw:el.scrollWidth, cw:el.clientWidth,
                   ov:s.overflow, te:s.textOverflow});
      if (el.scrollWidth > el.clientWidth+2 && s.textOverflow!=='ellipsis' && s.overflowX!=='auto' && s.overflowX!=='scroll') {
        overflow.push({tag:el.tagName, cls:cls.slice(0,55), sw:el.scrollWidth, cw:el.clientWidth,
                       txt:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,40)});
      }
    }
  }
  // colisao entre folhas de texto
  const col=[];
  for (let i=0;i<folhas.length;i++) for (let j=i+1;j<folhas.length;j++) {
    const a=folhas[i], b=folhas[j];
    if (a.el.contains(b.el)||b.el.contains(a.el)) continue;
    if (a.cls.includes('sr-only')||b.cls.includes('sr-only')) continue;
    const ox=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left);
    const oy=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
    if (ox>2 && oy>2) col.push({a:a.txt, b:b.txt, ac:a.cls, bc:b.cls, ox:Math.round(ox), oy:Math.round(oy)});
  }
  return { inerte, nInerte:inerte.length, overflow, nOverflow:overflow.length, col, nCol:col.length };
}
"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await br.new_context(viewport={"width":1440,"height":900})
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(900)
        res={}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(200)
            labels = await pg.evaluate("""() => { const g=document.querySelector('section .sticky [role="radiogroup"]');
              return g?[...g.querySelectorAll('[role="radio"]')].map(b=>b.innerText.trim()):[]; }""")
            res[bid]={}
            for lab in labels:
                await pg.click(f'section .sticky [role="radiogroup"] >> nth=0 >> [role="radio"]:has-text("{lab}")')
                await pg.wait_for_timeout(260)
                for st in STATES:
                    await pg.click(f'section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("{st}")')
                    await pg.wait_for_timeout(240)
                    await pg.evaluate(MARK)
                    res[bid][f"{lab}|{st}"]=await pg.evaluate(SCAN)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(120)
        await br.close()
    (ROOT/"docs/qa-r3-conf/colisao.json").write_text(json.dumps(res,indent=1,ensure_ascii=False),encoding="utf-8")

    print("="*100); print("(a) TRUNCACAO INERTE (classe truncate com display:inline)"); print("="*100)
    seen=set(); n=0
    for bid,ks in res.items():
      for k,r in ks.items():
        for x in r["inerte"]:
            key=(bid,x["cls"])
            if key in seen: continue
            seen.add(key); n+=1
            print(f"  {bid:20} <{x['tag']}> pai={x['pai']:12} cls={x['cls'][:52]}")
            print(f"      texto: {x['txt']!r}")
    print(f"  TOTAL combinacoes com truncacao inerte: {n}")

    print(); print("="*100); print("(b) TEXTO COM scrollWidth > clientWidth+2 (sem ellipsis)"); print("="*100)
    n2=0
    for bid,ks in res.items():
      for k,r in ks.items():
        for x in r["overflow"]:
            n2+=1
            if n2<=15: print(f"  {bid:20} <{x['tag']}> sw={x['sw']} cw={x['cw']} {x['cls'][:50]} | {x['txt']!r}")
    print(f"  TOTAL: {n2}")

    print(); print("="*100); print("(c) COLISAO ENTRE FOLHAS DE TEXTO"); print("="*100)
    n3=0
    for bid,ks in res.items():
      for k,r in ks.items():
        for x in r["col"]:
            n3+=1
            if n3<=25:
                print(f"  {bid:18} {k:28} {x['a']!r} X {x['b']!r} ox={x['ox']} oy={x['oy']}")
                print(f"      A={x['ac']}\n      B={x['bc']}")
    print(f"  TOTAL pares com sobreposicao de caixa: {n3}")

asyncio.run(main())
