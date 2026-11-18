#!/usr/bin/env python3
"""Rodada 3 - parte 2: C5(a)/C5(b) com selecao correta de bloco + regressoes."""
import json
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
DUMP = "/tmp/qa3-out2.json"
OUT = {}


def save():
    with open(DUMP, "w") as f:
        json.dump(OUT, f, indent=2, ensure_ascii=False)


def sel_block(page, bid):
    # sidebar visivel apenas >= md; abaixo disso usa o <select> de navegacao
    sb = page.query_selector("aside button:has-text('" + bid + "')")
    if sb and sb.is_visible():
        sb.click()
    else:
        page.select_option('select[aria-label="Escolher bloco"]', bid)
    page.wait_for_timeout(500)


def sel_variant(page, idx):
    btns = page.query_selector_all("section button[role='radio']")
    btns[idx].click()
    page.wait_for_timeout(500)


def outline_of(page):
    return page.evaluate("""()=>{
      const el=document.activeElement; if(!el) return None;
      const cs=getComputedStyle(el); const r=el.getBoundingClientRect();
      return {tag:el.tagName, role:el.getAttribute('role'), id:el.id||'',
        outlineStyle:cs.outlineStyle, outlineWidth:cs.outlineWidth, outlineColor:cs.outlineColor,
        outlineOffset:cs.outlineOffset, boxShadow:cs.boxShadow,
        matchesFV:el.matches(':focus-visible'),
        w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100};
    }""")


def focus_via_keyboard(page, selector, max_tabs=80):
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
    erros = []
    page.on("pageerror", lambda e: erros.append("pageerror: " + str(e)[:200]))
    page.on("console", lambda m: erros.append("console." + m.type + ": " + m.text[:200]) if m.type == "error" else None)
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1200)

    # ---------------- C5(a) ----------------
    c5a = {}
    for w in [768, 1280, 1440, 1920]:
        page.set_viewport_size({"width": w, "height": 900})
        page.wait_for_timeout(250)
        sel_block(page, "office-settings")
        sel_variant(page, 2)  # cards
        page.wait_for_timeout(400)
        c5a[str(w)] = page.evaluate("""()=>{
          const palco=document.querySelector('section .bloco-scroll.flex-1');
          let root=null;
          for(const d of palco.querySelectorAll('div')){ if((d.className||'').includes('rounded-[var(--r-xl)]')){root=d;break;} }
          const canais=[...root.querySelectorAll('[data-tone]')].filter(e=>{
            const h=e.querySelector('p.bloco-headline'); return h&&['WhatsApp','Instagram'].includes(h.textContent.trim());});
          const info=canais.map(c=>{const r=c.getBoundingClientRect();
            return {label:c.querySelector('p.bloco-headline').textContent.trim(),
                    scrollWidth:c.scrollWidth, clientWidth:c.clientWidth, over:c.scrollWidth-c.clientWidth,
                    rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),right:Math.round(r.right),bottom:Math.round(r.bottom)}};});
          // texto e badge dentro de cada cartao, para checar sobreposicao
          const det=canais.map(c=>[...c.querySelectorAll('p.bloco-headline,p.bloco-caption,span,button')].map(e=>{
            const r=e.getBoundingClientRect(); return {t:(e.textContent||'').trim().slice(0,40),x:Math.round(r.x),y:Math.round(r.y),right:Math.round(r.right),bottom:Math.round(r.bottom)};}));
          const txt=[...root.querySelectorAll('p.bloco-headline')].filter(e=>['WhatsApp','Instagram'].includes(e.textContent.trim())).map(e=>{
            const r=e.getBoundingClientRect(); return {t:e.textContent.trim(),x:Math.round(r.x),y:Math.round(r.y),right:Math.round(r.right),bottom:Math.round(r.bottom)};});
          // sobreposicao entre os dois cartoes?
          const boxes=info.map(i=>i.rect);
          let overlap=null;
          if(boxes.length===2){const a=boxes[0],b=boxes[1];
            overlap=!(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y);}
          return {cartoes:info, detalhe:det, textos:txt, cartoes_sobrepostos:overlap,
                  docOver:document.documentElement.scrollWidth-document.documentElement.clientWidth,
                  docSW:document.documentElement.scrollWidth, docCW:document.documentElement.clientWidth};
        }""")
        page.screenshot(path=f"/tmp/qa3-office-cards-{w}.png")
        save()
    OUT["C5a"] = c5a

    # ---------------- C5(b) 390 ----------------
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(300)
    sel_block(page, "social-composer")
    sel_variant(page, 0)
    page.wait_for_timeout(450)
    OUT["C5b"] = page.evaluate("""()=>{
      const trunc=[];
      for(const s of document.querySelectorAll('section *')){
        const cs=getComputedStyle(s);
        if(cs.textOverflow==='ellipsis' && s.children.length===0){
          const p=s.parentElement, sr=s.getBoundingClientRect(), pr=p.getBoundingClientRect();
          trunc.push({tag:s.tagName, texto:(s.textContent||'').slice(0,70),
            spanW:Math.round(sr.width*100)/100, spanRight:Math.round(sr.right*100)/100,
            paiTag:p.tagName, paiW:Math.round(pr.width*100)/100, paiRight:Math.round(pr.right*100)/100,
            paiScroll:p.scrollWidth, paiClient:p.clientWidth, paiOverflow:p.scrollWidth-p.clientWidth,
            paiCls:(p.className||'').slice(0,150),
            invadePai: sr.right > pr.right+0.5});
        }
      }
      const imgs=[...document.querySelectorAll('section *')].filter(e=>e.children.length===0&&/IMAGEM/i.test(e.textContent||'')).map(e=>{
        const r=e.getBoundingClientRect(); return {t:e.textContent.trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),right:Math.round(r.right),bottom:Math.round(r.bottom)};});
      const files=[...document.querySelectorAll('section *')].filter(e=>e.children.length===0&&/\.(png|jpe?g|webp|mp4|gif)$/i.test((e.textContent||'').trim())).map(e=>{
        const r=e.getBoundingClientRect(); return {t:e.textContent.trim(),cls:(e.className||'').slice(0,150),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),right:Math.round(r.right)};});
      return {truncados:trunc, rotuloIMAGEM:imgs, arquivos:files,
              docOver:document.documentElement.scrollWidth-document.documentElement.clientWidth,
              docSW:document.documentElement.scrollWidth, docCW:document.documentElement.clientWidth};
    }""")
    page.screenshot(path="/tmp/qa3-social-composer-390.png")
    save()

    # ---------------- regressao: 3 inputs crus ----------------
    page.set_viewport_size({"width": 1440, "height": 900})
    page.wait_for_timeout(250)
    crus = {}
    for bid, vi, sel in [("patients-list", 0, 'section input[type="search"]'),
                         ("inbox-whatsapp", 0, 'section input[type="search"]'),
                         ("auth-two-factor", 0, "section input")]:
        try:
            sel_block(page, bid)
        except Exception as e:
            crus[bid] = "bloco ausente: " + str(e)[:60]
            continue
        n = page.evaluate("(s)=>document.querySelectorAll(s).length", sel)
        if n == 0:
            crus[bid] = "seletor ausente"
            continue
        rr = focus_via_keyboard(page, sel)
        crus[bid] = {"resultado_foco": rr, "medido": outline_of(page)}
    OUT["inputs_crus"] = crus
    save()

    OUT["erros_console"] = erros
    save()
    browser.close()

print("OK")
