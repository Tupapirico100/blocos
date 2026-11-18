#!/usr/bin/env python3
"""Rodada 3 - parte 5: foco do TabPanel do bloco + reduced-motion (loading) pontual."""
import json
import subprocess
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
OUT = {}

BLOCOS = dict(json.loads(subprocess.run(
    ["node", "-e", "import('./packages/blocks/dist/catalog.js').then(m=>console.log(JSON.stringify(m.BLOCO_CATALOG.map(e=>[e.id,e.recipe.variants.map(v=>v.id)]))))"],
    cwd="/workspace/blocos", capture_output=True, text=True).stdout))


def med(page):
    return page.evaluate("""()=>{
      const el=document.activeElement; if(!el) return None;
      const cs=getComputedStyle(el);
      return {tag:el.tagName, role:el.getAttribute('role'), id:el.id||'',
              text:(el.innerText||'').trim().slice(0,40),
              outlineStyle:cs.outlineStyle, outlineWidth:cs.outlineWidth,
              outlineColor:cs.outlineColor, outlineOffset:cs.outlineOffset,
              matchesFV:el.matches(':focus-visible'), matchesF:el.matches(':focus'),
              accentVar:cs.getPropertyValue('--accent').trim()};
    }""")


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1200)

    # ---- TabPanel do bloco office-settings (variante tabs) ----
    page.click("aside button:has-text('office-settings')")
    page.wait_for_timeout(500)
    btns = page.query_selector_all("section button[role='radio']")
    btns[1].click()  # variante "tabs"
    page.wait_for_timeout(600)

    triggers = page.query_selector_all("section button[role='tab']")
    OUT["n_tab_triggers"] = len(triggers)
    # clica no ULTIMO trigger e da Tab -> deve cair no tabpanel
    triggers[len(triggers) - 1].click()
    page.wait_for_timeout(300)
    page.keyboard.press("Tab")
    page.wait_for_timeout(300)
    OUT["tabpanel_foco_apos_Tab"] = med(page)
    OUT["tabpanel_scrollIntoView"] = page.evaluate("""()=>{
      const e=document.activeElement;
      const r=e.getBoundingClientRect();
      return {role:e.getAttribute('role'), id:e.id, tabindex:e.getAttribute('tabindex'),
              w:Math.round(r.width), h:Math.round(r.height)};
    }""")
    # trigger focado por teclado
    page.evaluate("""()=>{const t=document.querySelector('section button[role="tab"]'); t.focus();}""")
    page.keyboard.press("Shift+Tab")
    page.keyboard.press("Tab")
    page.wait_for_timeout(250)
    OUT["tab_trigger_foco_teclado"] = med(page)

    # ---- reduced motion: estado Carregando ----
    def estado_loading(bid):
        page.click("aside button:has-text('" + bid + "')")
        page.wait_for_timeout(500)
        st = page.query_selector_all("section button[role='radio']")
        nvar = len(BLOCOS[bid])
        st[nvar + 1].click()   # 0..nvar-1 variantes; nvar=success, nvar+1=loading
        page.wait_for_timeout(600)

    def amostra():
        return page.evaluate("""()=>{
          const out={skeletons:[], spinners:[]};
          for(const el of document.querySelectorAll('section *')){
            const cn=String(el.className||'');
            const cs=getComputedStyle(el);
            const rec={tag:el.tagName, cls:cn.slice(0,90), animationName:cs.animationName,
                       animationDuration:cs.animationDuration,
                       animationIterationCount:cs.animationIterationCount,
                       transitionDuration:cs.transitionDuration};
            if(cn.includes('bloco-skeleton')) out.skeletons.push(rec);
            if(cn.includes('animate-spin')) out.spinners.push(rec);
          }
          return out;
        }""")

    OUT["reduced"] = {}
    for bid in ["office-settings", "auth-login", "leads-board", "social-composer", "payments-checkout"]:
        page.emulate_media(reduced_motion="reduce")
        page.wait_for_timeout(300)
        estado_loading(bid)
        OUT["reduced"][bid] = amostra()
    OUT["normal"] = {}
    for bid in ["office-settings", "auth-login", "leads-board", "social-composer", "payments-checkout"]:
        page.emulate_media(reduced_motion="no-preference")
        page.wait_for_timeout(300)
        estado_loading(bid)
        OUT["normal"][bid] = amostra()

    # ---- inputs crus: foco por teclado (ring) ----
    page.emulate_media(reduced_motion="no-preference")
    OUT["inputs_crus"] = {}
    for bid, sel in [("patients-list", 'section input[type="search"]'),
                     ("inbox-whatsapp", 'section input[type="search"]'),
                     ("auth-two-factor", 'section input[inputmode="numeric"]')]:
        page.click("aside button:has-text('" + bid + "')")
        page.wait_for_timeout(600)
        n = page.evaluate("(s)=>document.querySelectorAll(s).length", sel)
        if n == 0:
            OUT["inputs_crus"][bid] = "seletor ausente"
            continue
        page.evaluate("""(s)=>{const t=document.querySelector(s); t.focus();}""", sel)
        page.keyboard.press("Tab")
        page.keyboard.press("Shift+Tab")
        page.wait_for_timeout(250)
        OUT["inputs_crus"][bid] = {"n": n, "medido": med(page),
                                   "boxShadow": page.evaluate("()=>getComputedStyle(document.activeElement).boxShadow")}

    with open("/tmp/qa3-out5.json", "w") as f:
        json.dump(OUT, f, indent=2, ensure_ascii=False)
    browser.close()

print(json.dumps(OUT, indent=2, ensure_ascii=False))
