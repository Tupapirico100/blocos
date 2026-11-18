#!/usr/bin/env python3
"""Rodada 3 - parte 4: classificacao de texto cortado + tabpanel do bloco + reduced-motion pontual."""
import json
import subprocess
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
OUT = {}

BLOCOS = json.loads(subprocess.run(
    ["node", "-e", "import('./packages/blocks/dist/catalog.js').then(m=>console.log(JSON.stringify(m.BLOCO_CATALOG.map(e=>[e.id,e.recipe.variants.map(v=>v.id)]))))"],
    cwd="/workspace/blocos", capture_output=True, text=True).stdout)


def sel_block(page, bid):
    sb = page.query_selector("aside button:has-text('" + bid + "')")
    if sb and sb.is_visible():
        sb.click()
    else:
        page.select_option('select[aria-label="Escolher bloco"]', bid)
    page.wait_for_timeout(400)


def sel_variant(page, idx):
    btns = page.query_selector_all("section button[role='radio']")
    btns[idx].click()
    page.wait_for_timeout(400)


def focus_kb(page, selector, max_tabs=80):
    ok = page.evaluate("""(sel)=>{
      const t=document.querySelector(sel); if(!t) return 'alvo-inexistente';
      const f=[...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter(e=>e.offsetParent!==null||e===t);
      const i=f.indexOf(t); if(i<0) return 'nao-focavel';
      if(f[i-1]) f[i-1].focus();
      t.setAttribute('data-qa-target','1'); return 'ok';
    }""", selector)
    if ok != 'ok':
        return ok
    for _ in range(max_tabs):
        page.keyboard.press("Tab")
        if page.evaluate("()=>!!document.activeElement&&document.activeElement.getAttribute('data-qa-target')==='1'"):
            return "ok"
    return "nao-alcancou"


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1200)

    # ---------- 1. classificacao do texto cortado ----------
    cortados = []
    for bid, variantes in BLOCOS:
        sel_block(page, bid)
        for vi, v in enumerate(variantes):
            sel_variant(page, vi)
            r = page.evaluate("""()=>{
              const out=[];
              const palco=document.querySelector('section .bloco-scroll.flex-1');
              if(!palco) return out;
              for(const el of palco.querySelectorAll('*')){
                if(el.children.length>0) continue;
                const t=(el.textContent||'').trim(); if(!t) continue;
                const cs=getComputedStyle(el);
                if(cs.display==='inline') continue;
                if(el.scrollWidth <= el.clientWidth+2) continue;
                out.push({
                  t:t.slice(0,40), tag:el.tagName, sw:el.scrollWidth, cw:el.clientWidth,
                  textOverflow:cs.textOverflow, overflowX:cs.overflowX,
                  srOnly:(el.className||'').includes('sr-only'),
                  truncClass:(el.className||'').includes('truncate'),
                  inTable:!!el.closest('table'), isField:/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName),
                  title:el.getAttribute('title')
                });
              }
              return out;
            }""")
            for rec in r:
                rec["bloco"] = f"{bid}/{v}"
                cortados.append(rec)
    OUT["cortados_total"] = len(cortados)
    sem_ellipsis_sem_title = []
    for rec in cortados:
        ok = rec["srOnly"] or rec["truncClass"] or rec["inTable"] or rec["isField"] or rec["title"]
        if not ok:
            sem_ellipsis_sem_title.append(rec)
    OUT["cortados_sem_ellipsis_sem_table_sem_title"] = sem_ellipsis_sem_title
    OUT["categorias"] = {}
    for rec in cortados:
        cat = ("sr-only" if rec["srOnly"] else
               "truncate" if rec["truncClass"] else
               "table" if rec["inTable"] else
               "campo" if rec["isField"] else
               "com-title" if rec["title"] else "REAL")
        OUT["categorias"][cat] = OUT["categorias"].get(cat, 0) + 1

    # ---------- 2. TabPanel do proprio bloco (office-settings / abas) ----------
    sel_block(page, "office-settings")
    sel_variant(page, 1)  # tabs
    page.wait_for_timeout(400)
    tp = page.evaluate("""()=>{
      const list=[...document.querySelectorAll('section [role="tabpanel"]')].filter(e=>e.offsetParent!==null);
      return list.map(e=>({id:e.id, tabindex:e.getAttribute('tabindex'), cls:(e.className||'')}));
    }""")
    OUT["tabpanels_visiveis_no_bloco"] = tp
    r = focus_kb(page, 'section [role="tabpanel"]')
    OUT["tabpanel_foco"] = {"resultado": r, "medido": page.evaluate("""()=>{
      const el=document.activeElement; if(!el) return None;
      const cs=getComputedStyle(el);
      return {tag:el.tagName, role:el.getAttribute('role'), id:el.id,
              outlineStyle:cs.outlineStyle, outlineWidth:cs.outlineWidth, outlineColor:cs.outlineColor,
              outlineOffset:cs.outlineOffset, matchesFV:el.matches(':focus-visible'),
              matchesFocus:el.matches(':focus'),
              accentToken:cs.getPropertyValue('--accent').trim()};
    }""")}
    # trigger da aba
    r2 = focus_kb(page, 'section button[role="tab"]')
    OUT["tab_trigger_foco"] = {"resultado": r2, "medido": page.evaluate("""()=>{
      const el=document.activeElement; if(!el) return None;
      const cs=getComputedStyle(el);
      return {tag:el.tagName, role:el.getAttribute('role'), text:(el.innerText||'').slice(0,30),
              outlineStyle:cs.outlineStyle, outlineWidth:cs.outlineWidth, outlineColor:cs.outlineColor,
              outlineOffset:cs.outlineOffset, matchesFV:el.matches(':focus-visible')};
    }""")}

    # ---------- 3. prefers-reduced-motion: skeleton e spinner ----------
    page.emulate_media(reduced_motion="reduce")
    page.wait_for_timeout(400)
    rm = {}
    for bid in ["office-settings", "auth-login", "leads-board", "social-composer"]:
        sel_block(page, bid)
        st = page.query_selector_all("section button[role='radio']")
        nvar = len(dict(BLOCOS)[bid])
        if nvar < len(st):
            st[nvar].click()   # estado "Carregando"
            page.wait_for_timeout(500)
        rm[bid] = page.evaluate("""()=>{
          const out={skeletons:[], spinners:[]};
          for(const el of document.querySelectorAll('section *')){
            const cs=getComputedStyle(el);
            const rec={tag:el.tagName, cls:String(el.className||'').slice(0,110),
                       animationName:cs.animationName, animationDuration:cs.animationDuration,
                       animationIterationCount:cs.animationIterationCount, transitionDuration:cs.transitionDuration};
            if(String(el.className||'').includes('bloco-skeleton')) out.skeletons.push(rec);
            if(String(el.className||'').includes('animate-spin')) out.spinners.push(rec);
          }
          return out;
        }""")
    OUT["reduced_motion"] = rm
    # modo normal, para contraste
    page.emulate_media(reduced_motion="no-preference")
    page.wait_for_timeout(300)
    sel_block(page, "office-settings")
    st = page.query_selector_all("section button[role='radio']")
    st[len(dict(BLOCOS)["office-settings"])].click()
    page.wait_for_timeout(500)
    OUT["normal_motion"] = page.evaluate("""()=>{
      const out={skeletons:[], spinners:[]};
      for(const el of document.querySelectorAll('section *')){
        const cs=getComputedStyle(el);
        const rec={cls:String(el.className||'').slice(0,110), animationName:cs.animationName,
                   animationDuration:cs.animationDuration, animationIterationCount:cs.animationIterationCount};
        if(String(el.className||'').includes('bloco-skeleton')) out.skeletons.push(rec);
        if(String(el.className||'').includes('animate-spin')) out.spinners.push(rec);
      }
      return out;
    }""")

    with open("/tmp/qa3-out4.json", "w") as f:
        json.dump(OUT, f, indent=2, ensure_ascii=False)
    browser.close()

print(json.dumps({k: v for k, v in OUT.items() if k not in ("cortados_total",)}, indent=2, ensure_ascii=False)[:6000])
print("cortados_total:", OUT["cortados_total"], "categorias:", OUT["categorias"])
print("REAL (sem ellipsis/table/title):", OUT["cortados_sem_ellipsis_sem_table_sem_title"])
