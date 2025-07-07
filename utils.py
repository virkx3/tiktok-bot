import os
import json
import random
import time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import requests

DATA_FILE = "shared_data.json"
PROXY_FILE = "proxy.txt"
TARGET_USERS_FILE = "targets.txt"

def get_target_usernames():
    if not os.path.exists(TARGET_USERS_FILE):
        return []
    with open(TARGET_USERS_FILE, "r") as f:
        return [line.strip() for line in f if line.strip()]

def already_shared():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def mark_as_shared(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

def get_videos_from_user(username, proxies):
    print(f"[>] Scraping videos for @{username}")
    proxy = get_random_proxy(proxies)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(proxy={"server": proxy}, headless=True)
            context = browser.new_context()
            page = context.new_page()
            page.goto(f"https://www.tiktok.com/@{username}", timeout=30000)
            page.wait_for_selector("div[data-e2e=top-content]", timeout=10000)
            video_elements = page.query_selector_all('div[data-e2e=top-content] a[href*="/video/"]')
            videos = []
            for el in video_elements:
                href = el.get_attribute("href")
                video_id = href.split("/video/")[1]
                url = f"https://www.tiktok.com{href}"
                likes_selector = el.query_selector("strong")
                likes_text = likes_selector.inner_text() if likes_selector else "0"
                likes = parse_likes(likes_text)
                videos.append({"id": video_id, "likes": likes, "url": url})
            browser.close()
            return videos
    except Exception as e:
        print(f"[x] Error while scraping @{username}: {e}")
        return []

def parse_likes(like_text):
    try:
        like_text = like_text.lower().replace(" ", "")
        if "k" in like_text:
            return int(float(like_text.replace("k", "")) * 1000)
        elif "m" in like_text:
            return int(float(like_text.replace("m", "")) * 1000000)
        return int(like_text)
    except:
        return 0

def get_share_count_based_on_likes(likes):
    if likes < 100:
        return 0
    elif 100 <= likes < 1000:
        return random.randint(0, max(0, 49 - 50))
    elif 1000 <= likes < 5000:
        return random.randint(0, max(0, 99 - 50))
    else:
        return random.randint(50, max(50, 149 - 50))

def get_valid_proxies():
    if not os.path.exists(PROXY_FILE):
        return []
    with open(PROXY_FILE, "r") as f:
        raw_proxies = [line.strip() for line in f if line.strip()]
    valid = []
    for proxy in raw_proxies:
        if is_proxy_working(proxy) and not is_indian_proxy(proxy):
            valid.append(proxy)
    print(f"[✓] {len(valid)} valid proxies loaded.")
    return valid

def is_proxy_working(proxy):
    try:
        proxies = {"http": proxy, "https": proxy}
        r = requests.get("https://www.tiktok.com", proxies=proxies, timeout=10)
        return r.status_code == 200
    except:
        return False

def is_indian_proxy(proxy):
    try:
        ip = proxy.split("//")[-1].split(":")[0]
        r = requests.get(f"https://ipapi.co/{ip}/country/", timeout=5)
        return r.text.strip().upper() == "IN"
    except:
        return False

def get_random_proxy(proxies):
    return random.choice(proxies) if proxies else None