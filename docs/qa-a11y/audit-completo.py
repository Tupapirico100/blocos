#!/usr/bin/env python3
"""QA a11y Blocos — auditoria completa (somente leitura).

Cobre:
  A) nomes acessiveis REAIS via arvore de acessibilidade do Chromium (CDP)
  B) ordem de tabulacao + foco visivel
  C) semantica (headings, th/scope, listas, landmarks, live regions)
  D) movimento (duracoes, prefers-reduced-motion, layout shift)

Saida: docs/qa-a11y/ax.json, tab.json, semantica.json, movimento.json
"""
import asyncio, json, re
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
OUT = ROOT / "docs/qa-a11y"
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())

# ---------------------------------------------------------------- JS helpers
MARK = """
() => {
  const stage = document.querySelector('section');
  const box = stage ? [...stage.querySelectorAll('div')].find(d => d.className.toString().includes('--r-xl')) : null;
  const scope = box || stage || document.body;
  scope.setAttribute('data-qa-stage', '1');
  document.querySelectorAll('[data-qa-stage]').forEach(e => { if (e !== scope) e.removeAttribute('data-qa-stage'); });
  return scope.getAttribute('data-qa-stage');
}
"""

FOCUSABLES = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const sel = 'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"]), [role=button], [role=switch], [role=checkbox], [role=tab], [role=menuitem]';
  const out = [];
  [...scope.querySelectorAll(sel)].forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const visivel = r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
    if (!visivel) return;
    if (el.disabled) return;
    out.push({
      i,
      tag: el.tagName,
      role: el.getAttribute('role'),
      type: el.getAttribute('type'),
      texto: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g,' ').trim().slice(0, 45),
      cls: el.className.toString().slice(0, 60),
      x: Math.round(r.left + window.scrollX), y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width), h: Math.round(r.height),
    });
  });
  return out;
}
"""

FOCUS_STYLE = r"""
() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const s = getComputedStyle(el);
  return {
    tag: el.tagName,
    role: el.getAttribute('role'),
    texto: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g,' ').trim().slice(0,40),
    dentroDoPalco: !!el.closest('[data-qa-stage]'),
    outlineStyle: s.outlineStyle,
    outlineWidth: s.outlineWidth,
    outlineColor: s.outlineColor,
    boxShadow: s.boxShadow && s.boxShadow !== 'none' ? s.boxShadow.slice(0,80) : null,
    borderColor: s.borderColor,
    transitionDuration: s.transitionDuration,
  };
}
"""

SEMANTICA = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const q = (s) => [...scope.querySelectorAll(s)];
  const nomes = (el) => (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,40);
  return {
    headings: q('h1,h2,h3,h4,h5,h6').map(h => h.tagName + ':' + nomes(h)),
    thSemScope: q('th').filter(t => !t.getAttribute('scope')).map(nomes),
    thTotal: q('th').length,
    thRole: q('th').map(t => t.getAttribute('scope') || t.getAttribute('role') || '-'),
    tabelas: q('table').length,
    tabelasSemCaption: q('table').filter(t => !t.querySelector('caption')).length,
    roleTable: q('[role=table],[role=grid],[role=listbox],[role=tree]').map(e => e.getAttribute('role')),
    listas: q('ul,ol').length,
    liSoltos: q('ul,ol > li').length,
    divFocaveis: q('[role=button]:not(button), [onclick]').map(e => e.tagName+':'+nomes(e)),
    liveRegions: q('[aria-live],[role=status],[role=alert],[role=log]').map(e => (e.getAttribute('role')||e.getAttribute('aria-live'))+':'+nomes(e).slice(0,40)),
    ariaHiddenFocavel: q('[aria-hidden="true"]').filter(e => e.matches('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).map(nomes),
    lang: document.documentElement.lang,
    dialogs: q('[role=dialog],dialog').length,
    ariaSelected: q('[role=tab]').map(e => e.getAttribute('aria-selected')),
    ariaChecked: q('[role=switch],[role=checkbox],[role=radio]').map(e => e.getAttribute('aria-checked')),
    ariaExpanded: q('[aria-expanded]').map(e => e.getAttribute('aria-expanded')+':'+nomes(e).slice(0,25)),
    ariaCurrent: q('[aria-current]').length,
    inputsSemNome: q('input,select,textarea').filter(el => {
      const id = el.id;
      const lb = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      const wrap = el.closest('label');
      return !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || lb || wrap);
    }).map(el => el.tagName+':'+(el.getAttribute('placeholder')||el.getAttribute('name')||'?')),
    botoesSoIconeSemNome: q('button').filter(b => {
      const t=(b.innerText||'').trim(); const svg=b.querySelector('svg');
      return !t && svg && !b.getAttribute('aria-label') && !b.getAttribute('title');
    }).length,
    linksSemTexto: q('a[href]').filter(a => !(a.innerText||'').trim() && !a.getAttribute('aria-label')).length,
    imgSemAlt: q('img').filter(i => !i.hasAttribute('alt')).length,
  };
}
"""

