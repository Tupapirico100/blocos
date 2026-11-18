#!/usr/bin/env python3
"""Rodada 3 - medicao dos 4 desvios corrigidos + regressao."""
import json
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
DUMP = "/tmp/qa3-out.json"

OUT = {}


def save():
    with open(DUMP, "w") as f:
        json.dump(OUT, f, indent=2, ensure_ascii=False)


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
      if(!el) return None;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName, role: el.getAttribute('role'), id: el.id||'',
        outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor, outlineOffset: cs.outlineOffset,
        matchesFV: el.matches(':focus-visible'), matchesF: el.matches(':focus'),
        w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100,
        text: (el.innerText||'').slice(0,60)
      };
    }""")


def focus_via_keyboard(page, selector, max_tabs=60):
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
        got = page.evaluate("()=>!!document.activeElement && document.activeElement.getAttribute('data-qa-target')==='1'")
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
        OUT["C2a_tabpanels"] = page.evaluate("""()=>[...document.querySelectorAll('[role="tabpanel"]')].map(e=>({
          tabindex:e.getAttribute('tabindex'), cls:(e.className||'').slice(0,200), vis:!!e.offsetParent}))""")
        r = focus_via_keyboard(page, '[role="tabpanel"]')
        OUT["C2a_focus"] = {"resultado_foco": r, "medido": outline_of(page)}
        save()

        r2 = focus_via_keyboard(page, 'button[role="tab"]')
        OUT["C2a_tab_trigger"] = {"resultado_foco": r2, "medido": outline_of(page)}
        save()

        # ---------- C2(b) campos de formulario ----------
        campos = {}
        for bid, vidx, tag in [
            ("office-settings", 1, "input"), ("office-settings", 1, "select"),
            ("office-settings", 1, "textarea"),
            ("agenda-board", 0, "input"), ("agenda-board", 0, "select"),
            ("consent-panel", 0, "input"), ("consent-panel", 0, "select"),
            ("social-composer", 0, "input"), ("social-composer", 0, "textarea"),
            ("patients-list", 0, "input"), ("clinical-entry", 0, "textarea"),
            ("auth-login", 0, "input"), ("payments-checkout", 0, "input"),
        ]:
            sel_block(page, bid)
            sel_variant(page, vidx)
            n = page.evaluate("""(t)=>document.querySelectorAll('section '+t+':not([type="hidden"])').length""", tag)
            if n == 0:
                campos[f"{bid}:{tag}"] = "ausente"
                continue
            rr = focus_via_keyboard(page, f'section {tag}:not([type="hidden"])')
            campos[f"{bid}:{tag}"] = {"resultado_foco": rr, "medido": outline_of(page)}
        OUT["C2b_campos"] = campos
        save()

        # ---------- C5(a) office-settings cartoes ----------
        c5a = {}
        for w in [768, 1280, 1440, 1920]:
            page.set_viewport_size({"width": w, "height": 900})
            page.wait_for_timeout(250)
            sel_block(page, "office-settings")
            sel_variant(page, 2)  # cards
            page.wait_for_timeout(450)
            m = page.evaluate("""()=>{
              const palco = document.querySelector('section .bloco-scroll.flex-1');
              let root=null;
              for(const d of palco.querySelectorAll('div')){
                if((d.className||'').includes('rounded-[var(--r-xl)]')){ root=d; break; }
              }
              if(!root) return {erro:'root nao encontrado'};
              const cartoes=[...root.querySelectorAll('div')].filter(e=>{
                const h=e.querySelector(':scope > div > div > p.bloco-headline');
                return h && (h.textContent.trim()==='WhatsApp'||h.textContent.trim()==='Instagram');
              });
              const info=cartoes.map(c=>{
                const r=c.getBoundingClientRect();
                return {label:c.querySelector('.bloco-headline').textContent.trim(),
                        sw:c.scrollWidth, cw:c.clientWidth, over:c.scrollWidth-c.clientWidth,
                        rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
              });
              const textos=[...root.querySelectorAll('p.bloco-headline')].filter(e=>['WhatsApp','Instagram'].includes(e.textContent.trim())).map(e=>{
                const r=e.getBoundingClientRect(); return {t:e.textContent.trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),right:Math.round(r.right)};});
              return {cartoes:info, textos:textos,
                      docOver:document.documentElement.scrollWidth-window.innerWidth,
                      docSW:document.documentElement.scrollWidth, docCW:document.documentElement.clientWidth};
            }""")
            c5a[str(w)] = m
            page.screenshot(path=f"/tmp/qa3-office-cards-{w}.png")
            save()
        OUT["C5a"] = c5a
        save()

        # ---------- C5(b) social-composer 390 ----------
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(300)
        sel_block(page, "social-composer")
        sel_variant(page, 0)  # composer
        page.wait_for_timeout(450)
        OUT["C5b"] = page.evaluate("""()=>{
          const out=[];
          for(const s of document.querySelectorAll('section span, section div')){
            const cs=getComputedStyle(s);
            if(cs.textOverflow==='ellipsis'){
              const p=s.parentElement;
              const sr=s.getBoundingClientRect(), pr=p.getBoundingClientRect();
              out.push({tag:s.tagName, texto:(s.textContent||'').slice(0,60),
                spanW:Math.round(sr.width*100)/100, spanRight:Math.round(sr.right*100)/100,
                paiTag:p.tagName, paiW:Math.round(pr.width*100)/100, paiRight:Math.round(pr.right*100)/100,
                paiCls:(p.className||'').slice(0,140),
                paiScroll:p.scrollWidth, paiClient:p.clientWidth, paiOverflow:p.scrollWidth-p.clientWidth,
                invadePai: sr.right > pr.right + 0.5});
            }
          }
          const labels=[...document.querySelectorAll('section *')].filter(e=>e.children.length===0 && /IMAGEM/i.test(e.textContent||'')).map(e=>{
            const r=e.getBoundingClientRect(); return {t:e.textContent.trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),right:Math.round(r.right)};});
          const filenames=[...document.querySelectorAll('section *')].filter(e=>e.children.length===0 && /\.(png|jpg|jpeg|webp|mp4|gif)$/i.test(e.textContent.trim())).map(e=>{
            const r=e.getBoundingClientRect(); return {t:e.textContent.trim(),cls:(e.className||'').slice(0,140),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),right:Math.round(r.right)};});
          return {truncados:out, labels, filenames,
                  docOver:document.documentElement.scrollWidth-document.documentElement.clientWidth,
                  docSW:document.documentElement.scrollWidth, docCW:document.documentElement.clientWidth};
        }""")
        page.screenshot(path="/tmp/qa3-social-composer-390.png")
        save()

        OUT["erros_console"] = erros
        save()
        browser.close()


run()
print("OK")
