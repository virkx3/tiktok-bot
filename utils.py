import os
import json
import requests
from dotenv import load_dotenv
from datetime import datetime
from playwright.sync_api import Page

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_USER_ID = os.getenv("TELEGRAM_USER_ID")
SHARED_DB_PATH = "shared_videos.json"


def get_target_usernames():
    return ["its.sahiba2233", "iamvirk"]


def already_shared(video_id):
    if not os.path.exists(SHARED_DB_PATH):
        return False
    with open(SHARED_DB_PATH, "r") as f:
        shared_data = json.load(f)
    return video_id in shared_data


def mark_as_shared(video_id, count):
    if os.path.exists(SHARED_DB_PATH):
        with open(SHARED_DB_PATH, "r") as f:
            shared_data = json.load(f)
    else:
        shared_data = {}
    shared_data[video_id] = shared_data.get(video_id, 0) + count
    with open(SHARED_DB_PATH, "w") as f:
        json.dump(shared_data, f)


def get_shared_count(video_id):
    if not os.path.exists(SHARED_DB_PATH):
        return 0
    with open(SHARED_DB_PATH, "r") as f:
        shared_data = json.load(f)
    return shared_data.get(video_id, 0)


def send_telegram_log(message):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_USER_ID:
        print("[!] Telegram credentials not set.")
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {"chat_id": TELEGRAM_USER_ID, "text": message}
    try:
        requests.post(url, data=data, timeout=10)
    except Exception as e:
        print(f"[!] Failed to send Telegram log: {e}")


def send_telegram_photo(bot_token, user_id, photo_path, caption=""):
    url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
    with open(photo_path, "rb") as photo:
        files = {"photo": photo}
        data = {"chat_id": user_id, "caption": caption}
        try:
            requests.post(url, files=files, data=data, timeout=10)
        except Exception as e:
            print(f"[!] Failed to send photo to Telegram: {e}")


def save_screenshot(page: Page, filename_prefix="error"):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.png"
    path = os.path.join("screenshots", filename)
    os.makedirs("screenshots", exist_ok=True)
    try:
        page.screenshot(path=path)
    except Exception as e:
        print(f"[!] Screenshot failed: {e}")
        return None
    return path


def is_proxy_valid(proxy: str) -> bool:
    try:
        proxies = {
            "http": f"http://{proxy}",
            "https": f"http://{proxy}"
        }
        response = requests.get("https://www.tiktok.com", proxies=proxies, timeout=10)
        return "tiktok" in response.text.lower()
    except Exception:
        return False


def load_proxies(filepath="proxy.txt"):
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r") as f:
        proxies = [line.strip() for line in f if line.strip()]
    return proxies