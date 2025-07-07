import os
import json
import re
import requests
from playwright.sync_api import sync_playwright

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

def get_videos_from_user(username, proxy=None):
    print(f"Scraping videos for user: {username}")
    with sync_playwright() as p:
        browser_args = ["--no-sandbox"]
        proxy_config = {}

        if proxy:
            proxy_type, host, port, username_, password = extract_proxy_parts(proxy)
            server = f"{proxy_type}://{host}:{port}"
            proxy_config = {
                "server": server
            }
            if username_ and password:
                proxy_config["username"] = username_
                proxy_config["password"] = password
            print(f"Using proxy: {server}")

        browser = p.chromium.launch(proxy=proxy_config or None, headless=True, args=browser_args)
        context = browser.new_context()
        page = context.new_page()

        try:
            page.goto(f"https://www.tiktok.com/@{username}", timeout=60000)
            page.wait_for_selector("div[data-e2e=feed-item]", timeout=10000)

            elements = page.query_selector_all("div[data-e2e=feed-item]")
            videos = []

            for el in elements:
                link_el = el.query_selector("a")
                href = link_el.get_attribute("href") if link_el else None
                if href and "/video/" in href:
                    video_id = href.split("/video/")[-1]
                    likes_el = el.query_selector("strong[data-e2e=like-count]")
                    likes = int(likes_el.inner_text().replace("K", "000").replace("M", "000000").replace(".", "")) if likes_el else 0
                    videos.append({
                        "id": video_id,
                        "url": href,
                        "likes": likes
                    })
            return videos

        except Exception as e:
            print(f"Error fetching videos from @{username}: {e}")
            return []
        finally:
            browser.close()