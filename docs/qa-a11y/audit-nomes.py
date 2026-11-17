#!/usr/bin/env python3
"""QA a11y — nomes acessiveis (via Accessibility tree) + estados ARIA.

Escopo: o conteudo do bloco (palco), nao o shell do catalogo.
Saida: docs/qa-a11y/nomes.json
"""
import asyncio, json, sys
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-a11y/nomes.json"

# Snapshot em JS: percorre a arvore de acessibilidade e devolve
# (role, name, bloco de origem) + estado ARIA por no.
SNAP = r"""
() => {
  const stage = document.querySelector('section.bloco-anim-fade-up') || document.querySelector('section');
  const root = stage ? stage.querySelector('.rounded-\\[var\\(--r-xl\\)\\]') : document.body;
  const scope = root || document.body;
  const nodes = [];
  function walk(el, path) {
    for (const child of el.children) {
      const r = child.getBoundingClientRect();
      const s = getComputedStyle(child);
      const visible = r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      const role = child.getAttribute('role');
      const implicit = {
        BUTTON:'button', A:'link', INPUT:'input', SELECT:'combobox', TEXTAREA:'textbox',
        IMG:'img', H1:'heading', H2:'heading', H3:'heading', H4:'heading', H5:'heading', H6:'heading',
        UL:'list', OL:'list', LI:'listitem', TABLE:'table', TH:'columnheader', TD:'cell',
        FORM:'form', MAIN:'main', NAV:'navigation', HEADER:'banner', FOOTER:'contentinfo',
        ASIDE:'complementary', SECTION:'region', P:'paragraph', LABEL:'label',
        SUMMARY:'button', DETAILS:'group', FIELDSET:'group', LEGEND:'none', OPTION:'option',
        DIALOG:'dialog', PROGRESS:'progressbar', TIME:'time', SPAN:'generic', DIV:'generic',
      }[child.tagName];
      const effective = role || implicit;
      const name = (() => {
        const al = child.getAttribute('aria-label');
        if (al) return al.trim();
        const lb = child.getAttribute('aria-labelledby');
        if (lb) return lb.split(/\s+/).map(id => (document.getElementById(id)||{}).innerText || '').join(' ').trim();
        if (child.tagName === 'INPUT' || child.tagName === 'SELECT' || child.tagName === 'TEXTAREA') {
          if (child.id) {
            const l = document.querySelector(`label[for="${CSS.escape(child.id)}"]`);
            if (l) return l.innerText.trim();
          }
          const wrap = child.closest('label');
          if (wrap) return wrap.innerText.trim();
          const ph = child.getAttribute('placeholder');
          if (ph) return '[PLACEHOLDER] ' + ph.trim();
          const t = child.getAttribute('title');
          if (t) return '[TITLE] ' + t.trim();
          return '';
        }
        if (child.tagName === 'IMG') return child.getAttribute('alt') || '';
        const txt = (child.innerText || '').replace(/\s+/g,' ').trim();
        return txt;
      })();
      if (visible && ['button','link','input','combobox','textbox','switch','checkbox','tab','radio','menuitem','option','img','heading','progressbar','table','list'].includes(effective)) {
        nodes.push({
          role: effective,
          name: name,
          ariaSelected: child.getAttribute('aria-selected'),
          ariaChecked: child.getAttribute('aria-checked'),
          ariaExpanded: child.getAttribute('aria-expanded'),
          ariaCurrent: child.getAttribute('aria-current'),
          ariaHidden: child.getAttribute('aria-hidden'),
          tabindex: child.getAttribute('tabindex'),
          tag: child.tagName,
          cls: child.className.toString().slice(0, 110),
          text: (child.innerText || '').replace(/\s+/g,' ').slice(0, 70),
        });
      }
      walk(child, path + '/' + child.tagName);
    }
  }
  walk(scope, '');
  return nodes;
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
            await page.wait_for_timeout(350)
            # pega a variante padrao (Normal)
            nodes = await page.evaluate(SNAP)
            out[bid] = nodes
            print(bid, len(nodes))
        await browser.close()
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print("gravado", OUT)

asyncio.run(main())
