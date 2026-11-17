"""Captura telas do catalogo de blocos para conferencia visual."""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path("/workspace/blocos/docs/capturas")
OUT.mkdir(parents=True, exist_ok=True)

SHOTS = [
    ("01-catalogo", None, "aurora"),
    ("02-leads-board", "leads-board", "aurora"),
    ("03-inbox", "inbox-whatsapp", "aurora"),
    ("04-agenda", "agenda-board", "daylight"),
    ("05-manifesto", "integration-manifest", "aurora"),
    ("06-agent", "agent-console", "graphite"),
]


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path="/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome", args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=2)
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        await page.goto("http://localhost:4173/", wait_until="networkidle")
        await page.wait_for_timeout(1200)

        for name, block_id, theme in SHOTS:
            if block_id:
                await page.click(f'button:has-text("{block_id}")')
                await page.wait_for_timeout(700)
            # troca o tema pelo seletor do topo
            if theme != "aurora":
                await page.click(f'button[role="radio"]:has-text("{theme}")')
                await page.wait_for_timeout(700)
            await page.screenshot(path=str(OUT / f"{name}.png"))
            print("ok", name)

        await browser.close()
        if errors:
            print("ERROS DE CONSOLE:")
            for e in errors[:20]:
                print(" -", e[:300])
        else:
            print("sem erros de console")

asyncio.run(main())
