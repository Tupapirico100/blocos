#!/usr/bin/env python3
"""C2 — o foco esta VISIVEL? (diff de pixel antes/depois do foco).

Para cada controle: screenshot do recorte, sem foco e com foco; compara os
pixels e reporta quantos mudaram e o delta maximo. Mede o indicador EFETIVO
(o que o olho ve), nao so o que o CSS declara.
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
import numpy as np
from PIL import Image
from io import BytesIO

CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
URL = "http://localhost:4173"

CASOS = [
    ("auth-login", "INPUT", "campo de texto (Input do DS)"),
    ("consent-panel", "SELECT", "select (Select do DS)"),
    ("social-composer", "TEXTAREA", "textarea (Textarea do DS)"),
    ("office-team", "BUTTON", "botao (Button do DS)"),
]

async def diff(a, b):
    ia = np.asarray(Image.open(BytesIO(a)).convert("RGB"), dtype=int)
    ib = np.asarray(Image.open(BytesIO(b)).convert("RGB"), dtype=int)
    if ia.shape != ib.shape: return None
    d = np.abs(ia-ib).sum(axis=2)
    return {"pixels": int(d.size), "mudaram": int((d>12).sum()),
            "pct": round(float((d>12).mean()*100),2), "deltaMax": int(d.max())}

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = await br.new_context(viewport={"width":1440,"height":900})
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(900)
        for bid, tag, desc in CASOS:
            await pg.click(f'aside nav button:has-text("{bid}")')
            await pg.wait_for_timeout(300)
            await pg.click('section .sticky [role="radiogroup"] >> nth=1 >> [role="radio"]:has-text("Normal")')
            await pg.wait_for_timeout(280)
            # localiza o 1o controle do tipo pedido dentro do palco
            info = await pg.evaluate("""(tag) => {
              const s=document.querySelector('section');
              const box=[...s.querySelectorAll('div')].find(d=>String(d.className).includes('--r-xl'));
              const scope=box||s;
              const el=[...scope.querySelectorAll('button,input,select,textarea')]
                .find(e=>e.tagName===tag && e.getBoundingClientRect().width>0);
              if(!el) return null;
              el.setAttribute('data-qa-foco','1');
              const r=el.getBoundingClientRect();
              return {cls:String(el.className).slice(0,120), x:r.x, y:r.y, w:r.width, h:r.height};
            }""", tag)
            if not info:
                print(f"  {tag}: nao encontrado em {bid}"); continue
            pad = 10
            clip = {"x":max(0,info["x"]-pad), "y":max(0,info["y"]-pad),
                    "width":min(info["w"]+2*pad, 1440), "height":min(info["h"]+2*pad,900)}
            await pg.evaluate("()=>document.querySelector('[data-qa-foco]')?.blur()")
            await pg.wait_for_timeout(200)
            antes = await pg.screenshot(clip=clip)
            # foca via teclado
            await pg.evaluate("""() => { const el=document.querySelector('[data-qa-foco]');
                el.focus(); }""")
            await pg.evaluate("""() => { const el=document.querySelector('[data-qa-foco]');
                el.classList.add('__f'); }""")
            await pg.keyboard.press("Shift+Tab"); await pg.keyboard.press("Tab")
            await pg.wait_for_timeout(250)
            ativo = await pg.evaluate("() => document.activeElement?.getAttribute('data-qa-foco')==='1'")
            depois = await pg.screenshot(clip=clip)
            d = await diff(antes, depois)
            est = await pg.evaluate("""() => { const el=document.querySelector('[data-qa-foco]');
              const s=getComputedStyle(el);
              return {os:s.outlineStyle, ow:s.outlineWidth, oc:s.outlineColor, oo:s.outlineOffset,
                      bc:s.borderColor, bw:s.borderWidth, shadow:s.boxShadow}; }""")
            print(f"  {tag:8} {bid:16} {desc}")
            print(f"     focado={ativo} | outline={est['os']} {est['ow']} {est['oc']} off {est['oo']} | borda={est['bw']} {est['bc']}")
            print(f"     ring/box-shadow: {est['shadow'][:110]}")
            print(f"     DIFF DE PIXEL: {d}")
            await pg.evaluate("()=>document.querySelector('[data-qa-foco]')?.removeAttribute('data-qa-foco')")
        await br.close()

asyncio.run(main())
