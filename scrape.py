import json
import time
from playwright.sync_api import sync_playwright
from utils import (
    get_target_usernames,
    load_shared_counts,
    save_shared_counts,
    calculate_share_count,
    get_video_urls,
)
from proxy_handler import get_valid_proxy
from telegram_logger import send_telegram_message, send_telegram_screenshot


def share_video(page, video_url, count):
    try:
        page.goto(video_url, timeout=60000)
        time.sleep(5)
        for _ in range(count):
            try:
                page.click('button[aria-label="Share"]')
                time.sleep(1)
            except:
                continue
        return True
    except Exception as e:
        return False


def scrape():
    shared_counts = load_shared_counts()
    usernames = get_target_usernames()

    with sync_playwright() as p:
        for username in usernames:
            proxy = get_valid_proxy()
            if proxy:
                proxy_config = {
                    "server": f"{proxy['ip']}:{proxy['port']}",
                    "username": proxy.get("username"),
                    "password": proxy.get("password"),
                }
            else:
                proxy_config = None

            browser = p.chromium.launch(proxy=proxy_config, headless=True)
            context = browser.new_context()
            page = context.new_page()

            try:
                video_urls = get_video_urls(page, username)
                for url in video_urls:
                    page.goto(url, timeout=60000)
                    time.sleep(3)
                    content = page.content()

                    try:
                        like_text = page.locator('[data-e2e="like-count"]').inner_text()
                        likes = int(like_text.replace('K', '000').replace('.', ''))
                    except:
                        likes = 0

                    if url not in shared_counts:
                        shared_counts[url] = 0

                    new_share_count = calculate_share_count(likes)
                    if new_share_count > shared_counts[url]:
                        share_amount = new_share_count - shared_counts[url]
                        send_telegram_message(f"📹 Sharing {share_amount} times for {url} ({likes} likes)")
                        success = share_video(page, url, share_amount)
                        if success:
                            shared_counts[url] = new_share_count
                        else:
                            send_telegram_screenshot(page, f"❌ Failed to share video: {url}")
                    else:
                        print(f"No additional shares needed for {url}")
            except Exception as e:
                send_telegram_message(f"⚠️ Error scraping @{username}: {e}")
                send_telegram_screenshot(page, "Error Screenshot")
            finally:
                context.close()
                browser.close()

    save_shared_counts(shared_counts)