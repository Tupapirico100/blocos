#!/usr/bin/env python3
"""C2 (ordem de tabulacao) + C5 (escala de gap e colisao)."""
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

# ---- C5: gap com contexto
GAP = r"""
() => {
  const scope=document.querySelector('[data-qa-stage]');
  const CANON=[8,12,16,24,32];       // gap-2/3/4/6/8
  const AMP=[2,4,6,10];               // gap-0.5/1/1.5/2.5 (so em controle denso)
  const AMP2=[1];                     // gap-px
  const fora=[], dentro=[];
  for (const el of scope.querySelectorAll('*')) {
    const s=getComputedStyle(el);
    if (!['flex','grid','inline-flex','inline-grid'].includes(s.display)) continue;
    const vals=[...new Set(s.gap.split(' ').map(v=>parseFloat(v)).filter(v=>Number.isFinite(v)&&v>0))];
    for (const v of vals) {
      if (CANON.includes(v)) continue;
      const denso = !!el.closest('tr, li, button, [role="button"], td, th, label, fieldset, table, [data-denso]')
                || el.matches('button, [role="button"], tr, td, th, li, label');
      const rec={ gap:v, cls:String(el.className).slice(0,70), tag:el.tagName,
                  denso, dentroDe: (el.closest('tr,li,td,th,label,table')||{tagName:'-'}).tagName };
      if (denso) dentro.push(rec); else fora.push(rec);
    }
  }
  return { fora, dentro, nDentro: dentro.length };
}
"""

