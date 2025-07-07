# telegram_logger.py

import requests

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID

def send_telegram_message(message: str):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_USER_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        requests.post(url, data=payload, timeout=10)
    except Exception as e:
        print(f"[ERROR] Failed to send Telegram message: {e}")

def send_telegram_photo(photo_path: str, caption: str = ""):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
        with open(photo_path, "rb") as photo_file:
            files = {"photo": photo_file}
            data = {"chat_id": TELEGRAM_USER_ID, "caption": caption}
            requests.post(url, files=files, data=data, timeout=10)
    except Exception as e:
        print(f"[ERROR] Failed to send Telegram photo: {e}")