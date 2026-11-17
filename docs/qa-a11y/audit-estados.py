#!/usr/bin/env python3
"""QA a11y — inventario de estados por bloco + conector (ConnectorLock).

Para cada bloco: troca o seletor de Estado (Normal/Carregando/Vazio/Erro/Sem permissao)
e o botao de conector (Conectado/Desconectado) e registra o que aparece no palco.
Saida: docs/qa-a11y/estados.json
"""
import asyncio, json, re
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"
ROOT = Path("/workspace/blocos")
BLOCKS = json.loads((ROOT / "docs/blocos.json").read_text())
OUT = ROOT / "docs/qa-a11y/estados.json"

PROBE = r"""
() => {
  const stage = document.querySelector('section');
  const box = stage ? [...stage.querySelectorAll('div')].find(d => d.className.toString().includes('--r-xl')) : null;
  const scope = box || stage;
  const t = (scope ? scope.innerText : '').replace(/\s+/g, ' ').trim();
  const skel = scope ? scope.querySelectorAll('.bloco-skeleton').length : 0;
  const lock = t.includes('nao esta conectado') || t.includes('Peca ao dono');
  const alerts = scope ? [...scope.querySelectorAll('[role=alert],[role=status],[aria-live]')].map(e => e.getAttribute('role')||e.getAttribute('aria-live')) : [];
  const btns = scope ? [...scope.querySelectorAll('button')].map(b => (b.innerText||b.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim()).filter(Boolean) : [];
  const inputs = scope ? [...scope.querySelectorAll('input,select,textarea')].length : 0;
  const headings = scope ? [...scope.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName) : [];
  return {
    text: t.slice(0, 320),
    len: t.length,
    skeleton: skel,
    lock,
    live: alerts,
    botoes: btns.slice(0, 8),
    nBotoes: btns.length,
    campos: inputs,
    headings,
    temAcao: btns.length > 0,
  };
}
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1200)
        out = {}
        for bid in BLOCKS:
            await page.click(f'aside nav button:has-text("{bid}")')
            await page.wait_for_timeout(320)
            rec = {"estados": {}, "conector": {}}

            # existe botao de conector?
            temBtnConector = await page.locator('section button:has-text("Conectado")').count() > 0
            rec["temBotaoConector"] = temBtnConector

            for estado in ["Normal", "Carregando", "Vazio", "Erro", "Sem permissao"]:
                await page.click(f'button[role="tab"]:has-text("{estado}")')
                await page.wait_for_timeout(260)
                rec["estados"][estado] = await page.evaluate(PROBE)

            # volta para Normal e testa conector desconectado
            await page.click('button[role="tab"]:has-text("Normal")')
            await page.wait_for_timeout(220)
            if temBtnConector:
                await page.click('section button:has-text("Conectado")')
                await page.wait_for_timeout(320)
                rec["conector"]["desconectado"] = await page.evaluate(PROBE)
                await page.click('section button:has-text("Desconectado")')
                await page.wait_for_timeout(250)
            out[bid] = rec
            print(bid, "ok")
        await browser.close()
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print("gravado", OUT)

asyncio.run(main())
