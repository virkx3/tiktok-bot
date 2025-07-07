# scrape.py

import asyncio
from playwright.async_api import async_playwright
from telegram_logger import send_telegram_message, send_telegram_photo
from proxy_handler import get_valid_proxy
from share_logic import determine_shares
import traceback

async def scrape(username, proxy):
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                proxy={"server": f"http://{proxy}"} if proxy else None
            )
            context = await browser.new_context()
            page = await context.new_page()

            url = f"https://www.tiktok.com/@{username}"
            await page.goto(url, timeout=30000)
            await page.wait_for_selector('div[data-e2e="user-post-item-list"]', timeout=15000)

            videos = await page.query_selector_all('div[data-e2e="user-post-item-list"] > div')
            send_telegram_message(f"📸 Found {len(videos)} videos for `{username}`")

            for video_div in videos:
                try:
                    href = await video_div.eval_on_selector('a', 'el => el.href')
                    like_elem = await video_div.query_selector('strong[data-e2e="like-count"]')
                    likes = int((await like_elem.inner_text()).replace('K', '000').replace('M', '000000'))
                    shares = determine_shares(likes)
                    send_telegram_message(f"▶️ `{href}` has `{likes}` likes — will share `{shares}` times")
                except Exception as inner_e:
                    continue

            await browser.close()
    except Exception as e:
        error_msg = f"⚠️ Scraping error for `{username}`:\n```{traceback.format_exc()}```"
        send_telegram_message(error_msg[:4000])  # limit to Telegram max length

        try:
            screenshot_path = f"errorshot_{username}.png"
            await page.screenshot(path=screenshot_path)
            send_telegram_photo(screenshot_path, f"🖼️ Screenshot of error on `{username}`")
        except:
            pass

        try:
            await browser.close()
        except:
            pass