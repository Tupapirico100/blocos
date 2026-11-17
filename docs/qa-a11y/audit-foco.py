#!/usr/bin/env python3
"""QA a11y — foco: varredura de tabulacao com teclado real dentro do palco de cada bloco.

Para cada bloco: entra no palco pelo teclado e mede o indicador de foco de cada
elemento alcancado (outline do DS, box-shadow/ring, ou anel padrao do navegador).
Saida: docs/qa-a11y/foco.json
"""
import asyncio, json, re
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-a11y/foco.json"

MARK = """
() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>d.className.toString().includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); }
"""

STYLE = r"""
() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const s = getComputedStyle(el);
  const num = (v) => { const m = /([0-9.]+)px/.exec(String(v||'')); return m ? parseFloat(m[1]) : 0; };
  const outlineDs = s.outlineStyle !== 'none' && s.outlineStyle !== 'auto' && num(s.outlineWidth) >= 1;
  const uaRing = s.outlineStyle === 'auto';
  const shadow = s.boxShadow && s.boxShadow !== 'none' && !/^rgba\(0, 0, 0, 0\)/.test(s.boxShadow);
  return {
    tag: el.tagName,
    role: el.getAttribute('role'),
    texto: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g,' ').trim().slice(0,38),
    cls: String(el.className || '').slice(0,64),
    outlineDs, uaRing, shadow: !!shadow,
    outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor,
    boxShadow: (s.boxShadow||'').slice(0,60),
    dentroDoPalco: !!el.closest('[data-qa-stage]'),
    tabindex: el.getAttribute('tabindex'),
  };
}
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1200)
        out = {}
        for bid in BLOCKS:
            await page.click(f'aside nav button:has-text("{bid}")')
            await page.wait_for_timeout(300)
            await page.evaluate(MARK)
            # foco no 1o focavel do palco, via teclado a partir de um ponto conhecido
            await page.evaluate("""() => { const s=document.querySelector('[data-qa-stage]');
                const f=s.querySelector('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
                f && f.focus(); }""")
            seq = []
            for _ in range(60):
                st = await page.evaluate(STYLE)
                if st is None:
                    break
                seq.append(st)
                if not st["dentroDoPalco"]:
                    break
                await page.keyboard.press("Tab")
                await page.wait_for_timeout(260)
            # ordem do DOM dos focaveis, para comparar com a ordem do Tab
            dom = await page.evaluate("""() => { const s=document.querySelector('[data-qa-stage]');
                const sel='a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),[role=button],[role=switch],[role=checkbox],[role=tab]';
                return [...s.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect(); const st=getComputedStyle(e);
                    return r.width>0&&r.height>0&&st.display!=='none'&&st.visibility!=='hidden'&&!e.disabled;})
                  .map(e=>{const r=e.getBoundingClientRect(); return {tag:e.tagName, role:e.getAttribute('role'),
                    y:Math.round(r.top+window.scrollY), x:Math.round(r.left+window.scrollX),
                    texto:(e.innerText||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim().slice(0,30)};}); }""")
            out[bid] = {"sequencia": seq, "dom": dom}
            print(bid, len(seq))
        await browser.close()
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print("gravado", OUT)

asyncio.run(main())
