#!/usr/bin/env python3
"""P1-C — curvas: so elementos com duracao > 0 + inventario WAAPI (motion/react)."""
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

PROBE = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const dur = (v) => Math.max(0, ...String(v||'0s').split(',').map(x => parseFloat(x) * (x.includes('ms')?1:1000)));
  const pairs = {};
  const offenders = [];
  let maxT = 0, maxEl = '';
  for (const el of scope.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    const td = dur(s.transitionDuration);
    if (td <= 0) continue;
    const key = s.transitionDuration + ' | ' + s.transitionTimingFunction;
    pairs[key] = (pairs[key]||0)+1;
    if (td > maxT) { maxT = td; maxEl = el.tagName+'.'+String(el.className).slice(0,50); }
    if (s.transitionTimingFunction === 'ease' || s.transitionTimingFunction === 'linear'
        || s.transitionTimingFunction === 'ease-in' || s.transitionTimingFunction === 'ease-out'
        || s.transitionTimingFunction === 'ease-in-out') {
      offenders.push({ tag: el.tagName, cls: String(el.className).slice(0,60),
                       dur: s.transitionDuration, tf: s.transitionTimingFunction });
    }
  }
  // WAAPI: animacoes correndo agora
  const waapi = document.getAnimations().map(a => ({
    name: a.animationName || (a.effect && a.effect.getKeyframes ? 'kf' : '?'),
    dur: a.effect && a.effect.getTiming ? a.effect.getTiming().duration : null,
    easing: a.effect && a.effect.getTiming ? a.effect.getTiming().easing : null,
    iterations: a.effect && a.effect.getTiming ? a.effect.getTiming().iterations : null,
    state: a.playState,
    target: a.effect && a.effect.target ? a.effect.target.tagName + '.' + String(a.effect.target.className).slice(0,40) : null,
  }));
  return { pairs, offenders, maxT: Math.round(maxT), maxEl, waapi,
           waapiCount: waapi.length,
           reducedMQ: matchMedia('(prefers-reduced-motion: reduce)').matches };
}
"""

async def sweep(page, tag, out):
    for bid in BLOCKS:
        await page.click(f'aside nav button:has-text("{bid}")')
        await page.wait_for_timeout(200)
        await page.click('section [role="radio"]:has-text("Normal")')
        await page.wait_for_timeout(320)
        await page.evaluate(MARK)
        out[bid] = await page.evaluate(PROBE)

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        out = {}
        for tag, rm in (("normal", None), ("reduce", "reduce")):
            kw = {"viewport": {"width":1440,"height":900}}
            if rm: kw["reduced_motion"] = rm
            ctx = await br.new_context(**kw)
            pg = await ctx.new_page()
            await pg.goto(URL, wait_until="networkidle")
            await pg.wait_for_timeout(900)
            out[tag] = {}
            await sweep(pg, tag, out[tag])
            await ctx.close()
        await br.close()

    for tag in ("normal","reduce"):
        print("="*80); print("P1-C —", tag.upper())
        allpairs = {}; alloff = []; mx = 0; mxel = ''
        waapi = []
        for b in BLOCKS:
            r = out[tag][b]
            for k,v in r['pairs'].items(): allpairs[k]=allpairs.get(k,0)+v
            alloff += [(b,o) for o in r['offenders']]
            if r['maxT'] > mx: mx = r['maxT']; mxel = b+' '+r['maxEl']
            waapi += [(b,a) for a in r['waapi']]
        print(f"  prefers-reduced-motion ativo: {out[tag][BLOCKS[0]]['reducedMQ']}")
        print(f"  max transition-duration: {mx} ms  ({mxel})")
        print("  pares (duracao | curva) com duracao>0:")
        for k,v in sorted(allpairs.items(), key=lambda x:-x[1]): print(f"    {v:6d}  {k}")
        print(f"  elementos com curva NAO-DS e duracao>0: {len(alloff)}")
        for o in alloff[:10]: print("    ", o)
        print(f"  animacoes WAAPI correndo (amostra {min(len(waapi),8)} de {len(waapi)}):")
        for b,a in waapi[:8]: print(f"    [{b}] {a}")
        durs = sorted({a['dur'] for _,a in waapi if a['dur']})
        eas  = sorted({a['easing'] for _,a in waapi if a['easing']})
        print(f"  WAAPI duracoes distintas: {durs} | easings distintas: {eas}")

asyncio.run(main())
