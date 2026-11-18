#!/usr/bin/env python3
"""C2 (ordem de tabulacao em coordenadas相对 ao container de scroll) + C5 (colisao real)."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())

MARK = """
() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); return true; }
"""

# posicao RELATIVA ao container de scroll (independe do scroll)
REL = """
() => { const el=document.activeElement; if(!el) return null;
  let anc=el.parentElement, sc=null;
  while(anc){ const s=getComputedStyle(anc);
    if(['auto','scroll'].includes(s.overflowY)||['auto','scroll'].includes(s.overflowX)){ sc=anc; break; }
    anc=anc.parentElement; }
  const base = sc || document.body;
  const br = base.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const inStage = !!el.closest('[class*="--r-xl"]');
  // indice no DOM dentro do palco
  const stage = document.querySelector('[class*="--r-xl"]');
  const sibs = stage ? [...stage.querySelectorAll('*')] : [];
  return { tag:el.tagName, cls:String(el.className).slice(0,45),
    name:(el.innerText||el.getAttribute('aria-label')||el.getAttribute('placeholder')||'').replace(/\\s+/g,' ').trim().slice(0,30),
    x:Math.round(r.left-br.left), y:Math.round(r.top-br.top),
    vx:Math.round(r.left), vy:Math.round(r.top),
    domIdx: sibs.indexOf(el), inStage, scroller: sc? (sc.className||'').toString().slice(0,40):'-' };
}
"""

# colisao REAL: elementos de TEXTO/folha que se sobrepoem
OVERLAP = r"""
() => {
  const scope=document.querySelector('[data-qa-stage]');
  const leaves=[];
  for (const el of scope.querySelectorAll('*')) {
    const s=getComputedStyle(el);
    if (s.position==='absolute'||s.position==='fixed') continue;
    const temTexto=[...el.childNodes].some(n=>n.nodeType===3 && n.nodeValue.trim().length>1);
    if (!temTexto) continue;
    const r=el.getBoundingClientRect();
    if (r.width<3||r.height<3) continue;
    leaves.push({el, r, txt:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,28)});
  }
  const col=[];
  for (let i=0;i<leaves.length;i++) for (let j=i+1;j<leaves.length;j++) {
    const a=leaves[i], b=leaves[j];
    if (a.el.contains(b.el)||b.el.contains(a.el)) continue;
    const ox=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left);
    const oy=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
    if (ox>2 && oy>2) col.push({a:a.txt, b:b.txt, ox:Math.round(ox), oy:Math.round(oy),
      acls:String(a.el.className).slice(0,35), bcls:String(b.el.className).slice(0,35)});
  }
  return { n:col.length, col:col.slice(0,6) };
}
"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await br.new_context(viewport={"width":1440,"height":900})
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(900)
        ordem={}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(200)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(220)
            await pg.evaluate("()=>document.activeElement?.blur()")
            seq=[]
            for _ in range(20):
                await pg.keyboard.press("Tab")
                f=await pg.evaluate(REL)
                if not f or f["tag"]=="BODY": break
                seq.append(f)
            ordem[bid]=seq
        # colisao de texto em 5 larguras
        coll={}
        for w in [390,768,1280,1440,1920]:
            c=await br.new_context(viewport={"width":w,"height":900})
            q=await c.new_page(); await q.goto(URL,wait_until="networkidle"); await q.wait_for_timeout(700)
            narrow=w<768; coll[w]={}
            for bid in BLOCKS:
                if narrow: await q.select_option('select[aria-label="Escolher bloco"]', bid)
                else: await q.click(f'aside nav button:has-text("{bid}")')
                await q.wait_for_timeout(160)
                await q.evaluate(MARK)
                coll[w][bid]=await q.evaluate(OVERLAP)
            await c.close()
        await br.close()
    (ROOT/"docs/qa-r3-conf/c2c5b.json").write_text(json.dumps({"ordem":ordem,"coll":coll},indent=1,ensure_ascii=False),encoding="utf-8")

    print("="*100); print("C2 — ORDEM DE TABULACAO (coordenadas relativas ao container de scroll)"); print("="*100)
    ruins=[]; col=0; naoDom=0
    for bid,seq in ordem.items():
        prev=None
        for f in seq:
            if not f["inStage"]: prev=None; continue
            if prev:
                col+=1
                # violacao: voltou para a esquerda E para cima no espaco do container
                if f["x"] < prev["x"]-2 and f["y"] < prev["y"]-2:
                    ruins.append((bid,prev,f))
                if f["domIdx"] < prev["domIdx"]: naoDom+=1
            prev=f
    print(f"  transicoes dentro do bloco: {col}")
    print(f"  passos que quebram a ordem do DOM: {naoDom}")
    print(f"  passos que voltam para a esquerda E para cima (espaco do container): {len(ruins)}")
    for r in ruins[:12]:
        print(f"    {r[0]:20} {r[1]['name']!r} ({r[1]['x']},{r[1]['y']}) -> {r[2]['name']!r} ({r[2]['x']},{r[2]['y']})  scroller={r[1]['scroller']!r}")

    print(); print("="*100); print("C5 — SOBREPOSICAO DE TEXTO (folhas)"); print("="*100)
    for w,bl in coll.items():
        tot=sum(r["n"] for r in bl.values())
        print(f"  {w}px: sobreposicoes de texto = {tot}")
        for bid,r in bl.items():
            if r["n"]: print(f"     {bid}: {r['col'][:2]}")
    print("gravado docs/qa-r3-conf/c2c5b.json")

asyncio.run(main())
