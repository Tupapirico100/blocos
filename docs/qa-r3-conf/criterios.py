#!/usr/bin/env python3
"""Rodada 3 (2a passagem) — evidencias dos criterios 1, 2, 4, 5, 6, 10.

C1  botoes: type, nome, alvo (24/32), disabled nao clicavel, variantes
C2  foco: indicador visivel (outline 2px accent offset 2px) + ordem de tabulacao
C4  tipografia: hierarquia headline>body>caption, bloco-micro so como label
C5  ritmo de espacamento (gap na escala canonica)
C6  truncamento: scrollWidth <= clientWidth+2 (exceto truncate/celula/input)
C10 th scope, aria-checked/selected/expanded, html lang
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-r3-conf/criterios.json"
STATES = ["Normal", "Carregando", "Vazio", "Erro", "Sem permissao"]

MARK = """
() => { const s=document.querySelector('section');
  const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
  (box||s).setAttribute('data-qa-stage','1'); return true; }
"""

AUDIT = r"""
() => {
  const scope = document.querySelector('[data-qa-stage]');
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none' && s.opacity!=='0'; };
  const out = { semType:[], semNome:[], alvosPequenos:[], truncados:[], gaps:{}, micro:[],
                thSemScope:[], ariaRuim:[], disabled:[], variantes:{}, fontes:{} };
  for (const el of scope.querySelectorAll('*')) {
    if (!vis(el)) continue;
    const s = getComputedStyle(el);
    const cls = String(el.className);

    // --- C1 botoes
    if (el.tagName === 'BUTTON') {
      if (!el.getAttribute('type')) out.semType.push(cls.slice(0,70));
      let nome = (el.getAttribute('aria-label')||el.getAttribute('title')||el.innerText||'').trim();
      if (!nome && el.getAttribute('aria-labelledby')) {
        const t = document.getElementById(el.getAttribute('aria-labelledby').split(/\s+/)[0]);
        nome = (t?.innerText||t?.textContent||'').trim();
      }
      if (!nome) out.semNome.push({tag:el.tagName, cls:cls.slice(0,70)});
      const r = el.getBoundingClientRect();
      const soIcone = el.querySelector('svg') && !el.innerText.trim();
      const isPrimary = el.dataset.variant === 'primary';
      const min = (soIcone || isPrimary) ? 32 : 24;
      if (r.width < min-0.5 || r.height < min-0.5)
        out.alvosPequenos.push({w:Math.round(r.width),h:Math.round(r.height),min,cls:cls.slice(0,70),nome:nome.slice(0,30)});
      if (el.disabled) out.disabled.push({cls:cls.slice(0,60), op:s.opacity, pe:s.pointerEvents,
        bg:s.backgroundColor, color:s.color, variant:el.dataset.variant});
      const v = el.dataset.variant || '(sem data-variant)';
      out.variantes[v] = (out.variantes[v]||0)+1;
    }

    // --- C6 truncamento
    const temTextoDireto = [...el.childNodes].some(n=>n.nodeType===3 && n.nodeValue.trim().length>1);
    if (temTextoDireto && el.scrollWidth > el.clientWidth + 2) {
      const trunc = s.textOverflow === 'ellipsis' || s.overflowX === 'auto' || s.overflowX === 'scroll';
      const cell = el.closest('td,th');
      const inp = el.closest('input,textarea');
      if (!trunc && !cell && !inp)
        out.truncados.push({tag:el.tagName, cls:cls.slice(0,60), sw:el.scrollWidth, cw:el.clientWidth,
                            txt:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,50)});
    }

    // --- C5 gaps
    if ((s.display==='flex'||s.display==='grid') && s.gap && s.gap!=='normal') {
      const vals = s.gap.split(' ').map(v=>parseFloat(v)*parseFloat(s.rowGap===s.gap?'1':'1'));
      for (const g of s.gap.split(' ')) {
        const n = parseFloat(g);
        if (Number.isFinite(n) && n>0) out.gaps[n] = (out.gaps[n]||0)+1;
      }
    }

    // --- C4 tipografia
    if (temTextoDireto) {
      const fs = parseFloat(s.fontSize);
      out.fontes[s.fontSize] = (out.fontes[s.fontSize]||0)+1;
      if (cls.includes('bloco-micro')) out.micro.push({tag:el.tagName, txt:(el.innerText||'').trim().slice(0,40),
        transform:s.textTransform, fs});
    }

    // --- C10 th scope
    if (el.tagName === 'TH' && !el.getAttribute('scope')) out.thSemScope.push({txt:(el.innerText||'').trim().slice(0,30), cls:cls.slice(0,40)});

    // --- C10 aria
    for (const a of ['aria-checked','aria-selected','aria-expanded']) {
      const v = el.getAttribute(a);
      if (v !== null && !['true','false','mixed'].includes(v)) out.ariaRuim.push({a,v,tag:el.tagName});
    }
  }
  return out;
}
"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await br.new_context(viewport={"width":1440,"height":900})
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(900)
        agg = {"semType":[], "semNome":[], "alvosPequenos":[], "truncados":[], "thSemScope":[],
               "ariaRuim":[], "gaps":{}, "micro":[], "fontes":{}, "variantes":{}, "disabled":[]}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(200)
            for st in STATES:
                await pg.click(f'section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("{st}")')
                await pg.wait_for_timeout(240)
                await pg.evaluate(MARK)
                r = await pg.evaluate(AUDIT)
                for k in ("semType","semNome","alvosPequenos","truncados","thSemScope","ariaRuim","micro","disabled"):
                    for x in r[k]: agg[k].append({**x, "_bloco": bid, "_estado": st})
                for k in ("gaps","fontes","variantes"):
                    for kk,vv in r[k].items(): agg[k][kk] = agg[k].get(kk,0)+vv
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(120)

        # ---- C2 foco: indicador visivel + ordem de tabulacao
        foco = {}
        for bid in BLOCKS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(200)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(220)
            await pg.evaluate("() => { document.querySelector('section [role=radiogroup]:nth-of-type(1)')?.blur(); document.body.focus(); }")
            seq = []
            for _ in range(16):
                await pg.keyboard.press("Tab")
                f = await pg.evaluate("""() => { const el=document.activeElement; if(!el) return null;
                  const s=getComputedStyle(el); const r=el.getBoundingClientRect();
                  const inStage = !!el.closest('[class*="--r-xl"]');
                  return {tag:el.tagName, cls:String(el.className).slice(0,50), name:(el.innerText||el.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim().slice(0,28),
                    ow:s.outlineWidth, oc:s.outlineColor, oo:s.outlineOffset, os:s.outlineStyle,
                    x:Math.round(r.left), y:Math.round(r.top), inStage}; }""")
                if not f or f["tag"] == "BODY": break
                seq.append(f)
            foco[bid] = seq

        # ---- C10 dialog: foco preso, Esc fecha, foco restaurado
        dlg = {}
        await pg.click('aside nav button:has-text("office-team")'); await pg.wait_for_timeout(300)
        await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
        await pg.wait_for_timeout(250)
        dlg['lang'] = await pg.evaluate("() => document.documentElement.lang")
        dlg['ariaModal'] = await pg.evaluate("""() => {
          const b=[...document.querySelectorAll('button')].find(b=>/remover|revogar/i.test(b.innerText));
          if(!b) return {erro:'sem botao'}; b.click(); return {ok:true}; }""")
        await pg.wait_for_timeout(500)
        dlg['dialog'] = await pg.evaluate("""() => {
          const d=document.querySelector('[role="dialog"]');
          if(!d) return {aberto:false};
          return {aberto:true, ariaModal:d.getAttribute('aria-modal'), rotulo:d.getAttribute('aria-labelledby')||d.getAttribute('aria-label'),
                  focoDentro: d.contains(document.activeElement), focoAtual:(document.activeElement?.innerText||document.activeElement?.tagName||'').slice(0,40)}; }""")
        # foco preso: tab 5x dentro do dialog
        dentro = []
        for _ in range(5):
            await pg.keyboard.press("Tab")
            dentro.append(await pg.evaluate("() => { const d=document.querySelector('[role=\"dialog\"]'); return d ? d.contains(document.activeElement) : null; }"))
        dlg['focoPreso'] = dentro
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(500)
        dlg['apósEsc'] = await pg.evaluate("""() => ({ dialog: !!document.querySelector('[role="dialog"]'),
          foco:(document.activeElement?.innerText||document.activeElement?.tagName||'').replace(/\\s+/g,' ').trim().slice(0,40) })""")

        await br.close()

    out = {"agg": agg, "foco": foco, "dialog": dlg}
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    print("="*90); print("C1 — BOTOES"); print("="*90)
    print(f"  <button> sem type: {len(agg['semType'])}")
    print(f"  botoes sem nome acessivel: {len(agg['semNome'])}")
    print(f"  alvos abaixo do minimo (24 / 32 p/ icone ou primario): {len(agg['alvosPequenos'])}")
    for x in agg["alvosPequenos"][:10]: print("    ", x)
    print(f"  botoes disabled: {len(agg['disabled'])}  (amostra: {agg['disabled'][0] if agg['disabled'] else None})")
    print(f"  variantes usadas: {agg['variantes']}")

    print(); print("="*90); print("C2 — FOCO"); print("="*90)
    semFoco = []
    ordemRuim = []
    total = 0
    for bid, seq in foco.items():
        prev = None
        for f in seq:
            total += 1
            ok = (f["ow"] not in ("0px","") and f["os"] != "none" and f["oc"] != "rgba(0, 0, 0, 0)")
            if not ok: semFoco.append((bid, f))
            if f["inStage"] and prev and f["inStage"]:
                if f["y"] < prev["y"] - 6:
                    ordemRuim.append((bid, prev, f))
                prev = f
            elif f["inStage"]:
                prev = f
    print(f"  focaveis percorridos: {total}")
    print(f"  sem indicador de foco visivel: {len(semFoco)}")
    for x in semFoco[:8]: print("    ", x)
    print(f"  inversoes de ordem de tabulacao (y diminui): {len(ordemRuim)}")
    for x in ordemRuim[:8]: print("    ", x[0], x[1]["name"], "->", x[2]["name"], x[1]["y"], x[2]["y"])
    ex = next(iter(foco.values()))
    print("  exemplo (primeiros 6 focaveis de", next(iter(foco)), "):")
    for f in ex[:6]: print("     ", f["tag"], repr(f["name"]), "outline:", f["ow"], f["oc"], "offset", f["oo"])

    print(); print("="*90); print("C4 — TIPOGRAFIA"); print("="*90)
    print(f"  tamanhos de fonte em uso: {dict(sorted(agg['fontes'].items(), key=lambda x:-int(x[0].split('px')[0])))}")
    print(f"  elementos com bloco-micro: {len(agg['micro'])}")
    naoUpper = [m for m in agg['micro'] if m['transform'] != 'uppercase']
    print(f"  bloco-micro sem uppercase: {len(naoUpper)}")
    for m in naoUpper[:8]: print("    ", m)

    print(); print("="*90); print("C5 — GAP (escala)"); print("="*90)
    print(f"  gaps usados (px): {dict(sorted(agg['gaps'].items()))}")

    print(); print("="*90); print("C6 — TRUNCAMENTO"); print("="*90)
    print(f"  textos cortados sem ellipsis: {len(agg['truncados'])}")
    for x in agg["truncados"][:10]: print("    ", x)

    print(); print("="*90); print("C10 — SEMANTICA"); print("="*90)
    print(f"  <th> sem scope: {len(agg['thSemScope'])}")
    for x in agg["thSemScope"][:8]: print("    ", x)
    print(f"  aria-checked/selected/expanded invalidos: {len(agg['ariaRuim'])}")
    print(f"  html lang: {dlg.get('lang')!r}")
    print(f"  dialog: {json.dumps(dlg, ensure_ascii=False)}")
    print("gravado", OUT)

asyncio.run(main())
