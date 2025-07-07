from scrape import scrape
import time
from telegram_logger import send_telegram_message

if __name__ == "__main__":
    send_telegram_message("🚀 TikTok bot container started successfully.")
    while True:
        try:
            scrape()
        except Exception as e:
            send_telegram_message(f"❌ Bot crashed with error: {e}")
        time.sleep(2 * 60 * 60)  # Re-run every 2 hours