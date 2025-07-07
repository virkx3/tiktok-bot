# scrape.py

import asyncio
import traceback
import time
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from proxy_handler import get_valid_proxy
from telegram_logger import send_telegram_message, send_telegram_photo
from utils import (
    get_target_usernames, calculate_share_count, log_to_console,
    already_shared_videos, mark_video_shared, wait_with_retries
)

RECHECK_INTERVAL = 2 * 60 * 60  # 2 hours

async def share_video(video_url, share_count, page):
    for i in range(share_count):
        try:
            await page.goto(video_url, timeout=30000)
            await page.wait_for_timeout(3000)
            log_to_console(f"✅ Shared {video_url} ({i+1}/{share_count})")
        except Exception as e:
            log_to_console(f"[!] Failed sharing {video_url}: {e}")
            break

async def scrape():
    while True:
        try:
            proxy = get_valid_proxy()
            proxy_text = proxy if proxy else "None"
            send_telegram_message(f"🌐 Using proxy: {proxy_text}")

            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    proxy={"server": proxy} if proxy else None,
                    headless=True
                )
                context = await browser.new_context()
                page = await context.new_page()

                for username in get_target_usernames():
                    url = f"https://www.tiktok.com/@{username}"
                    try:
                        await page.goto(url, timeout=60000)
                        await page.wait_for_selector("div[data-e2e='user-post-item']", timeout=10000)

                        videos = await page.query_selector_all("div[data-e2e='user-post-item'] a")

                        for video in videos:
                            href = await video.get_attribute("href")
                            video_url = f"https://www.tiktok.com{href}"
                            if already_shared_videos(video_url):
                                continue

                            await page.goto(video_url)
                            await page.wait_for_selector("strong[data-e2e='like-count']", timeout=15000)
                            like_text = await page.locator("strong[data-e2e='like-count']").inner_text()
                            likes = int(like_text.replace('K', '000').replace('M', '000000').replace('.', '').strip())

                            share_count = calculate_share_count(likes)
                            if share_count > 0:
                                await share_video(video_url, share_count, page)
                                mark_video_shared(video_url, share_count)
                                send_telegram_message(f"📢 Shared {video_url} with {share_count} shares.")
                    except PlaywrightTimeoutError:
                        log_to_console(f"[TIMEOUT] Could not load {url}")
                    except Exception as e:
                        log_to_console(f"[ERROR] Exception for {username}: {e}")
                        page_path = f"screenshot_{username}.png"
                        await page.screenshot(path=page_path)
                        send_telegram_photo(page_path, f"❌ Error for {username}")
                await browser.close()

        except Exception as e:
            log_to_console(f"[FATAL] {e}\n{traceback.format_exc()}")
            send_telegram_message(f"❌ Bot crashed:\n<pre>{traceback.format_exc()}</pre>")

        log_to_console(f"⏳ Sleeping {RECHECK_INTERVAL//60} minutes before next round")
        time.sleep(RECHECK_INTERVAL)