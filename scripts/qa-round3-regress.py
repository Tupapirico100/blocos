#!/usr/bin/env python3
"""Rodada 3 - regressao completa (overflow, a11y, truncamento, headings, reduced-motion)."""
import json
import subprocess
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
DUMP = "/tmp/qa3-out3.json"
OUT = {"achados": []}

BLOCOS = json.loads(subprocess.run(
    ["node", "-e", "import('./packages/blocks/dist/catalog.js').then(m=>console.log(JSON.stringify(m.BLOCO_CATALOG.map(e=>[e.id,e.recipe.variants.map(v=>v.id)]))))"],
    cwd="/workspace/blocos", capture_output=True, text=True).stdout)


def add(tipo, bloco, detalhe):
    OUT["achados"].append({"tipo": tipo, "bloco": bloco, "detalhe": detalhe})


def sel_block(page, bid):
    sb = page.query_selector("aside button:has-text('" + bid + "')")
    if sb and sb.is_visible():
        sb.click()
    else:
        page.select_option('select[aria-label="Escolher bloco"]', bid)
    page.wait_for_timeout(420)


def sel_variant(page, idx):
    btns = page.query_selector_all("section button[role='radio']")
    btns[idx].click()
    page.wait_for_timeout(420)


def audit(page, bloco, largura):
    """roda dentro da pagina"""
    return page.evaluate("""(largura)=>{
      const out={docOver:0, textosCortados:[], semTitle:[], headings:[], h1:0, unnamed:[]};
      out.docOver = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const palco = document.querySelector('section .bloco-scroll.flex-1');
      if(!palco) return out;
      // headings dentro do bloco
      for(const h of palco.querySelectorAll('h1,h2,h3,h4,h5,h6')){
        out.headings.push(parseInt(h.tagName[1],10));
        if(h.tagName==='H1') out.h1++;
      }
      // texto cortado
      for(const el of palco.querySelectorAll('*')){
        if(el.children.length>0) continue;
        const t=(el.textContent||'').trim();
        if(!t) continue;
        const cs=getComputedStyle(el);
        if(cs.display==='inline') continue;
        const sw=el.scrollWidth, cw=el.clientWidth;
        if(sw > cw + 2){
          const trunc = cs.textOverflow==='ellipsis' && cs.overflowX!=='visible';
          const isTable = !!el.closest('table');
          const isField = /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
          const rec={t:t.slice(0,50), sw, cw, cls:(el.className||'').slice(0,80), trunc, isTable, isField, title:el.getAttribute('title')};
          out.textosCortados.push(rec);
          if(!trunc && !isTable && !isField && !el.getAttribute('title')) out.semTitle.push(rec);
        }
      }
      return out;
    }""", largura)


def ax_names(page):
    sess = page.context.new_cdp_session(page)
    tree = sess.send("Accessibility.getFullAXTree")
    ctrl = {"button", "textbox", "combobox", "checkbox", "radio", "link", "switch", "tab",
            "searchbox", "slider", "spinbutton", "menuitem", "option"}
    bad = []
    for n in tree.get("nodes", []):
        role = (n.get("role") or {}).get("value")
        if role in ctrl:
            name = (n.get("name") or {}).get("value")
            if not name or not str(name).strip():
                bad.append({"role": role, "name": name, "ignored": n.get("ignored")})
    sess.detach()
    return bad


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    erros = []
    page.on("pageerror", lambda e: erros.append("pageerror: " + str(e)[:200]))
    page.on("console", lambda m: erros.append("console." + m.type + ": " + m.text[:200]) if m.type == "error" else None)
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1200)

    # ---------- overflow do documento em 5 larguras, todos os blocos x variantes ----------
    over = {}
    for w in [390, 768, 1280, 1440, 1920]:
        page.set_viewport_size({"width": w, "height": 900})
        page.wait_for_timeout(200)
        worst = []
        for bid, variantes in BLOCOS:
            sel_block(page, bid)
            for vi in range(len(variantes)):
                sel_variant(page, vi)
                m = page.evaluate("()=>document.documentElement.scrollWidth-document.documentElement.clientWidth")
                if m > 0:
                    worst.append({"bloco": bid, "variante": variantes[vi], "over": m})
        over[str(w)] = worst
        if worst:
            add("overflow_documento", str(w), json.dumps(worst[:10]))
    OUT["overflow_por_largura"] = over

    # ---------- truncamento / headings / a11y em 1440 ----------
    page.set_viewport_size({"width": 1440, "height": 900})
    page.wait_for_timeout(200)
    resumo = {}
    unnamed_total = []
    for bid, variantes in BLOCOS:
        sel_block(page, bid)
        for vi, v in enumerate(variantes):
            sel_variant(page, vi)
            r = audit(page, bid, 1440)
            key = f"{bid}/{v}"
            resumo[key] = {"docOver": r["docOver"], "h1": r["h1"], "headings": r["headings"],
                           "cortados": len(r["textosCortados"]), "semTitle": len(r["semTitle"])}
            if r["docOver"] > 0:
                add("overflow_documento", key, r["docOver"])
            if r["h1"] > 1:
                add("h1_multiplo", key, r["h1"])
            hs = r["headings"]
            for a, b in zip(hs, hs[1:]):
                if b - a > 1:
                    add("salto_heading", key, f"{a}->{b}")
            for rec in r["semTitle"]:
                add("texto_cortado_sem_ellipsis_e_sem_title", key, json.dumps(rec, ensure_ascii=False))
            bad = ax_names(page)
            if bad:
                unnamed_total.append({"bloco": key, "sem_nome": bad[:6]})
                add("controle_sem_nome_acessivel", key, json.dumps(bad[:6], ensure_ascii=False))
    OUT["resumo_blocos"] = resumo
    OUT["controles_sem_nome"] = unnamed_total
    OUT["erros_console"] = erros
    if erros:
        add("erro_console", "*", json.dumps(erros[:10]))

    # ---------- prefers-reduced-motion ----------
    page.emulate_media(reduced_motion="reduce")
    page.wait_for_timeout(300)
    rm = []
    for bid, variantes in BLOCOS:
        sel_block(page, bid)
        # estado loading
        st = page.query_selector_all("section button[role='radio']")
        idx = len(variantes)
        if idx < len(st):
            st[idx].click()
            page.wait_for_timeout(420)
        r = page.evaluate("""()=>{
          const out=[];
          for(const el of document.querySelectorAll('section *')){
            const cs=getComputedStyle(el);
            const an=cs.animationName;
            if(an && an!=='none'){
              const cls=(el.className||'')+'';
              out.push({tag:el.tagName, cls:cls.slice(0,120), animationName:an,
                        animationDuration:cs.animationDuration});
            }
          }
          return out;
        }""")
        for it in r:
            rm.append({"bloco": bid, **it})
    OUT["reduced_motion_animacoes_ativas"] = rm
    if rm:
        add("reduced_motion_animacao_ativa", "*", json.dumps(rm[:10], ensure_ascii=False))
    page.emulate_media(reduced_motion="no-preference")

    with open(DUMP, "w") as f:
        json.dump(OUT, f, indent=2, ensure_ascii=False)
    browser.close()

print("achados:", len(OUT["achados"]))
for a in OUT["achados"][:40]:
    print(" ", a["tipo"], a["bloco"], str(a["detalhe"])[:160])
