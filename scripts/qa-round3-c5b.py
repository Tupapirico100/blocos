#!/usr/bin/env python3
"""C5(b) preciso: linha de midia do social-composer a 390px."""
import json
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
OUT = {}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1200)
    page.select_option('select[aria-label="Escolher bloco"]', "social-composer")
    page.wait_for_timeout(700)

    for vi, vname in enumerate(["composer", "split", "preview"]):
        btns = page.query_selector_all("section button[role='radio']")
        btns[vi].click()
        page.wait_for_timeout(500)
        OUT[vname] = page.evaluate("""()=>{
          const linhas=[];
          for(const row of document.querySelectorAll('section div')){
            const cl=(row.className||'');
            if(!cl.includes('bg-surface/50') || !cl.includes('items-center')) continue;
            const nome=row.querySelector('span.truncate');
            const rotulo=row.querySelector('span.bloco-micro');
            if(!nome||!rotulo) continue;
            const nr=nome.getBoundingClientRect(), rr=rotulo.getBoundingClientRect();
            const ncs=getComputedStyle(nome);
            linhas.push({
              nome:(nome.textContent||'').trim(),
              nomeScrollWidth:nome.scrollWidth, nomeClientWidth:nome.clientWidth,
              truncadoVisualmente: nome.scrollWidth > nome.clientWidth,
              textOverflow:ncs.textOverflow, overflowX:ncs.overflowX, whiteSpace:ncs.whiteSpace,
              nomeW:Math.round(nr.width*100)/100, nomeRight:Math.round(nr.right*100)/100,
              rotulo:(rotulo.textContent||'').trim(),
              rotuloW:Math.round(rr.width*100)/100, rotuloLeft:Math.round(rr.left*100)/100, rotuloRight:Math.round(rr.right*100)/100,
              invasao: Math.round((nr.right-rr.left)*100)/100,
              paiRowW:Math.round(row.getBoundingClientRect().width*100)/100,
              rowScroll:row.scrollWidth, rowClient:row.clientWidth, rowOverflow:row.scrollWidth-row.clientWidth
            });
          }
          //画廊 (preview) com truncate
          const galeria=[...document.querySelectorAll('section span.truncate')].map(s=>{
            const r=s.getBoundingClientRect();
            return {t:(s.textContent||'').trim(), w:Math.round(r.width*100)/100, sw:s.scrollWidth, cw:s.clientWidth,
                    truncado:s.scrollWidth>s.clientWidth, paiW:Math.round(s.parentElement.getBoundingClientRect().width*100)/100,
                    paiOverflow:s.parentElement.scrollWidth-s.parentElement.clientWidth,
                    cls:(s.className||'').slice(0,100)};
          });
          return {linhas, galeria,
                  docOver:document.documentElement.scrollWidth-document.documentElement.clientWidth};
        }""")
        page.screenshot(path=f"/tmp/qa3-sc390-{vname}.png")
    browser.close()

print(json.dumps(OUT, indent=2, ensure_ascii=False))
