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
        response = requests.post(url, data=payload)
        response.raise_for_status()
    except Exception as e:
        print(f"Failed to send Telegram message: {e}")

def send_telegram_photo(image_path: str, caption: str = ""):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
        with open(image_path, "rb") as image:
            files = {"photo": image}
            data = {"chat_id": TELEGRAM_USER_ID, "caption": caption}
            response = requests.post(url, files=files, data=data)
            response.raise_for_status()
    except Exception as e:
        print(f"Failed to send Telegram photo: {e}")