import requests
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID

def send_telegram_message(message: str):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_USER_ID,
        "text": message,
        "parse_mode": "HTML",
    }
    try:
        response = requests.post(url, data=payload, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"⚠️ Failed to send Telegram message: {e}")

def send_telegram_photo(photo_path: str, caption: str = ""):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
    try:
        with open(photo_path, "rb") as photo:
            files = {"photo": photo}
            data = {"chat_id": TELEGRAM_USER_ID, "caption": caption}
            response = requests.post(url, files=files, data=data, timeout=10)
            response.raise_for_status()
    except Exception as e:
        print(f"⚠️ Failed to send Telegram photo: {e}")