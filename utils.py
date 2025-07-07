import os
import json
import re
import requests

def load_shared_data():
    if not os.path.exists("shared.json"):
        return {}
    with open("shared.json", "r") as f:
        return json.load(f)

def save_shared_data(data):
    with open("shared.json", "w") as f:
        json.dump(data, f, indent=2)

def already_shared(video_id):
    if not os.path.exists("shared.json"):
        return False
    with open("shared.json", "r") as f:
        data = json.load(f)
        return video_id in data

def update_shared_count(video_id, count):
    data = load_shared_data()
    if video_id in data:
        data[video_id] += count
    else:
        data[video_id] = count
    save_shared_data(data)

def get_shared_count(video_id):
    data = load_shared_data()
    return data.get(video_id, 0)

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
    if not os.path.exists("targets.txt"):
        return []
    with open("targets.txt", "r") as f:
        return [line.strip() for line in f if line.strip()]

def extract_proxy_parts(proxy_line):
    match = re.match(r'(?:(\w+):\/\/)?(?:(\w+):(\w+)@)?([\w\.-]+):(\d+)', proxy_line)
    if not match:
        return None
    proxy_type = match.group(1) or 'socks5'
    username = match.group(2)
    password = match.group(3)
    host = match.group(4)
    port = match.group(5)
    return proxy_type, host, port, username, password

def is_indian_proxy(ip):
    try:
        res = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
        data = res.json()
        return data.get("country", "").lower() == "india"
    except:
        return False

def get_proxies_from_file(file_path="proxy.txt"):
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r") as f:
        return [line.strip() for line in f if line.strip()]