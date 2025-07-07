# proxy_handler.py

import random
import requests
from config import PROXY_LIST_PATH

def is_proxy_valid(proxy: str) -> bool:
    try:
        proxies = {
            "http": f"http://{proxy}",
            "https": f"http://{proxy}",
        }
        response = requests.get("https://www.tiktok.com", proxies=proxies, timeout=10)
        if "India" in response.text:
            return False
        return response.status_code == 200
    except Exception:
        return False

def load_proxies() -> list:
    with open(PROXY_LIST_PATH, "r") as f:
        proxies = [line.strip() for line in f if line.strip()]
    return proxies

def get_valid_proxy() -> str | None:
    proxies = load_proxies()
    random.shuffle(proxies)
    for proxy in proxies:
        if is_proxy_valid(proxy):
            return proxy
    return None