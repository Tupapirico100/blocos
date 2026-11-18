#!/usr/bin/env python3
"""C2 — indicador de foco REAL (outline + ring + borda) + diff de pixel."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())

PROBE = """
() => { const el=document.activeElement; if(!el) return null;
  const s=getComputedStyle(el); const r=el.getBoundingClientRect();
  return { tag:el.tagName, type:el.type||'', cls:String(el.className).slice(0,55),
    name:(el.innerText||el.getAttribute('aria-label')||el.getAttribute('placeholder')||'').replace(/\\s+/g,' ').trim().slice(0,26),
    focusVisible: el.matches(':focus-visible'),
    outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`,
    os:s.outlineStyle, ow:s.outlineWidth, oc:s.outlineColor, oo:s.outlineOffset,
    boxShadow:s.boxShadow, borderColor:s.borderColor, borderWidth:s.borderWidth,
    x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height) };
}
"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await br.new_context(viewport={"width":1440,"height":900})
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(900)
        seen = {}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(200)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(220)
            await pg.evaluate("()=>{document.activeElement?.blur();}")
            for _ in range(14):
                await pg.keyboard.press("Tab")
                f = await pg.evaluate(PROBE)
                if not f or f["tag"] == "BODY": break
                # mede o pixel: screenshot do elemento antes e depois? (foco ja aplicado)
                key = (f["tag"], f["type"], f["cls"][:40])
                if key not in seen:
                    el = pg.locator("xpath=.//*[@class]").first  # placeholder
                    seen[key] = f
        await br.close()

    print("="*110)
    print("C2 — INDICADOR DE FOCO por tipo de controle (primeira ocorrencia de cada)")
    print("="*110)
    for (tag, type_, cls), f in sorted(seen.items()):
        print(f"  {tag:8} type={type_ or '-':10} focusVisible={str(f['focusVisible']):5} "
              f"outline[{f['os']} {f['ow']} {f['oc']} off {f['oo']}]")
        print(f"           border: {f['borderWidth']} {f['borderColor']}")
        print(f"           ring:   {f['boxShadow'][:120]}")
        print(f"           cls:    {f['cls']}")

asyncio.run(main())
