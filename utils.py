import os
import json
import random

SHARED_FILE = "shared.json"

def load_shared():
    if not os.path.exists(SHARED_FILE):
        return {}
    with open(SHARED_FILE, "r") as f:
        return json.load(f)

def save_shared(video_id):
    data = load_shared()
    data[video_id] = True
    with open(SHARED_FILE, "w") as f:
        json.dump(data, f)

def already_shared(video_id):
    data = load_shared()
    return video_id in data

def get_random_share_count(min_count, max_count, already_shared_count):
    target_total = random.randint(min_count, max_count)
    remaining = target_total - already_shared_count
    return max(0, remaining)

def get_share_count(page):
    try:
        share_text = page.inner_text('[data-e2e="share-count"]')
        return int(share_text.replace(",", ""))
    except:
        return 0
