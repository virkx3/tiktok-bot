import asyncio
import traceback
from playwright.async_api import async_playwright
from telegram_logger import send_telegram_message, send_telegram_photo
from config import TARGET_USERNAMES, CHECK_INTERVAL
from utils import (
    get_videos_from_user,
    calculate_share_count,
    already_shared,
    mark_as_shared,
    save_screenshot,
    get_target_usernames,
)
from proxy_handler import get_valid_proxy


async def share_video(video_url, share_count, page):
    for _ in range(share_count):
        try:
            await page.goto(video_url, timeout=60000)
            await asyncio.sleep(3)
            print(f"✅ Shared {video_url}")
        except Exception as e:
            print(f"⚠️ Failed to share {video_url}: {e}")
            continue


async def scrape():
    while True:
        try:
            proxy = get_valid_proxy()
            if proxy:
                print(f"🌐 Using proxy: {proxy}")
                if "@" in proxy:
                    creds, proxy_url = proxy.split("@")
                    proxy_username, proxy_password = creds.split(":")
                    proxy_url = "socks5://" + proxy_url
                else:
                    proxy_username = proxy_password = None
                    proxy_url = "socks5://" + proxy

                proxy_config = {"server": proxy_url}
                if proxy_username and proxy_password:
                    proxy_config["username"] = str(proxy_username)
                    proxy_config["password"] = str(proxy_password)
            else:
                print("🛑 No valid proxy found. Retrying in 1 minute...")
                await asyncio.sleep(60)
                continue

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True, proxy=proxy_config if proxy else None)
                context = await browser.new_context()
                page = await context.new_page()

                usernames = get_target_usernames()
                for username in usernames:
                    try:
                        print(f"🔍 Checking user: {username}")
                        videos = await get_videos_from_user(page, username)
                        for video in videos:
                            if already_shared(video["id"]):
                                continue

                            share_count = calculate_share_count(video["likes"])
                            if share_count == 0:
                                continue

                            await share_video(video["url"], share_count, page)
                            mark_as_shared(video["id"])

                            msg = f"""
🎯 Video Shared!
👤 User: {username}
❤️ Likes: {video['likes']}
🔗 URL: {video['url']}
📤 Shares: {share_count}
                            """.strip()
                            await send_telegram_message(msg)

                    except Exception as user_error:
                        error_text = f"⚠️ Error processing user {username}:\n{user_error}"
                        print(error_text)
                        screenshot_path = await save_screenshot(page, f"error_{username}.png")
                        await send_telegram_message(error_text)
                        await send_telegram_photo(screenshot_path)

                await browser.close()

        except Exception as e:
            error_text = f"❌ Bot crashed with error:\n{traceback.format_exc()}"
            print(error_text)
            await send_telegram_message(error_text)

        print(f"⏳ Waiting {CHECK_INTERVAL} seconds before next check...")
        await asyncio.sleep(CHECK_INTERVAL)