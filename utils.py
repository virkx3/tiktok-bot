import json
import os
import socket
import requests
from config import SHARED_COUNT_FILE, TARGET_USERNAMES

def get_target_usernames():
    return TARGET_USERNAMES

def load_shared_counts():
    if not os.path.exists(SHARED_COUNT_FILE):
        return {}
    with open(SHARED_COUNT_FILE, "r") as f:
        return json.load(f)

def save_shared_counts(counts):
    with open(SHARED_COUNT_FILE, "w") as f:
        json.dump(counts, f, indent=2)

def calculate_share_count(likes):
    if likes < 100:
        return 0
    elif 100 <= likes < 1000:
        return 50
    elif 1000 <= likes <= 5000:
        return 100
    else:
        return 150

def get_video_urls(page, username):
    profile_url = f"https://www.tiktok.com/@{username}"
    page.goto(profile_url, timeout=60000)
    page.wait_for_selector("a[href*='/video/']", timeout=10000)
    anchors = page.query_selector_all("a[href*='/video/']")
    urls = list({a.get_attribute("href") for a in anchors})
    return urls[:5]  # Limit to top 5 videos for speed

def is_valid_proxy(ip, port):
    try:
        s = socket.create_connection((ip, int(port)), timeout=3)
        s.close()
        return True
    except:
        return False

def get_country_from_proxy(ip):
    try:
        response = requests.get(f"https://ipapi.co/{ip}/country_name/", timeout=5)
        if response.status_code == 200:
            return response.text.strip()
    except:
        pass
    return "Unknown"