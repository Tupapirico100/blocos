#!/usr/bin/env python3
"""Captura o MESMO bloco nos 3 temas, para comparacao visual de cor."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

URL = "http://localhost:4173"
CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"
OUT = Path("/workspace/blocos/docs/qa-cores")
OUT.mkdir(parents=True, exist_ok=True)
THEMES = ["Aurora", "Daylight", "Graphite"]
BLOCKS = ["auth-login", "inbox-whatsapp", "agenda-board", "follow-up-tasks", "reports-funnel"]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        page = await b.new_page(viewport={"width": 1440, "height": 1200}, device_scale_factor=1)
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1200)
        for theme in THEMES:
            await page.get_by_role("tab", name=theme, exact=True).click()
            await page.wait_for_timeout(400)
            for bid in BLOCKS:
                await page.locator(f'nav button:has-text("{bid}")').first.click()
                await page.wait_for_timeout(700)
                stage = page.locator("section .bloco-scroll").first
                await stage.evaluate("e => e.scrollTop = 0")
                await page.wait_for_timeout(250)
                await page.screenshot(path=str(OUT / f"{bid}-{theme.lower()}.png"))
                print(theme, bid, flush=True)
        await b.close()


asyncio.run(main())
