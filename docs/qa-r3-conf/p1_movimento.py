#!/usr/bin/env python3
"""Rodada 3 (2a passagem) — P1 / criterio 9 (movimento).

Prova:
 A) com reduced_motion="reduce", os LOOPS CSS (shimmer do .bloco-skeleton e o
    spinner .animate-spin) estao DESLIGADOS -> animation-name: none
    (nao acelerados para 1ms, que viraria estroboscopio).
 B) no contexto NORMAL os mesmos loops estao LIGADOS (1.6s infinite /
    1s infinite) — logo o desligamento vem do reduced-motion, nao e global.
 C) curva unica ease-apple e nenhuma transicao passa de 420ms (estado carregado).
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-r3-conf/p1.json"

MARK = """
() => {
  const s = document.querySelector('section');
  const box = [...s.querySelectorAll('div')].find(d => String(d.className).includes('--r-xl'));
  const el = box || s;
  el.setAttribute('data-qa-stage','1');
  return true;
}
"""

# markup EXATO do Spinner (packages/ui/src/button.tsx:87) + uma celula de
# skeleton real, injetados no palco para medir o que o CSS compilado faz.
INJECT = """
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const probe = document.createElement('div');
  probe.id = 'qa-spin-probe';
  probe.innerHTML = '<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>';
  scope.appendChild(probe);
  return true;
}
"""

PROBE = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const dur = (v) => Math.max(0, ...String(v||'0s').split(',').map(x => parseFloat(x) * (x.includes('ms')?1:1000)));
  const grab = (sel) => {
    const list = sel === '.qa-spin-probe'
      ? [...scope.querySelectorAll('#qa-spin-probe .animate-spin')]
      : [...scope.querySelectorAll(sel)];
    return list.map(el => {
      const s = getComputedStyle(el);
      return { name: s.animationName, dur: s.animationDuration,
               iter: s.animationIterationCount, delay: s.animationDelay,
               fill: s.animationFillMode, timing: s.animationTimingFunction };
    });
  };
  const els = [...scope.querySelectorAll('*')];
  const loops = [];
  const curves = {};
  let maxTrans = 0, maxTransSel = '', maxTransDur = '';
  for (const el of els) {
    const s = getComputedStyle(el);
    const td = dur(s.transitionDuration);
    if (td > maxTrans) { maxTrans = td; maxTransSel = el.tagName+'.'+String(el.className).slice(0,45); maxTransDur = s.transitionDuration; }
    const tf = s.transitionTimingFunction;
    curves[tf] = (curves[tf]||0) + 1;
    if (s.animationName && s.animationName !== 'none') {
      loops.push({ tag: el.tagName, cls: String(el.className).slice(0,60),
                   name: s.animationName, dur: s.animationDuration, iter: s.animationIterationCount });
    }
  }
  const docLoops = [...document.querySelectorAll('*')].filter(el => {
    const s = getComputedStyle(el);
    return s.animationName && s.animationName !== 'none';
  }).map(el => ({ tag: el.tagName, cls: String(el.className).slice(0,60),
                  name: getComputedStyle(el).animationName,
                  dur: getComputedStyle(el).animationDuration,
                  iter: getComputedStyle(el).animationIterationCount }));
  return {
    skeleton: grab('.bloco-skeleton'),
    spin: grab('.qa-spin-probe'),
    tabAnim: grab('.bloco-tab-anim'),
    loops, loopCount: loops.length,
    docLoopCount: docLoops.length, docLoops: docLoops.slice(0,15),
    maxTrans: Math.round(maxTrans), maxTransDur, maxTransSel,
    curves,
  };
}
"""

