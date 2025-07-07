# index.py

import asyncio
from scrape import scrape
from telegram_logger import send_telegram_message
from proxy_handler import load_proxies, get_valid_proxy
from config import TARGET_USERS, RECHECK_INTERVAL_HOURS

async def main():
    try:
        send_telegram_message("🚀 TikTok bot started.")
        proxies = load_proxies()
        current_proxy = get_valid_proxy(proxies)

        if not current_proxy:
            send_telegram_message("❌ No valid proxy found.")
            return

        send_telegram_message(f"🌐 Using proxy: `{current_proxy}`")

        while True:
            for username in TARGET_USERS:
                try:
                    await scrape(username, current_proxy)
                except Exception as e:
                    send_telegram_message(f"⚠️ Error scraping `{username}`:\n`{e}`")
            await asyncio.sleep(RECHECK_INTERVAL_HOURS * 3600)
    except Exception as e:
        send_telegram_message(f"❌ Bot crashed:\n`{e}`")

if __name__ == "__main__":
    asyncio.run(main())