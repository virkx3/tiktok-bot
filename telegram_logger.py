import requests
import os

# These are set from your bot token and Telegram user ID
BOT_TOKEN = "7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw"
USER_ID = "1098100073"

def send_telegram_message(message):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": USER_ID,
        "text": message,
        "parse_mode": "Markdown"
    }
    try:
        requests.post(url, json=payload, timeout=10)
    except Exception:
        pass

def send_telegram_screenshot(page, caption="Screenshot"):
    try:
        page.screenshot(path="error.png", full_page=True)
        with open("error.png", "rb") as f:
            files = {"photo": f}
            data = {"chat_id": USER_ID, "caption": caption}
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"
            requests.post(url, data=data, files=files, timeout=20)
        os.remove("error.png")
    except Exception:
        pass