MOVIMENTO = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const els = [...scope.querySelectorAll('*')];
  const dur = (v) => Math.max(0, ...String(v||'0s').split(',').map(x => parseFloat(x) * (x.includes('ms')?1:1000)));
  const trans = [], anims = [];
  for (const el of els) {
    const s = getComputedStyle(el);
    const td = dur(s.transitionDuration);
    if (td > 0) trans.push({tag: el.tagName, cls: el.className.toString().slice(0,55), ms: Math.round(td), prop: s.transitionProperty.slice(0,50), timing: s.transitionTimingFunction.slice(0,40)});
    if (s.animationName && s.animationName !== 'none') anims.push({tag: el.tagName, cls: el.className.toString().slice(0,55), name: s.animationName, ms: Math.round(dur(s.animationDuration)), iter: s.animationIterationCount});
  }
  const r = scope.getBoundingClientRect();
  return {
    transicoes: trans.sort((a,b)=>b.ms-a.ms).slice(0, 12),
    nTransOver420: trans.filter(t => t.ms > 420).length,
    animacoes: anims.slice(0, 12),
    animacoesLongas: anims.filter(a => a.ms > 420 && a.iter === '1'),
    altura: Math.round(r.height), largura: Math.round(r.width),
    scrollH: scope.scrollHeight,
  };
}
"""

async def ax_tree(cdp, page):
    """AX tree do palco, via CDP (arvore completa filtrada pelo DOM)."""
    await page.evaluate(MARK)
    doc = await cdp.send("DOM.getDocument", {"depth": -1})
    # localiza o palco e coleta backendNodeIds descendentes
    alvos = set()
    pilha = [(doc["root"], False)]
    while pilha:
        node, dentro = pilha.pop()
        attrs = node.get("attributes", [])
        marca = any(attrs[i] == "data-qa-stage" for i in range(0, len(attrs), 2))
        if marca:
            dentro = True
        if dentro and node.get("backendNodeId"):
            alvos.add(node["backendNodeId"])
        for c in node.get("children", []) or []:
            pilha.append((c, dentro))
    full = await cdp.send("Accessibility.getFullAXTree")
    return [n for n in full["nodes"] if n.get("backendDOMNodeId") in alvos]

def ax_summary(nodes):
    out = []
    for n in nodes:
        role = (n.get("role") or {}).get("value")
        name = (n.get("name") or {}).get("value")
        props = {}
        for p in n.get("properties", []):
            props[p["name"]] = p.get("value", {}).get("value")
        if role in (None, "none", "generic", "InlineTextBox", "StaticText", "text"):
            continue
        out.append({"role": role, "name": name, "props": props})
    return out

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        cdp = await page.context.new_cdp_session(page)
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1200)

        ax_out, sem_out, mov_out, tab_out = {}, {}, {}, {}

        for bid in BLOCKS:
            await page.click(f'aside nav button:has-text("{bid}")')
            await page.wait_for_timeout(340)
            # ---- A) AX tree
            nodes = await ax_tree(cdp, page)
            ax_out[bid] = ax_summary(nodes)
            # ---- C) semantica
            await page.evaluate(MARK)
            sem_out[bid] = await page.evaluate(SEMANTICA)
            # ---- D) movimento
            mov_out[bid] = await page.evaluate(MOVIMENTO)
            # ---- B) tab order + foco
            focusables = await page.evaluate(FOCUSABLES)
            seq = []
            if focusables:
                # foca o primeiro via teclado a partir do elemento anterior
                await page.evaluate("document.querySelector('[data-qa-stage]').focus?.()")
                await page.evaluate("""() => { const s=document.querySelector('[data-qa-stage]');
                    const f=s.querySelector('button,a[href],input,select,textarea');
                    if (f) f.focus(); }""")
                seq.append(await page.evaluate(FOCUS_STYLE))
                for _ in range(min(len(focusables) + 2, 40)):
                    await page.keyboard.press("Tab")
                    s = await page.evaluate(FOCUS_STYLE)
                    if s is None:
                        break
                    if not s["dentroDoPalco"]:
                        break
                    seq.append(s)
            tab_out[bid] = {"focusables": focusables, "sequencia": seq}
            print(bid, "ax", len(ax_out[bid]), "foc", len(seq))

        # ---- ordem inversa (Shift+Tab) em um bloco de referencia
        await page.click('aside nav button:has-text("office-settings")')
        await page.wait_for_timeout(340)
        await page.evaluate(MARK)
        await page.evaluate("""() => { const s=document.querySelector('[data-qa-stage]');
            const f=s.querySelectorAll('button,a[href],input,select,textarea'); f[f.length-1]?.focus(); }""")
        back = []
        for _ in range(6):
            back.append(await page.evaluate(FOCUS_STYLE))
            await page.keyboard.press("Shift+Tab")
        tab_out["_shiftTab"] = back

        await browser.close()

    (OUT / "ax.json").write_text(json.dumps(ax_out, indent=1, ensure_ascii=False), encoding="utf-8")
    (OUT / "semantica.json").write_text(json.dumps(sem_out, indent=1, ensure_ascii=False), encoding="utf-8")
    (OUT / "movimento.json").write_text(json.dumps(mov_out, indent=1, ensure_ascii=False), encoding="utf-8")
    (OUT / "tab.json").write_text(json.dumps(tab_out, indent=1, ensure_ascii=False), encoding="utf-8")
    print("gravado")

asyncio.run(main())
