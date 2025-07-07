# telegram_logger.py

import requests
import traceback
import time
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID

def send_telegram_message(message: str):
    """Send a plain text message to your Telegram."""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_USER_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        requests.post(url, data=payload)
    except Exception as e:
        print("Failed to send Telegram message:", e)

def send_telegram_photo(photo_path: str, caption: str = ""):
    """Send a photo (like screenshot) to Telegram."""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
        with open(photo_path, 'rb') as photo_file:
            files = {"photo": photo_file}
            data = {
                "chat_id": TELEGRAM_USER_ID,
                "caption": caption
            }
            requests.post(url, files=files, data=data)
    except Exception as e:
        print("Failed to send Telegram photo:", e)

def log_and_alert(error_message: str, screenshot_path: str = None):
    """Log to Telegram and optionally send screenshot."""
    error_text = f"❌ <b>Error</b>\n<pre>{error_message}</pre>"
    send_telegram_message(error_text)

    if screenshot_path:
        send_telegram_photo(screenshot_path, caption="📸 Error Screenshot")

def format_traceback():
    return traceback.format_exc()