from playwright.async_api import async_playwright
from telegram_logger import send_telegram_message, send_telegram_photo
import os
import asyncio

async def scrape(username, proxy=None):
    try:
        launch_args = {
            "headless": True,
            "args": ["--no-sandbox"]
        }
        if proxy:
            launch_args["proxy"] = {
                "server": f"http://{proxy}"
            }

        async with async_playwright() as p:
            browser = await p.chromium.launch(**launch_args)
            context = await browser.new_context()
            page = await context.new_page()

            url = f"https://www.tiktok.com/@{username}"
            await send_telegram_message(f"🌐 Navigating to <a href='{url}'>{url}</a>")

            await page.goto(url, timeout=20000)
            await page.wait_for_selector('div[data-e2e="user-post-item-list"]', timeout=15000)

            likes_texts = await page.locator('strong[data-e2e="like-count"]').all_inner_texts()
            likes = int(likes_texts[0].replace(",", "")) if likes_texts else 0

            if likes < 100:
                shares = 0
            elif likes < 1000:
                shares = 50
            elif likes < 5000:
                shares = 100
            else:
                shares = 150

            await send_telegram_message(f"✅ {username} has {likes} likes. Will share {shares} times.")

            await browser.close()
            return {"username": username, "likes": likes, "shares": shares}

    except Exception as e:
        screenshot_path = f"screenshots/{username}_error.png"
        os.makedirs("screenshots", exist_ok=True)

        try:
            await page.screenshot(path=screenshot_path)
            await send_telegram_photo(screenshot_path, f"❌ Error for {username}")
        except:
            pass

        await send_telegram_message(f"❌ Scraping error for {username}: <code>{str(e)}</code>")
        return None
