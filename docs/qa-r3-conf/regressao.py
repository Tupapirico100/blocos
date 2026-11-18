#!/usr/bin/env python3
"""Rodada 3 (2a passagem) — varredura de regressao.

 A) erros de console no catalogo (29 blocos x 5 estados)
 B) arvore de acessibilidade (CDP Accessibility.getFullAXTree): controles sem
    nome acessivel nos 29 blocos x 5 estados
 C) overflow de documento em 390/768/1280/1440/1920
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-r3-conf/regressao.json"
STATES = ["Normal", "Carregando", "Vazio", "Erro", "Sem permissao"]

INTERACTIVE = {
    "button","link","textbox","searchbox","checkbox","radio","switch","combobox",
    "listbox","slider","spinbutton","tab","menuitem","menuitemcheckbox",
    "menuitemradio","option","treeitem",
}

MARK = """
() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); return true; }
"""

OVERFLOW = """
() => {
  const de = document.documentElement;
  const offenders = [];
  const vw = de.clientWidth;
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      const s = getComputedStyle(el);
      if (s.position === 'fixed') continue;
      offenders.push({ tag: el.tagName, cls: String(el.className).slice(0,60),
                       left: Math.round(r.left), right: Math.round(r.right) });
    }
  }
  return { scrollW: de.scrollWidth, clientW: de.clientWidth,
           bodyScrollW: document.body.scrollWidth,
           overflow: de.scrollWidth > de.clientWidth,
           offenders: offenders.slice(0, 8), nOff: offenders.length };
}
"""

async def ax_named(pg, session, bid, state):
    """controles interativos sem nome acessivel dentro do palco"""
    await pg.evaluate(MARK)
    doc = await session.send("DOM.getDocument", {"depth": -1})
    root = doc["root"]["nodeId"]
    nodes = await session.send("DOM.querySelectorAll", {"nodeId": root, "selector": "[data-qa-stage]"})
    if not nodes.get("nodeIds"):
        return {"erro": "palco nao encontrado"}
    stage_id = nodes["nodeIds"][0]
    desc = await session.send("DOM.describeNode", {"nodeId": stage_id})
    backend = desc["node"].get("backendNodeId")
    tree = await session.send("Accessibility.getFullAXTree")
    byid = {n["nodeId"]: n for n in tree["nodes"]}
    # localiza o AX node do palco pelo backendNodeId
    stage_ax = None
    for n in tree["nodes"]:
        if n.get("backendDOMNodeId") == backend:
            stage_ax = n; break
    if stage_ax is None:
        return {"erro": "AX node do palco nao encontrado"}
    # percorre descendentes
    stack = list(stage_ax.get("childIds") or [])
    visited = set()
    controls = 0
    unnamed = []
    while stack:
        nid = stack.pop()
        if nid in visited: continue
        visited.add(nid)
        n = byid.get(nid)
        if n is None: continue
        if n.get("childIds"): stack.extend(n["childIds"])
        if n.get("ignored"): continue
        role = (n.get("role") or {}).get("value")
        if role in INTERACTIVE:
            controls += 1
            name = (n.get("name") or {}).get("value") or ""
            if not name.strip():
                unnamed.append({"role": role,
                                "backendDOMNodeId": n.get("backendDOMNodeId")})
    return {"controls": controls, "unnamed": unnamed, "nUnnamed": len(unnamed)}

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await br.new_context(viewport={"width":1440,"height":900})
        pg = await ctx.new_page()
        session = await ctx.new_cdp_session(pg)
        console = []
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:300]})
              if m.type in ("error","warning") else None)
        pg.on("pageerror", lambda e: console.append({"type": "pageerror", "text": str(e)[:300]}))
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(900)

        ax = {}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(200)
            ax[bid] = {}
            for st in STATES:
                await pg.click(f'section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("{st}")')
                await pg.wait_for_timeout(280)
                ax[bid][st] = await ax_named(pg, session, bid, st)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(120)
        await ctx.close()

        # ---- overflow em 5 larguras
        ov = {}
        for w in [390, 768, 1280, 1440, 1920]:
            c = await br.new_context(viewport={"width": w, "height": 900})
            q = await c.new_page()
            await q.goto(URL, wait_until="networkidle")
            await q.wait_for_timeout(800)
            ov[w] = {}
            narrow = w < 768
            for bid in BLOCKS:
                if narrow:
                    await q.select_option('select[aria-label="Escolher bloco"]', bid)
                else:
                    await q.click(f'aside nav button:has-text("{bid}")')
                await q.wait_for_timeout(170)
                worst = None
                for st in STATES:
                    await q.click(f'section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("{st}")')
                    await q.wait_for_timeout(220)
                    r = await q.evaluate(OVERFLOW)
                    if worst is None or r["scrollW"] > worst["scrollW"]: worst = r
                ov[w][bid] = worst
                await q.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
                await q.wait_for_timeout(100)
            await c.close()
        await br.close()

    out = {"console": console, "ax": ax, "overflow": ov}
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    print("="*90); print("REGRESSAO A) ERROS DE CONSOLE"); print("="*90)
    errs = [c for c in console if c["type"] in ("error","pageerror")]
    warns = [c for c in console if c["type"] == "warning"]
    print(f"  erros: {len(errs)} | warnings: {len(warns)}")
    for e in errs[:20]: print("   ERRO:", e)

    print(); print("="*90); print("REGRESSAO B) CONTROLES SEM NOME ACESSIVEL (AX tree via CDP)"); print("="*90)
    tot_c = tot_u = 0
    for bid, st in ax.items():
        for s, r in st.items():
            if "erro" in r: print(f"   ERRO {bid}/{s}: {r['erro']}"); continue
            tot_c += r["controls"]; tot_u += r["nUnnamed"]
            if r["nUnnamed"]: print(f"   FALHA {bid}/{s}: {r['unnamed']}")
    print(f"  controles interativos inspecionados: {tot_c}")
    print(f"  controles SEM NOME: {tot_u}")
    print(f"  combinacoes bloco x estado: {sum(len(v) for v in ax.values())}")

    print(); print("="*90); print("REGRESSAO C) OVERFLOW DE DOCUMENTO"); print("="*90)
    for w, blocks in ov.items():
        bad = {b: r for b, r in blocks.items() if r["overflow"]}
        mx = max(r["scrollW"] for r in blocks.values())
        print(f"  {w}px: scrollWidth max={mx} | blocos com overflow: {len(bad)}")
        for b, r in list(bad.items())[:6]:
            print(f"     {b}: scrollW={r['scrollW']} clientW={r['clientW']} nOff={r['nOff']} {r['offenders'][:3]}")
    print("gravado", OUT)

asyncio.run(main())
