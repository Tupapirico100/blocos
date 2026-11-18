#!/usr/bin/env python3
"""P2b — sequencia de headings dos 29 blocos nos 5 estados (nao so na variante default)."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
CHROME="/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"; URL="http://localhost:4173"
ROOT=Path("/workspace/blocos"); BLOCKS=json.loads((ROOT/"docs/blocos.json").read_text())
MARK="""() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); return true; }"""
PROBE="""() => { const scope=document.querySelector('[data-qa-stage]');
  const lv=(root)=>[...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(el=>Number(el.tagName[1]));
  return {bloco:lv(scope), doc:lv(document)}; }"""
STATES=["Normal","Carregando","Vazio","Erro","Sem permissao"]
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path=CHROME,args=["--no-sandbox"])
        ctx=await br.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        await pg.goto(URL,wait_until="networkidle"); await pg.wait_for_timeout(800)
        res={}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")'); await pg.wait_for_timeout(180)
            res[bid]={}
            for st in STATES:
                await pg.click(f'section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("{st}")')
                await pg.wait_for_timeout(230); await pg.evaluate(MARK)
                res[bid][st]=await pg.evaluate(PROBE)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")'); await pg.wait_for_timeout(110)
        await br.close()
    fails=[]; seqs=set(); dseqs=set(); combos=0
    for bid,st in res.items():
        for s,v in st.items():
            combos+=1; seqs.add(tuple(v['bloco'])); dseqs.add(tuple(v['doc']))
            prev=1; sk=[]
            for l in v['bloco']:
                if l>prev+1: sk.append((prev,l))
                prev=l
            if v['bloco'].count(1)>1: sk.append(('h1x2',))
            prev=0; dk=[]
            for l in v['doc']:
                if l>prev+1: dk.append((prev,l))
                prev=l
            if v['doc'].count(1)>1: dk.append(('h1x2',))
            if sk or dk: fails.append((bid,s,sk,dk,v['bloco'],v['doc']))
    print("combinacoes bloco x estado:", combos)
    print("sequencias de heading nos blocos:", sorted(seqs))
    print("sequencias no documento:", sorted(dseqs))
    print("FALHAS:", len(fails))
    for f in fails[:15]: print("  ", f)
    (ROOT/"docs/qa-r3-conf/p2b.json").write_text(json.dumps(res,indent=1,ensure_ascii=False),encoding="utf-8")
asyncio.run(main())
