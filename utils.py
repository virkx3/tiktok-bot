import json
import os
import random
import requests
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_USER_ID = os.getenv("TELEGRAM_USER_ID")

SHARED_FILE = "shared.json"
PROXY_FILE = "proxy.txt"


def load_shared_data():
    if not os.path.exists(SHARED_FILE):
        return {}
    with open(SHARED_FILE, "r") as f:
        return json.load(f)


def save_shared_data(data):
    with open(SHARED_FILE, "w") as f:
        json.dump(data, f, indent=2)


def already_shared(video_id):
    data = load_shared_data()
    return video_id in data


def mark_as_shared(video_id):
    data = load_shared_data()
    data[video_id] = data.get(video_id, 0)
    save_shared_data(data)


def update_share_count(video_id, new_count):
    data = load_shared_data()
    data[video_id] = new_count
    save_shared_data(data)


def calculate_share_count(likes):
    if likes < 100:
        return 0
    elif 100 <= likes < 1000:
        return 50
    elif 1000 <= likes <= 5000:
        return 100
    else:
        return 150


def get_target_usernames():
    return ["its.sahiba2233", "iamvirk"]


def get_videos_from_user(page, username):
    url = f"https://www.tiktok.com/@{username}"
    page.goto(url, timeout=60000)
    time.sleep(5)
    video_elements = page.query_selector_all('a[href*="/video/"]')
    videos = []
    for video in video_elements:
        href = video.get_attribute("href")
        if "/video/" in href:
            video_id = href.split("/video/")[1].split("?")[0]
            videos.append({"url": href, "video_id": video_id})
    return videos


def send_telegram_message(message):
    if not TELEGRAM_TOKEN or not TELEGRAM_USER_ID:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_USER_ID, "text": message}
    try:
        requests.post(url, data=payload, timeout=10)
    except Exception as e:
        print(f"Failed to send Telegram message: {e}")


def send_telegram_screenshot(image_path):
    if not TELEGRAM_TOKEN or not TELEGRAM_USER_ID:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
    with open(image_path, "rb") as photo:
        payload = {"chat_id": TELEGRAM_USER_ID}
        files = {"photo": photo}
        try:
            requests.post(url, data=payload, files=files, timeout=10)
        except Exception as e:
            print(f"Failed to send Telegram screenshot: {e}")


def is_proxy_valid(proxy):
    try:
        proxies = {
            "http": f"http://{proxy}",
            "https": f"http://{proxy}"
        }
        resp = requests.get("https://www.tiktok.com", proxies=proxies, timeout=10)
        if "India" in resp.text or "IN" in resp.text:
            return False
        return resp.status_code == 200
    except:
        return False


def get_working_proxies():
    if not os.path.exists(PROXY_FILE):
        return []

    with open(PROXY_FILE, "r") as f:
        proxies = [line.strip() for line in f if line.strip()]

    valid = []
    for proxy in proxies:
        print(f"Checking proxy: {proxy}")
        if is_proxy_valid(proxy):
            print(f"✅ Valid proxy: {proxy}")
            valid.append(proxy)
        else:
            print(f"❌ Invalid or Indian proxy: {proxy}")
    return valid


def get_random_proxy(proxies):
    if not proxies:
        return None
    return random.choice(proxies)