# ---- C5: colisao (sobreposicao de irmaos) e encostamento
COLL = r"""
() => {
  const scope=document.querySelector('[data-qa-stage]');
  const stage=scope.getBoundingClientRect();
  const colisoes=[]; const encostando=[];
  const kids=[...scope.querySelectorAll('*')].filter(el=>{
    const s=getComputedStyle(el);
    if (!['flex','grid'].includes(s.display)) return false;
    if (s.position==='absolute'||s.position==='fixed') return false;
    const r=el.getBoundingClientRect();
    return r.width>2 && r.height>2;
  });
  for (let i=0;i<kids.length;i++) for (let j=i+1;j<kids.length;j++) {
    const a=kids[i], b=kids[j];
    if (a.contains(b)||b.contains(a)) continue;
    const ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
    const ox=Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left);
    const oy=Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top);
    if (ox>2 && oy>2) colisoes.push({a:a.tagName+'.'+String(a.className).slice(0,40),
                                     b:b.tagName+'.'+String(b.className).slice(0,40),
                                     ox:Math.round(ox), oy:Math.round(oy)});
  }
  // encostamento: elemento colado na borda do palco (sem respiro)
  for (const el of scope.querySelectorAll('*')) {
    const r=el.getBoundingClientRect();
    if (r.width<2||r.height<2) continue;
    const s=getComputedStyle(el);
    if (s.position==='absolute'||s.position==='fixed') continue;
    if (r.left-stage.left < 0.5 || stage.right-r.right < 0.5) {
      encostando.push({tag:el.tagName, cls:String(el.className).slice(0,50),
                       esq:Math.round(r.left-stage.left), dir:Math.round(stage.right-r.right)});
    }
  }
  return { colisoes: colisoes.slice(0,10), nColisoes: colisoes.length,
           encostando: encostando.slice(0,8), nEncostando: encostando.length };
}
"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await br.new_context(viewport={"width":1440,"height":900})
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(900)

        # ---------- C2 ordem de tabulacao
        ordem = {}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(200)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(220)
            await pg.evaluate("()=>document.activeElement?.blur()")
            seq=[]
            for _ in range(18):
                await pg.keyboard.press("Tab")
                f = await pg.evaluate("""() => { const el=document.activeElement; if(!el) return null;
                  const r=el.getBoundingClientRect();
                  return {tag:el.tagName, cls:String(el.className).slice(0,45),
                    name:(el.innerText||el.getAttribute('aria-label')||el.getAttribute('placeholder')||'').replace(/\\s+/g,' ').trim().slice(0,30),
                    x:Math.round(r.left), y:Math.round(r.top),
                    inStage: !!el.closest('[class*="--r-xl"]')}; }""")
                if not f or f["tag"]=="BODY": break
                seq.append(f)
            ordem[bid]=seq

        # ---------- C5 gaps (por bloco, estado normal)
        gaps={}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(180)
            await pg.evaluate(MARK)
            gaps[bid]=await pg.evaluate(GAP)

        # ---------- C5 colisao em 5 larguras
        coll={}
        for w in [390,768,1280,1440,1920]:
            c=await br.new_context(viewport={"width":w,"height":900})
            q=await c.new_page(); await q.goto(URL,wait_until="networkidle"); await q.wait_for_timeout(700)
            narrow = w<768
            coll[w]={}
            for bid in BLOCKS:
                if narrow: await q.select_option('select[aria-label="Escolher bloco"]', bid)
                else: await q.click(f'aside nav button:has-text("{bid}")')
                await q.wait_for_timeout(160)
                await q.evaluate(MARK)
                coll[w][bid]=await q.evaluate(COLL)
            await c.close()
        await br.close()

    out={"ordem":ordem,"gaps":gaps,"coll":coll}
    (ROOT/"docs/qa-r3-conf/c2c5.json").write_text(json.dumps(out,indent=1,ensure_ascii=False),encoding="utf-8")

    # ---------------- C2
    print("="*100); print("C2 — ORDEM DE TABULACAO (dentro do bloco)"); print("="*100)
    ruins=[]; col=0
    for bid,seq in ordem.items():
        prev=None
        for f in seq:
            if not f["inStage"]:
                prev=None; continue
            if prev:
                col+=1
                # violacao real: volta para a esquerda E para cima (leitura retrograda)
                if f["x"] < prev["x"]-2 and f["y"] < prev["y"]-2:
                    ruins.append((bid, prev, f))
            prev=f
    print(f"  transicoes de foco dentro do bloco: {col}")
    print(f"  VIOLACOES (voltou para a esquerda E para cima): {len(ruins)}")
    for r in ruins[:12]: print("   ", r[0], repr(r[1]['name']), r[1]['x'],r[1]['y'], "->", repr(r[2]['name']), r[2]['x'],r[2]['y'])

    # ---------------- C5 gaps
    print(); print("="*100); print("C5 — ESCALA DE GAP"); print("="*100)
    fora=[]; dentro=0
    for bid,g in gaps.items():
        for r in g["fora"]: fora.append((bid,r))
        dentro+=g["nDentro"]
    print(f"  gaps ampliados (4/6/10/2px) DENTRO de controle denso: {dentro}")
    print(f"  gaps ampliados FORA de controle denso: {len(fora)}")
    c= {}
    for bid,r in fora: c[(r["gap"], r["tag"], r["dentroDe"])] = c.get((r["gap"], r["tag"], r["dentroDe"]),0)+1
    for k,v in sorted(c.items(), key=lambda x:-x[1])[:20]:
        print(f"    {v:4d}  gap={k[0]}px  <{k[1]}>  ancestral={k[2]}")
    for bid,r in fora[:8]: print("    EX:",bid,r)

    # ---------------- C5 colisao
    print(); print("="*100); print("C5 — COLISAO / ENCOSTAMENTO"); print("="*100)
    for w,bl in coll.items():
        nc=sum(r["nColisoes"] for r in bl.values()); ne=sum(r["nEncostando"] for r in bl.values())
        print(f"  {w}px: colisoes={nc} | encostando na borda={ne}")
        for bid,r in bl.items():
            if r["nColisoes"]: print(f"     {bid}: {r['colisoes'][:2]}")
            if r["nEncostando"]: print(f"     encosta {bid}: {r['encostando'][:2]}")

asyncio.run(main())
