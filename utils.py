import json
import os
import re
import time
from playwright.sync_api import Page
from urllib.parse import urlparse
from config import TARGET_USERNAMES

def get_target_usernames():
    return TARGET_USERNAMES

def calculate_share_count(likes: int) -> int:
    if likes < 100:
        return 0
    elif likes < 1000:
        return 50
    elif likes < 5000:
        return 100
    else:
        return 150

def get_video_id_from_url(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path
    match = re.search(r'/video/(\d+)', path)
    return match.group(1) if match else ""

def already_shared(video_id: str) -> int:
    if not os.path.exists("shared_videos.json"):
        return 0
    with open("shared_videos.json", "r") as f:
        data = json.load(f)
    return data.get(video_id, 0)

def mark_video_shared(video_id: str, count: int):
    if os.path.exists("shared_videos.json"):
        with open("shared_videos.json", "r") as f:
            data = json.load(f)
    else:
        data = {}
    data[video_id] = count
    with open("shared_videos.json", "w") as f:
        json.dump(data, f, indent=2)

def get_videos_from_user(page: Page, username: str) -> list:
    print(f"📸 Fetching videos for @{username}")
    page.goto(f"https://www.tiktok.com/@{username}", timeout=60000)
    time.sleep(5)
    page.mouse.wheel(0, 3000)
    time.sleep(5)

    video_elements = page.query_selector_all("a[href*='/video/']")
    videos = []
    for el in video_elements:
        try:
            url = el.get_attribute("href")
            if not url or "/video/" not in url:
                continue
            likes_selector = el.query_selector("strong")
            likes = int(likes_selector.inner_text().replace('K', '000').replace('.', '').replace('M', '000000')) if likes_selector else 0
            videos.append({"url": url, "likes": likes})
        except Exception as e:
            print(f"⚠️ Error parsing video: {e}")
            continue
    return videos