async def sweep(page, tag, out):
    for bid in BLOCKS:
        await page.click(f'aside nav button:has-text("{bid}")')
        await page.wait_for_timeout(200)
        # ---- estado CARREGADO: transicoes, curvas, loops ativos
        await page.click('section [role="radio"]:has-text("Normal")')
        await page.wait_for_timeout(300)
        await page.evaluate(MARK)
        await page.evaluate(INJECT)
        out[tag][bid] = await page.evaluate(PROBE)
        out[tag][bid]['_estado'] = 'Normal'
        # ---- estado CARREGANDO: skeleton real
        await page.click('section [role="radio"]:has-text("Carregando")')
        await page.wait_for_timeout(320)
        await page.evaluate(MARK)
        await page.evaluate(INJECT)
        sk = await page.evaluate(PROBE)
        out[tag][bid]['skeleton_loading'] = sk['skeleton']
        out[tag][bid]['spin_loading'] = sk['spin']
        out[tag][bid]['docLoops_loading'] = sk['docLoops']
        out[tag][bid]['docLoopCount_loading'] = sk['docLoopCount']
        out[tag][bid]['loopCount_loading'] = sk['loopCount']
        out[tag][bid]['loops_loading'] = sk['loops'][:15]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        out = {"reduce": {}, "normal": {}}

        ctx = await browser.new_context(viewport={"width":1440,"height":900}, reduced_motion="reduce")
        page = await ctx.new_page()
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await sweep(page, "reduce", out)

        ctx2 = await browser.new_context(viewport={"width":1440,"height":900})
        page2 = await ctx2.new_page()
        await page2.goto(URL, wait_until="networkidle")
        await page2.wait_for_timeout(1000)
        await sweep(page2, "normal", out)

        await browser.close()

    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    print("="*80)
    print("P1-A — reduced_motion=reduce  =>  animation-name deve ser 'none'")
    print("="*80)
    bad = []; ns = nsk = 0
    for bid, r in out["reduce"].items():
        for key in ("skeleton", "skeleton_loading"):
            for s in r.get(key) or []:
                ns += 1
                if s["name"] != "none": bad.append((bid, key, s))
        for key in ("spin", "spin_loading"):
            for s in r.get(key) or []:
                nsk += 1
                if s["name"] != "none": bad.append((bid, key, s))
        if r["docLoopCount"] or r["docLoopCount_loading"]:
            bad.append((bid, "doc-loop", r["docLoops"], r["docLoops_loading"]))
    print(f"  .bloco-skeleton medidos: {ns}")
    print(f"  spinner (.animate-spin) medidos: {nsk}")
    print(f"  VIOLACOES (animation-name != none) no reduce: {len(bad)}")
    for b in bad[:15]: print("   FALHA:", b)

    print("\n  amostras (reduce):")
    for bid in ["clinical-entry","social-accounts","reports-funnel","patients-list","office-team"]:
        r = out["reduce"][bid]
        print(f"   [{bid}] skeleton(carregado)={r['skeleton'][:1]}")
        print(f"   [{bid}] skeleton(carregando)={r['skeleton_loading'][:1]}")
        print(f"   [{bid}] spinner={r['spin'][:1]}")

    print()
    print("="*80)
    print("P1-B — contexto NORMAL  =>  loops DEVEM estar LIGADOS")
    print("="*80)
    nb = []; ns2 = nsp = 0
    for bid, r in out["normal"].items():
        for s in r["skeleton"] + (r["skeleton_loading"] or []):
            ns2 += 1
            if s["name"] == "none" or s["iter"] != "infinite": nb.append((bid,"skeleton",s))
        for s in r["spin"] + (r["spin_loading"] or []):
            nsp += 1
            if s["name"] == "none" or s["iter"] != "infinite": nb.append((bid,"spinner",s))
    print(f"  .bloco-skeleton: {ns2} | spinner: {nsp} | loops NAO ligados: {len(nb)}")
    for b in nb[:15]: print("   FALHA:", b)
    for bid in ["clinical-entry","social-accounts"]:
        r = out["normal"][bid]
        print(f"   [normal {bid}] skeleton(carregando)={r['skeleton_loading'][:1]}")
        print(f"   [normal {bid}] spinner={r['spin'][:1]}")

    print()
    print("="*80)
    print("P1-C — transicoes e curvas (estado carregado, contexto NORMAL)")
    print("="*80)
    mx = max(out["normal"][b]["maxTrans"] for b in BLOCKS)
    who = [b for b in BLOCKS if out["normal"][b]["maxTrans"] == mx]
    print(f"  max transition-duration: {mx} ms  (limite 420)  blocos: {who}")
    allc = {}
    for b in BLOCKS:
        for k,v in out["normal"][b]["curves"].items(): allc[k]=allc.get(k,0)+v
    print("  curvas de transition (normal):")
    for k,v in sorted(allc.items(), key=lambda x:-x[1]): print(f"    {v:6d}  {k}")
    rc = {}
    for b in BLOCKS:
        for k,v in out["reduce"][b]["curves"].items(): rc[k]=rc.get(k,0)+v
    print("  curvas de transition (reduce):")
    for k,v in sorted(rc.items(), key=lambda x:-x[1]): print(f"    {v:6d}  {k}")
    print("gravado", OUT)

asyncio.run(main())
