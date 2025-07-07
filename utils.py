import json
import os
import re
import socket
import pytz
import requests
from datetime import datetime

SHARED_DATA_FILE = "shared.json"

def get_target_usernames():
    return ["its.sahiba2233", "iamvirk"]

def load_shared_data():
    if not os.path.exists(SHARED_DATA_FILE):
        return {}
    with open(SHARED_DATA_FILE, "r") as f:
        return json.load(f)

def save_shared_data(data):
    with open(SHARED_DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

def has_been_shared(video_id):
    data = load_shared_data()
    return video_id in data

def get_previous_share_count(video_id):
    data = load_shared_data()
    return data.get(video_id, 0)

def mark_as_shared(video_id, shares):
    data = load_shared_data()
    data[video_id] = shares
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

def get_timestamp():
    return datetime.now(pytz.timezone("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M:%S")

def save_screenshot(page, filename="error.png"):
    return page.screenshot(path=filename)

def get_video_id_from_url(url):
    match = re.search(r'/video/(\d+)', url)
    return match.group(1) if match else None

def extract_proxy_parts(proxy):
    proxy = proxy.strip()
    match = re.match(r'(?:(\w+):\/\/)?(?:(\w+:\w+)@)?([^:]+):(\d+)', proxy)
    if not match:
        return None
    scheme, auth, host, port = match.groups()
    return {
        "scheme": scheme or "http",
        "auth": auth,
        "host": host,
        "port": int(port)
    }

def is_indian_proxy(ip):
    try:
        response = requests.get(f"https://ipapi.co/{ip}/country/", timeout=5)
        return response.status_code == 200 and response.text.strip() == "IN"
    except:
        return False

def get_videos_from_user(user_videos, already_shared):
    results = []
    for video in user_videos:
        video_id = video["id"]
        if video_id not in already_shared:
            results.append(video)
    return results