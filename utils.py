import json
import os
import requests
from playwright.sync_api import sync_playwright

def get_target_usernames():
    from config import TARGET_USERNAMES
    return TARGET_USERNAMES

def calculate_share_count(likes, previous_shares):
    if likes < 100:
        return 0
    elif 100 <= likes < 1000:
        return max(0, 50 - previous_shares)
    elif 1000 <= likes <= 5000:
        return max(0, 100 - previous_shares)
    else:
        return max(0, 150 - previous_shares)

def read_previous_likes(file_path='likes.json'):
    if not os.path.exists(file_path):
        return {}
    with open(file_path, 'r') as f:
        return json.load(f)

def write_previous_likes(data, file_path='likes.json'):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def load_proxies(file_path='proxy.txt'):
    if not os.path.exists(file_path):
        return []
    with open(file_path, 'r') as f:
        proxies = [line.strip() for line in f if line.strip()]
    return proxies

def filter_valid_proxies(proxy_list):
    valid_proxies = []
    with sync_playwright() as p:
        for proxy in proxy_list:
            try:
                if proxy.startswith("socks5://"):
                    proxy_config = {"server": proxy.replace("socks5://", ""), "username": "", "password": ""}
                    browser = p.chromium.launch(proxy={"server": f"socks5://{proxy_config['server']}"})
                elif proxy.startswith("http://") or proxy.startswith("https://"):
                    browser = p.chromium.launch(proxy={"server": proxy})
                else:
                    continue

                page = browser.new_page()
                page.goto("https://www.tiktok.com", timeout=10000)
                content = page.content()
                if "India" not in content:
                    valid_proxies.append(proxy)
                browser.close()
            except Exception:
                continue
    return valid_proxies