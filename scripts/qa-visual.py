"""QA visual: percorre todos os blocos do catalogo, captura e reporta erro de console."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path("/workspace/blocos/docs/capturas")
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"

BLOCKS = json.loads(Path("/workspace/blocos/docs/blocos.json").read_text())


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 1500, "height": 950}, device_scale_factor=1)
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append("PAGEERROR: " + str(e)))

        await page.goto("http://localhost:4173/", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        report = []
        for b in BLOCKS:
            errors.clear()
            try:
                await page.click(f'button:has-text("{b}")', timeout=4000)
                await page.wait_for_timeout(450)
                await page.screenshot(path=str(OUT / f"bloco-{b}.png"))
            except Exception as e:
                report.append((b, "FALHA_NAV", str(e)[:120]))
                continue
            # texto visivel do palco
            try:
                txt = await page.inner_text(".bloco-scroll.flex-1")
                empty = "Nada por aqui ainda" in txt or "nenhum" in txt.lower()
                report.append((b, "OK", f"{len(txt)} chars{' | VAZIO?' if empty else ''}"))
            except Exception:
                report.append((b, "SEM_TEXTO", ""))
            real = [e for e in errors if "404" not in e and "favicon" not in e.lower()]
            if real:
                report.append((b, "ERRO_CONSOLE", " | ".join(real[:2])[:200]))

        await browser.close()
        for r in report:
            print(" | ".join(str(x) for x in r))

asyncio.run(main())
