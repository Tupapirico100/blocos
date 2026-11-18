#!/usr/bin/env python3
"""
Contraste por PIXEL (padrao de ouro do criterio 3).

Para cada texto renderizado:
  1. screenshot com o texto visivel   -> cor do glifo
  2. screenshot com o texto TRANSPARENTE -> cor do fundo real (composto:
     vidro + gradiente aurora + opacidades de estado + backdrop-filter)
  3. no recorte do texto: fundo = mediana dos pixels; glifo = mediana dos
     pixels a >=96% da distancia maxima em relacao ao fundo (ignora antialias)
  4. razao WCAG

Saida: docs/qa-contraste-pixel.json
"""
import json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
import numpy as np
from PIL import Image
from io import BytesIO

ROOT = Path("/workspace/blocos")
CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())

# coleta os nós de texto com retangulo e tamanho de fonte
COLLECT = r"""
() => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const txt = (n.nodeValue || '').trim();
    if (txt.length < 2) continue;
    const el = n.parentElement;
    if (!el || !el.getClientRects().length) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.opacity === '0') continue;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.bottom > innerHeight || r.right > innerWidth || r.top < 0 || r.left < 0) continue;
    // ancestral com scroll/clip que corta o elemento: os pixels nao sao pintados
    // e a medicao sairia inventada
    let clipped = false;
    let anc = el.parentElement;
    while (anc && anc !== document.body) {
      const as = getComputedStyle(anc);
      if (as.overflowX !== 'visible' || as.overflowY !== 'visible') {
        const ar = anc.getBoundingClientRect();
        const fora = r.bottom > ar.bottom + 1 || r.top < ar.top - 1 || r.right > ar.right + 1 || r.left < ar.left - 1;
        if (fora) clipped = true;
        // continua subindo: um ancestral acima pode cortar mesmo que este nao corte
      }
      anc = anc.parentElement;
    }
    if (clipped) continue;
    // encoberto por um overlay (header sticky, dialog): os pixels nao sao os do texto
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx >= 0 && cy >= 0 && cx <= innerWidth && cy <= innerHeight) {
      const top = document.elementFromPoint(cx, cy);
      if (top && top !== el && !el.contains(top) && !top.contains(el)) continue;
    }
    out.push({
      txt: txt.slice(0, 36),
      x: Math.round(r.left), y: Math.round(r.top),
      w: Math.round(Math.min(r.width, innerWidth - r.left)),
      h: Math.round(Math.min(r.height, innerHeight - r.top)),
      fs: parseFloat(s.fontSize),
      bold: parseInt(s.fontWeight, 10) >= 700,
      cls: String(el.className || '').slice(0, 50)
    });
  }
  return out;
}
"""


def lum(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def analisar(img_vis, img_bg, rect):
    x, y, w, h = rect
    W, H = img_vis.size
    x, y = max(0, x), max(0, y)
    w, h = min(w, W - x), min(h, H - y)
    if w < 3 or h < 3:
        return None
    # o recorte precisa caber inteiro na captura: se nao couber, o PIL preenche
    # com preto e a medicao sai inventada
    if x + w > W or y + h > H:
        return None
    box = (x, y, x + w, y + h)
    va = np.asarray(img_vis.crop(box).convert("RGB"), dtype=float).reshape(-1, 3)
    vb = np.asarray(img_bg.crop(box).convert("RGB"), dtype=float).reshape(-1, 3)
    fundo = np.median(vb, axis=0)
    dist = np.sqrt(((va - fundo) ** 2).sum(axis=1))
    mx = dist.max()
    if mx < 12:
        return None  # texto muito claro / invisivel na captura
    nucleo = va[dist >= mx * 0.96]
    if nucleo.shape[0] < 2:
        return None
    glifo = np.median(nucleo, axis=0)
    return fundo, glifo


falhas = []
medicoes = 0
resumo_tema = {}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1200)

    for tema in ["Aurora", "Daylight", "Graphite"]:
        page.click(f'button[role="radio"]:has-text("{tema}")')
        page.wait_for_timeout(500)
        for bid in BLOCKS:
            page.click(f'button:has-text("{bid}")')
            page.wait_for_timeout(320)
            # screenshot 1: normal
            shot1 = page.screenshot()
            # screenshot 2: sem texto (fundo real)
            page.add_style_tag(content="* { color: transparent !important; text-shadow: none !important; }")
            page.wait_for_timeout(120)
            shot2 = page.screenshot()
            page.evaluate("() => document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('color: transparent !important')) s.remove(); })")
            page.wait_for_timeout(80)

            def medir(shot_a, shot_b, itens):
                """devolve (medicoes, falhas) de um conjunto de itens"""
                ia = Image.open(BytesIO(shot_a))
                ib = Image.open(BytesIO(shot_b))
                meds = 0
                fails = []
                for item in itens:
                    r = analisar(ia, ib, (item["x"], item["y"], item["w"], item["h"]))
                    if r is None:
                        continue
                    fundo, glifo = r
                    rt = ratio(glifo, fundo)
                    fs = item["fs"]
                    grande = fs >= 24 or (item["bold"] and fs >= 18.66)
                    minimo = 3.0 if grande else 4.5
                    meds += 1
                    if rt < minimo:
                        fails.append({
                            "tema": tema, "bloco": bid, "txt": item["txt"],
                            "ratio": round(rt, 2), "min": minimo, "fs": fs,
                            "glifo": [int(v) for v in glifo], "fundo": [int(v) for v in fundo],
                            "cls": item["cls"],
                        })
                return meds, fails

            itens = page.evaluate(COLLECT)
            m, f = medir(shot1, shot2, itens)
            medicoes += m
            if f:
                # re-medicao: so conta se falhar de novo (medicao instavel por contencao)
                page.wait_for_timeout(300)
                s1b = page.screenshot()
                page.add_style_tag(content="* { color: transparent !important; text-shadow: none !important; }")
                page.wait_for_timeout(150)
                s2b = page.screenshot()
                page.evaluate("() => document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('color: transparent !important')) s.remove(); })")
                page.wait_for_timeout(100)
                _, f2 = medir(s1b, s2b, itens)
                falhas.extend(f2)
        resumo_tema[tema] = len([f for f in falhas if f["tema"] == tema])
    browser.close()

(ROOT / "docs/qa-contraste-pixel.json").write_text(
    json.dumps({"medicoes": medicoes, "falhas": len(falhas), "detalhe": falhas[:400]}, indent=2, ensure_ascii=False),
    encoding="utf-8")

print(f"medicoes por pixel: {medicoes}")
print(f"violacoes: {len(falhas)}")
print("por tema:", resumo_tema)
vistos = set()
for f in falhas:
    k = (f["tema"], f["ratio"], tuple(f["cls"][:28]))
    if k in vistos:
        continue
    vistos.add(k)
    print(f"  [{f['tema']}] {f['bloco']}: {f['ratio']}:1 (min {f['min']}) fs={f['fs']} glifo={f['glifo']} fundo={f['fundo']} :: {f['txt']!r}")
    if len(vistos) >= 20:
        print("  ...")
        break
