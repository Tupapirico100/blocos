#!/usr/bin/env python3
"""
QA automatico da biblioteca Blocos.

Rodar:  python3 scripts/qa-automatic.py
Saida: JSON em docs/qa-resultado.json + resumo no stdout.

Cobre o que da para medir sem opiniao:
  A. fonte   -> hex hardcoded, button sem type, font-size avulso, cobertura de estados/variantes
  B. tokens  -> contraste WCAG por tema
  C. browser -> nome acessivel, type de button, alvo de toque, overflow de texto, foco, alt de img
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path("/workspace/blocos")
URL = "http://localhost:4173"
CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())

findings = []


def add(crit, sev, msg, where=""):
    findings.append({"criterio": crit, "severidade": sev, "msg": msg, "onde": where})


# ---------------------------------------------------------------- A. FONTE
def scan_source():
    files = list((ROOT / "packages").rglob("*.tsx")) + list((ROOT / "packages").rglob("*.ts"))
    for f in files:
        if "node_modules" in f.parts or "dist" in f.parts:
            continue
        rel = f.relative_to(ROOT).as_posix()
        src = f.read_text(encoding="utf-8")
        lines = src.splitlines()

        # A1 - cor hex em className
        for i, ln in enumerate(lines, 1):
            if "className" not in ln:
                continue
            for m in re.finditer(r"#[0-9a-fA-F]{3,8}\b", ln):
                if "gradient" in ln and "aurora" in ln:
                    continue
                add(3, "alto", f"cor hex hardcoded no className: {m.group(0)}", f"{rel}:{i}")

        # A2 - <button sem type (janela de 4 linhas: o atributo pode estar na linha seguinte)
        for i, ln in enumerate(lines, 1):
            if "<button" not in ln:
                continue
            janela = "\n".join(lines[i - 1 : i + 4])
            if "type=" not in janela:
                add(1, "medio", "<button> sem atributo type (vira submit dentro de form)", f"{rel}:{i}")

        # A3 - font-size avulso
        allowed = {"text-[13px]", "text-[12px]", "text-[14px]", "text-[11px]", "text-[16px]",
                   "text-[15px]", "text-[17px]", "text-[10px]", "text-[9px]", "text-[8px]",
                   "text-[20px]", "text-[24px]", "text-[28px]", "text-[32px]"}
        for i, ln in enumerate(lines, 1):
            for m in re.finditer(r"text-\[(\d+)px\]", ln):
                tok = m.group(0)
                if tok not in allowed:
                    add(4, "baixo", f"font-size avulso {tok} (fora da escala)", f"{rel}:{i}")


# ------------------------------------------------------------ B. CONTRASTE
def _rgb(css):
    m = re.match(r"rgba?\(([^)]+)\)", css.strip())
    if not m:
        return None
    p = [x.strip() for x in m.group(1).split(",")]
    r, g, b = (float(p[0]), float(p[1]), float(p[2]))
    a = float(p[3]) if len(p) > 3 else 1.0
    return (r, g, b, a)


def _lum(rgb):
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb[0], rgb[1], rgb[2]
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def _over(fg, bg):
    a = fg[3]
    return (fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1.0)


def _contrast(a, b):
    la, lb = _lum(a), _lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def scan_contrast():
    css = (ROOT / "packages/tokens/src/styles.css").read_text(encoding="utf-8")
    themes = {}
    for name in ["aurora", "daylight", "graphite"]:
        block = re.search(rf"\.bloco-theme-{name}\s*\{{(.*?)\n\}}", css, re.S)
        if not block:
            add(3, "alto", f"tema {name} nao encontrado nos tokens")
            continue
        body = block.group(1)
        base = re.search(r"\.bloco-theme,\s*\.bloco-theme-aurora\s*\{(.*?)\n\}", css, re.S)
        theme = {}
        for src in ([base.group(1)] if base else []) + [body]:
            for m in re.finditer(r"--([a-z0-9-]+):\s*([^;]+);", src):
                theme.setdefault(m.group(1), m.group(2).strip())
        themes[name] = theme

    # resolve var() recursivo
    def resolve(theme, name, depth=0):
        if depth > 8 or name not in theme:
            return None
        val = theme[name]
        if val.startswith("var("):
            inner = val[4:].split(")")[0].strip()
            return resolve(theme, inner, depth + 1)
        if val.startswith("#"):
            h = val.lstrip("#")
            if len(h) == 3:
                h = "".join(c * 2 for c in h)
            return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0)
        return _rgb(val)

    # pares (foreground, background, minimo, rotulo)
    pairs = [
        ("text", "bg", 4.5, "texto principal sobre fundo"),
        ("text", "bg-elevated", 4.5, "texto principal sobre fundo elevado"),
        ("text-secondary", "bg", 4.5, "texto secundario sobre fundo"),
        ("text-secondary", "surface", 4.5, "texto secundario sobre superficie"),
        ("text-muted", "bg", 4.5, "texto muted sobre fundo"),
        ("text-muted", "surface", 4.5, "texto muted sobre superficie"),
        ("text-faint", "bg", 3.0, "texto faint (decorativo) sobre fundo"),
        ("accent-text", "accent", 4.5, "texto do botao primario"),
        ("accent", "bg", 3.0, "acento como elemento de UI"),
        ("success", "success-soft", 4.5, "texto de sucesso"),
        ("warn", "warn-soft", 4.5, "texto de aviso"),
        ("danger", "danger-soft", 4.5, "texto de erro"),
        ("info", "info-soft", 4.5, "texto de info"),
        ("border-strong", "bg", 1.5, "borda de UI (nao-textual)"),
    ]
    for tname, theme in themes.items():
        for fg, bg, minr, label in pairs:
            f, b = resolve(theme, fg), resolve(theme, bg)
            if f is None or b is None:
                continue
            # texto sobre fundo translucido: compoe sobre o bg
            bgc = resolve(theme, "bg") or (0, 0, 0, 1)
            comp = _over(b, bgc) if bg != "bg" else b
            compf = _over(f, comp)
            ratio = _contrast(compf, comp)
            if ratio < minr:
                add(3, "alto" if minr >= 4.5 else "medio",
                    f"contraste {ratio:.2f}:1 (min {minr}) — {label} [tema {tname}]",
                    "packages/tokens/src/styles.css")
    return themes


# ------------------------------------------------------------- C. RECEITAS
def scan_recipes():
    import importlib.util
    dist = ROOT / "packages/blocks/dist/index.js"
    if not dist.exists():
        add(7, "alto", "packages/blocks/dist ausente — rode npm run build")
        return
    mod = json.loads(subprocess.run(
        ["node", "-e",
         "import('./packages/blocks/dist/index.js').then(m=>console.log(JSON.stringify(m.allRecipes.map(r=>({id:r.id,states:r.states,variants:r.variants.map(v=>v.id),connectors:r.connectors.map(c=>c.id),actions:r.actions.length,ports:r.ports.length,rules:r.rules.length,summary:!!r.summary,origins:r.origins.length})))))"],
        cwd=str(ROOT), capture_output=True, text=True).stdout or "[]")
    for r in mod:
        if len(r["variants"]) < 2:
            add(8, "alto", f"bloco {r['id']} tem {len(r['variants'])} variante(s) (minimo 2)", r["id"])
        for v in r["variants"]:
            if not v.strip():
                add(8, "alto", f"bloco {r['id']} tem variante sem id", r["id"])
        for st in ["loading", "success", "empty", "error", "forbidden"]:
            if st not in r["states"]:
                add(7, "medio", f"bloco {r['id']} nao declara o estado '{st}'", r["id"])
        if not r["actions"]:
            add(1, "alto", f"bloco {r['id']} nao expoe acao", r["id"])
        if not r["ports"]:
            add(1, "medio", f"bloco {r['id']} nao declara portas de logica", r["id"])
        if not r["rules"]:
            add(1, "medio", f"bloco {r['id']} nao declara regras de negocio", r["id"])
        if not r["origins"]:
            add(8, "medio", f"bloco {r['id']} nao declara origem", r["id"])


# ------------------------------------------------------------- D. BROWSER
BROWSER_JS = r"""
() => {
  const out = { semNome: [], semType: [], alvosPequenos: [], overflow: [], imgSemAlt: [], semFoco: [] };
  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
  };
  const interativos = document.querySelectorAll("button, a[href], [role=button], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  for (const el of interativos) {
    if (!visivel(el)) continue;
    let nome = (el.getAttribute("aria-label") || el.getAttribute("title") || el.innerText || "").trim();
    if (!nome) {
      const ref = el.getAttribute("aria-labelledby");
      if (ref) {
        const t = document.getElementById(ref.split(/\s+/)[0]);
        nome = (t?.innerText || t?.textContent || "").trim();
      }
    }
    if (!nome && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) {
      const lb = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
      const wrap = el.closest("label");
      if (lb || wrap) nome = (lb?.innerText || wrap?.innerText || "label").trim();
    }
    if (!nome) out.semNome.push({ tag: el.tagName, cls: el.className.toString().slice(0, 90) });
    if (el.tagName === "BUTTON" && !el.getAttribute("type")) out.semType.push(el.className.toString().slice(0, 90));
    const r = el.getBoundingClientRect();
    const soIcone = el.tagName === "BUTTON" && !nome.trim() && !el.querySelector("svg,img") ? false : (el.tagName === "BUTTON" && el.querySelector("svg") && !el.innerText.trim());
    const minimo = 32;  // rubric: 32x32 para controle primario e icone
    if ((r.width < minimo - 0.5 || r.height < minimo - 0.5) && el.tagName !== "A" && el.tagName !== "INPUT" && el.tagName !== "TEXTAREA" && el.tagName !== "SELECT") {
      out.alvosPequenos.push({ tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height), min: minimo, nome: nome.slice(0, 40) });
    }
  }
  // overflow de texto
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const pais = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const el = n.parentElement;
    if (!el || !visivel(el)) continue;
    if (el.closest(".bloco-scroll") || el.classList.contains("truncate")) continue;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") continue;
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) pais.add(el);
  }
  for (const el of pais) {
    out.overflow.push({ tag: el.tagName, cls: el.className.toString().slice(0, 90), sw: el.scrollWidth, cw: el.clientWidth, txt: (el.innerText||"").slice(0, 50) });
  }
  for (const img of document.querySelectorAll("img")) {
    if (!img.hasAttribute("alt")) out.imgSemAlt.push(img.src.slice(0, 60));
  }
  return out;
}
"""

FOCUS_JS = r"""
() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { ok: true, tag: "BODY" };
  const s = getComputedStyle(el);
  const w = parseFloat(s.outlineWidth) || 0;
  const outlineDs = s.outlineStyle !== "none" && s.outlineStyle !== "auto" && w >= 1;
  const uaRing = s.outlineStyle === "auto";
  const shadowVisivel = s.boxShadow && s.boxShadow !== "none" && !/^rgba\(0, 0, 0, 0\)/.test(s.boxShadow);
  const bordaFocada = s.borderColor && s.borderColor !== "rgba(0, 0, 0, 0)" && s.borderWidth !== "0px" && s.borderColor !== s.getPropertyValue("--x");
  return {
    ok: outlineDs || shadowVisivel,
    dsRing: outlineDs,
    uaRing: uaRing,
    tag: el.tagName,
    cls: String(el.className || '').slice(0, 70),
    outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor,
    shadow: (s.boxShadow || "").slice(0, 50)
  };
}
"""


def scan_browser():
    from playwright.async_api import async_playwright

    async def run():
        async with async_playwright() as p:
            browser = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
            page = await browser.new_page(viewport={"width": 1440, "height": 900})
            erros = []
            page.on("pageerror", lambda e: erros.append(str(e)[:160]))
            page.on("console", lambda m: erros.append(m.text[:160]) if m.type == "error" else None)
            await page.goto(URL, wait_until="networkidle")
            await page.wait_for_timeout(1200)

            temas = ["Aurora", "Daylight", "Graphite"]
            for tema in temas:
                await page.click(f'button[role="radio"]:has-text("{tema}")')
                await page.wait_for_timeout(400)

                for bid in BLOCKS:
                    await page.click(f'button:has-text("{bid}")')
                    await page.wait_for_timeout(260)
                    res = await page.evaluate(BROWSER_JS)
                    ctx = f"[{tema}] {bid}"
                    for x in res["semNome"][:3]:
                        add(10, "alto", f"controle sem nome acessivel ({x['tag']})", ctx)
                    for x in res["semType"][:3]:
                        add(1, "medio", f"button sem type ({x})", ctx)
                    for x in res["alvosPequenos"][:3]:
                        sev = "alto" if (x["w"] < 24 or x["h"] < 24) else "medio"
                        add(1, sev, f"alvo pequeno {x['w']}x{x['h']} (min {x.get('min',32)}) — {x['nome']}", ctx)
                    for x in res["overflow"][:3]:
                        add(6, "alto", f"texto cortado sem ellipsis: '{x['txt']}' ({x['sw']}>{x['cw']})", ctx)
                    for x in res["imgSemAlt"][:2]:
                        add(10, "medio", f"img sem alt: {x}", ctx)

                # foco visivel: percorre TODOS os focaveis do bloco selecionado
                for bid in BLOCKS:
                    await page.click(f'button:has-text("{bid}")')
                    await page.wait_for_timeout(220)
                    for _ in range(14):
                        await page.keyboard.press("Tab")
                        f = await page.evaluate(FOCUS_JS)
                        if f.get("tag") in ("BODY", None):
                            continue
                        if not f.get("ok"):
                            add(2, "alto", f"foco SEM indicador visivel em {f.get('tag')} [{f.get('cls')}]", f"[{tema}] {bid}")
                        elif f.get("uaRing"):
                            add(2, "medio", f"foco com anel padrao do navegador (nao o do DS) em {f.get('tag')} [{f.get('cls')}]", f"[{tema}] {bid}")

            # estados: 6 blocos representativos
            for bid in ["leads-board", "inbox-whatsapp", "patients-list", "agenda-board", "social-composer", "integration-manifest"]:
                await page.click(f'button:has-text("{bid}")')
                await page.wait_for_timeout(250)
                for estado in ["Carregando", "Vazio", "Erro", "Sem permissao"]:
                    await page.click(f'button[role="radio"]:has-text("{estado}")')
                    await page.wait_for_timeout(220)
                    res = await page.evaluate(BROWSER_JS)
                    ctx = f"[estado {estado}] {bid}"
                    for x in res["overflow"][:2]:
                        add(6, "medio", f"overflow no estado {estado}: '{x['txt']}'", ctx)
                    for x in res["semNome"][:2]:
                        add(10, "medio", f"controle sem nome no estado {estado}", ctx)
                await page.click('button[role="radio"]:has-text("Normal")')
                await page.wait_for_timeout(200)

            await browser.close()
            reais = [e for e in erros if "404" not in e and "favicon" not in e.lower()]
            if reais:
                add(10, "alto", f"erro de console no catalogo: {reais[:3]}", "runtime")
            return reais

    return asyncio_run(run())


def asyncio_run(coro):
    import asyncio
    return asyncio.run(coro)


if __name__ == "__main__":
    scan_source()
    scan_contrast()
    scan_recipes()
    try:
        scan_browser()
    except Exception as e:
        add(10, "alto", f"falha na varredura de browser: {e}", "scripts/qa-automatic.py")

    por_crit = {}
    for f in findings:
        por_crit.setdefault(f["criterio"], []).append(f)

    relatorio = {
        "total": len(findings),
        "por_criterio": {str(k): len(v) for k, v in sorted(por_crit.items())},
        "findings": findings,
    }
    (ROOT / "docs/qa-resultado.json").write_text(json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TOTAL DE ACHADOS: {len(findings)}")
    for k, v in sorted(por_crit.items()):
        print(f"  criterio {k}: {len(v)}")
    print()
    for f in findings[:60]:
        print(f"  [{f['severidade']:5}] c{f['criterio']} {f['msg']}  @{f['onde']}")
    if len(findings) > 60:
        print(f"  ... +{len(findings)-60} achados no JSON")
