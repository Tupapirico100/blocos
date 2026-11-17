#!/usr/bin/env python3
"""
Contraste REAL renderizado (criterio 3): percorre os blocos nos 3 temas,
compoe o background efetivo (camadas de vidro inclusas) e mede WCAG.
Saida: docs/qa-contraste.json
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path("/workspace/blocos")
CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())

JS = r"""
() => {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r*fg.a + bg.r*(1-fg.a),
    g: fg.g*fg.a + bg.g*(1-fg.a),
    b: fg.b*fg.a + bg.b*(1-fg.a),
    a: fg.a + bg.a*(1-fg.a)
  });
  const lum = (c) => { const f = (v) => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); };
  const ratio = (a,b) => { const l1=lum(a), l2=lum(b); const hi=Math.max(l1,l2), lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); };

  const effBg = (el) => {
    const chain = [];
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) chain.push(n);
    let acc = null;
    for (const n of chain) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) acc = acc ? over(c, acc) : c;
      if (acc && acc.a >= 0.999) break;
    }
    if (!acc || acc.a < 0.999) {
      const base = parse(getComputedStyle(document.body).backgroundColor);
      const html = parse(getComputedStyle(document.documentElement).backgroundColor);
      const b0 = base && base.a > 0 ? base : (html && html.a > 0 ? html : { r:255,g:255,b:255,a:1 });
      acc = acc ? over(acc, b0) : b0;
    }
    return acc;
  };

  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  const seen = new Set();
  while ((node = walker.nextNode())) {
    const txt = (node.nodeValue || '').trim();
    if (txt.length < 2) continue;
    const el = node.parentElement;
    if (!el || !el.getClientRects().length) continue;
    const key = el;
    if (seen.has(key)) continue;
    seen.add(key);
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.opacity === '0') continue;
    const fgRaw = parse(s.color);
    if (!fgRaw) continue;
    const bg = effBg(el);
    const fg = fgRaw.a < 1 ? over(fgRaw, bg) : fgRaw;
    const r = ratio(fg, bg);
    const fs = parseFloat(s.fontSize);
    const bold = parseInt(s.fontWeight, 10) >= 700;
    const grande = fs >= 24 || (bold && fs >= 18.66);
    const min = grande ? 3 : 4.5;
    if (r < min) {
      out.push({
        txt: txt.slice(0, 40),
        cls: String(el.className || '').slice(0, 60),
        ratio: Math.round(r * 100) / 100,
        min,
        fs: Math.round(fs),
        cor: s.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`
      });
    }
  }
  return out;
}
"""

achados = []
resumo = {}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1200)

    for tema in ["Aurora", "Daylight", "Graphite"]:
        page.click(f'button[role="radio"]:has-text("{tema}")')
        page.wait_for_timeout(450)
        for bid in BLOCKS:
            page.click(f'button:has-text("{bid}")')
            page.wait_for_timeout(240)
            res = page.evaluate(JS)
            for r in res:
                achados.append({"tema": tema, "bloco": bid, **r})
        resumo[tema] = len(achados)

    browser.close()

(ROOT / "docs/qa-contraste.json").write_text(
    json.dumps({"total": len(achados), "achados": achados}, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"violacoes de contraste: {len(achados)}")
vistos = set()
for a in achados:
    k = (a["tema"], a["ratio"], a["cor"], a["bg"], a["cls"][:40])
    if k in vistos:
        continue
    vistos.add(k)
    print(f"  [{a['tema']}] {a['bloco']}: {a['ratio']}:1 (min {a['min']}) fs={a['fs']} cor={a['cor']} bg={a['bg']} :: {a['txt']!r} [{a['cls']}]")
    if len(vistos) > 25:
        print("  ...")
        break
