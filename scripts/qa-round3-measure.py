#!/usr/bin/env python3
"""Rodada 3 - medicao dos 4 desvios corrigidos + regressao."""
import json
import sys
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"

OUT = {}


def sel_block(page, bid):
    page.click(f'button:has-text("{bid}")')
    page.wait_for_timeout(400)


def sel_variant(page, idx):
    btns = page.query_selector_all("section button[role='radio']")
    btns[idx].click()
    page.wait_for_timeout(450)


def outline_of(page):
    return page.evaluate("""()=>{
      const el = document.activeElement;
      if(!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        role: el.getAttribute('role'),
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        outlineOffset: cs.outlineOffset,
        matchesFV: el.matches(':focus-visible'),
        matchesF: el.matches(':focus'),
        w: Math.round(r.width*100)/100,
        h: Math.round(r.height*100)/100,
        text: (el.innerText||'').slice(0,60)
      };
    }""")


def focus_via_keyboard(page, selector, max_tabs=60):
    """Foca o elemento por TECLADO: foca o anterior focavel via JS e da Tab."""
    ok = page.evaluate("""(sel)=>{
      const t = document.querySelector(sel);
      if(!t) return 'alvo-inexistente';
      const focusables = [...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter(e=>e.offsetParent!==null || e===t);
      const i = focusables.indexOf(t);
      if(i<0) return 'nao-focavel';
      const prev = focusables[i-1];
      if(prev) prev.focus();
      t.setAttribute('data-qa-target','1');
      return 'ok';
    }""", selector)
    if ok != 'ok':
        return ok
    for _ in range(max_tabs):
        page.keyboard.press("Tab")
        got = page.evaluate("()=>document.activeElement && document.activeElement.getAttribute('data-qa-target')==='1'")
        if got:
            return "ok"
    return "nao-alcancou"


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        erros = []
        page.on("pageerror", lambda e: erros.append("pageerror: " + str(e)[:200]))
        page.on("console", lambda m: erros.append("console." + m.type + ": " + m.text[:200]) if m.type == "error" else None)
        page.goto(URL, wait_until="networkidle")
        page.wait_for_timeout(1200)

        # ---------- C2(a) TabPanel focus-visible ----------
        sel_block(page, "office-settings")
        sel_variant(page, 1)  # tabs
        res = page.evaluate("""()=>{
          const tp=[...document.querySelectorAll('[role="tabpanel"]')];
          return tp.map(e=>({tabindex:e.getAttribute('tabindex'), cls:(e.className||'').slice(0,160), vis:!!e.offsetParent}));
        }""")
        OUT["C2a_tabpanels"] = res
        r = focus_via_keyboard(page, '[role="tabpanel"]')
        OUT["C2a_focus"] = {"resultado_foco": r, "medido": outline_of(page)}

        # tab trigger (botao da aba) tambem
        r2 = focus_via_keyboard(page, 'button[role="tab"]')
        OUT["C2a_tab_trigger"] = {"resultado_foco": r2, "medido": outline_of(page)}

        # ---------- C2(b) campos de formulario ----------
        campos = {}
        for tag in ["input", "select", "textarea"]:
            sel_block(page, "office-settings")
            sel_variant(page, 1)
            n = page.evaluate(f"()=>document.querySelectorAll('section {tag}').length")
            if n == 0:
                campos[tag] = "ausente no bloco office-settings"
                continue
            rr = focus_via_keyboard(page, f'section {tag}:not([type="hidden"])')
            campos[tag] = {"resultado_foco": rr, "medido": outline_of(page)}
        OUT["C2b_campos"] = campos

        # outros blocos com input
        for bid in ["social-composer", "agenda-board", "leads-board", "consent-panel"]:
            sel_block(page, bid)
            for tag in ["input", "select", "textarea"]:
                n = page.evaluate(f"()=>document.querySelectorAll('section {tag}:not([type=\"hidden\"])').length")
                if n:
                    rr = focus_via_keyboard(page, f'section {tag}:not([type="hidden"])')
                    OUT.setdefault("C2b_outros", {})[f"{bid}:{tag}"] = {"resultado_foco": rr, "medido": outline_of(page)}

        # ---------- C5(a) office-settings cartoes ----------
        c5a = {}
        for w in [768, 1280, 1440, 1920]:
            page.set_viewport_size({"width": w, "height": 900})
            page.wait_for_timeout(250)
            sel_block(page, "office-settings")
            sel_variant(page, 2)  # cards
            page.wait_for_timeout(400)
            m = page.evaluate("""()=>{
              const palco = document.querySelector('section .bloco-scroll.flex-1');
              const root = palco.querySelector('.rounded-\\[var\\(--r-xl\\\]');
              const panels = [...root.querySelectorAll('div')].filter(e=>{
                const cs=getComputedStyle(e);
                return cs.borderTopWidth!=='0px' && e.className.includes('rounded-');
              });
              // cartoes de canal: paineis que contem o texto WhatsApp/Instagram
              const canais=[...root.querySelectorAll('*')].filter(e=>e.textContent.trim()==='WhatsApp'||e.textContent.trim()==='Instagram');
              const cartoes=[...new Set(canais.map(e=>e.closest('div[class*="rounded"]')).filter(Boolean))];
              const info=cartoes.map(c=>({
                label:(c.querySelector('.bloco-headline')||{}).textContent,
                sw:c.scrollWidth, cw:c.clientWidth, over:c.scrollWidth-c.clientWidth,
                rect:(()=>{const r=c.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}})()
              }));
              // bounding box dos textos para detectar sobreposicao
              const textos=[...root.querySelectorAll('*')].filter(e=>['WhatsApp','Instagram'].includes(e.textContent.trim()) && e.children.length===0).map(e=>{
                const r=e.getBoundingClientRect(); return {t:e.textContent.trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};
              });
              const docOver=document.documentElement.scrollWidth-window.innerWidth;
              return {cartoes:info, textos, docOver, docSW:document.documentElement.scrollWidth, docCW:document.documentElement.clientWidth};
            }""")
            c5a[str(w)] = m
            page.screenshot(path=f"/tmp/qa3-office-cards-{w}.png", full_page=False)
        OUT["C5a"] = c5a

        # ---------- C5(b) social-composer 390 ----------
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(300)
        sel_block(page, "social-composer")
        sel_variant(page, 0)  # composer
        page.wait_for_timeout(400)
        c5b = page.evaluate("""()=>{
          const out=[];
          const spans=[...document.querySelectorAll('section span')];
          for(const s of spans){
            const cs=getComputedStyle(s);
            if(cs.textOverflow==='ellipsis'){
              const p=s.parentElement;
              out.push({
                texto:(s.textContent||'').slice(0,60),
                spanW:Math.round(s.getBoundingClientRect().width*100)/100,
                paiTag:p.tagName,
                paiW:Math.round(p.getBoundingClientRect().width*100)/100,
                paiCls:(p.className||'').slice(0,120),
                paiTrunc:getComputedStyle(p).textOverflow,
                paiScroll:p.scrollWidth, paiClient:p.clientWidth,
                paiOverflow:p.scrollWidth-p.clientWidth,
                sobrepoePai: s.getBoundingClientRect().right > p.getBoundingClientRect().right+0.5
              });
            }
          }
          // rotulo IMAGEM
          const labels=[...document.querySelectorAll('section *')].filter(e=>e.children.length===0 && /IMAGEM/i.test(e.textContent||'')).map(e=>{
            const r=e.getBoundingClientRect(); return {t:e.textContent.trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};
          });
          const docSW=document.documentElement.scrollWidth, docCW=document.documentElement.clientWidth;
          return {truncados:out, labels, docOver:docSW-docCW, docSW, docCW};
        }""")
        OUT["C5b"] = c5b
        page.screenshot(path="/tmp/qa3-social-composer-390.png", full_page=False)

        OUT["erros_console"] = erros
        browser.close()


run()
print(json.dumps(OUT, indent=2, ensure_ascii=False))
