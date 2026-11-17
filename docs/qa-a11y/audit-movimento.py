#!/usr/bin/env python3
"""QA a11y — movimento: prefers-reduced-motion + layout shift na troca de bloco/estado/variante.

Saida: docs/qa-a11y/movimento-reduced.json
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-a11y/movimento-reduced.json"

MARK = """
() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>d.className.toString().includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); }
"""

PROBE = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const els = [...scope.querySelectorAll('*')];
  const dur = (v) => Math.max(0, ...String(v||'0s').split(',').map(x => parseFloat(x) * (x.includes('ms')?1:1000)));
  let maxTrans = 0, maxAnim = 0, animInfinite = 0; const animNames = new Set();
  for (const el of els) {
    const s = getComputedStyle(el);
    const td = dur(s.transitionDuration), ad = dur(s.animationDuration);
    if (td > maxTrans) maxTrans = td;
    if (ad > maxAnim) maxAnim = ad;
    if (s.animationName && s.animationName !== 'none') {
      animNames.add(s.animationName + ' ' + Math.round(ad) + 'ms x' + s.animationIterationCount);
      if (s.animationIterationCount === 'infinite') animInfinite++;
    }
  }
  const r = scope.getBoundingClientRect();
  return { maxTrans: Math.round(maxTrans), maxAnim: Math.round(maxAnim), animInfinite,
           animNames: [...animNames].slice(0,8), altura: Math.round(r.height),
           texto: (scope.innerText||'').replace(/\s+/g,' ').slice(0,110) };
}
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
        page = await ctx.new_page()
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1200)
        out = {"reduced": {}, "normal": {}, "layout": {}}

        async def sweep(pg, tag):
            for bid in BLOCKS:
                await pg.click(f'aside nav button:has-text("{bid}")')
                await pg.wait_for_timeout(260)
                await pg.evaluate(MARK)
                out[tag][bid] = await pg.evaluate(PROBE)

        await sweep(page, "reduced")
        ctx2 = await browser.new_context(viewport={"width": 1440, "height": 900})
        p2 = await ctx2.new_page()
        await p2.goto(URL, wait_until="networkidle")
        await p2.wait_for_timeout(1200)
        await sweep(p2, "normal")

        # ---- layout shift: altura do palco por estado e por variante
        for bid in BLOCKS:
            await page.click(f'aside nav button:has-text("{bid}")')
            await page.wait_for_timeout(280)
            alturas = []
            for estado in ["Normal", "Carregando", "Vazio", "Erro", "Sem permissao"]:
                await page.click(f'section button[role="tab"]:has-text("{estado}")')
                await page.wait_for_timeout(280)
                await page.evaluate(MARK)
                h = await page.evaluate("() => Math.round(document.querySelector('[data-qa-stage]').getBoundingClientRect().height)")
                alturas.append((estado, h))
            # variantes: botoes de tab do PRIMEIRO segmented (variacao do bloco)
            await page.click('section button[role="tab"]:has-text("Normal")')
            await page.wait_for_timeout(240)
            labels = await page.evaluate("""() => { const g=document.querySelector('section .sticky');
                const segs=g.querySelectorAll("[role=tablist]");
                return [...segs[0].querySelectorAll('[role=tab]')].map(b=>b.innerText.trim()); }""")
            varh = []
            for t in labels:
                await page.click(f'section .sticky [role="tablist"] >> nth=0 >> button:has-text("{t}")')
                await page.wait_for_timeout(300)
                await page.evaluate(MARK)
                h = await page.evaluate("() => Math.round(document.querySelector('[data-qa-stage]').getBoundingClientRect().height)")
                varh.append((t, h))
            out["layout"][bid] = {"estados": alturas, "variantes": varh}
            print(bid, alturas, varh)
        await browser.close()
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print("gravado", OUT)

asyncio.run(main())
