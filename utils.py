import os
import json
import re

SHARED_RECORD_FILE = "shared_videos.json"

def get_target_usernames():
    return ["its.sahiba2233", "iamvirk"]

def calculate_share_count(likes, previously_shared):
    if likes < 100:
        return 0
    elif 100 <= likes < 1000:
        return max(0, 50 - previously_shared)
    elif 1000 <= likes <= 5000:
        return max(0, 100 - previously_shared)
    else:
        return max(0, 150 - previously_shared)

def get_video_id_from_url(url):
    match = re.search(r"/video/(\d+)", url)
    if match:
        return match.group(1)
    return None

def already_shared(video_id):
    if not os.path.exists(SHARED_RECORD_FILE):
        return 0
    with open(SHARED_RECORD_FILE, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            data = {}
    return data.get(video_id, 0)

def mark_as_shared(video_id, count):
    if not os.path.exists(SHARED_RECORD_FILE):
        data = {}
    else:
        with open(SHARED_RECORD_FILE, "r") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = {}
    data[video_id] = data.get(video_id, 0) + count
    with open(SHARED_RECORD_FILE, "w") as f:
        json.dump(data, f, indent=2)

def get_videos_from_user(page, username):
    url = f"https://www.tiktok.com/@{username}"
    page.goto(url, timeout=60000)
    page.wait_for_selector("div[data-e2e='user-post-item']", timeout=60000)
    video_elements = page.query_selector_all("div[data-e2e='user-post-item'] a")
    return [video.get_attribute("href") for video in video_elements]

def save_screenshot(page, filename="error_screenshot.png"):
    try:
        page.screenshot(path=filename, full_page=True)
        print(f"📸 Screenshot saved: {filename}")
    except Exception as e:
        print(f"⚠️ Failed to take screenshot: {e}")