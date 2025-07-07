# index.py

import asyncio
from scrape import scrape
from telegram_logger import send_telegram_message, send_telegram_photo

async def main():
    try:
        await scrape()
    except Exception as e:
        error_message = f"❌ Bot crashed with error:\n{str(e)}"
        await send_telegram_message(error_message)

        # Take screenshot on crash
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto("https://www.tiktok.com", timeout=15000)
                await page.screenshot(path="error.png")
                await send_telegram_photo("error.png", caption="📸 Error Screenshot")
                await browser.close()
        except Exception as inner_e:
            await send_telegram_message(f"⚠️ Failed to take screenshot: {inner_e}")

if __name__ == "__main__":
    asyncio.run(main())