# proxy_handler.py

import random
import requests
from urllib.parse import urlparse
from config import PROXY_LIST_PATH

def load_proxies():
    with open(PROXY_LIST_PATH, 'r') as f:
        return list(set([line.strip() for line in f if line.strip()]))

def is_proxy_working(proxy):
    try:
        proxies = {
            "http": f"http://{proxy}",
            "https": f"http://{proxy}",
        }
        response = requests.get("https://www.tiktok.com/", proxies=proxies, timeout=8)
        if response.status_code != 200:
            return False
        if "India" in response.text or "IN" in response.text:
            return False
        return True
    except:
        return False

def get_valid_proxy(proxies):
    random.shuffle(proxies)
    for proxy in proxies:
        if is_proxy_working(proxy):
            return proxy
    return None

def get_requests_proxy_format(proxy):
    return {
        "http": f"http://{proxy}",
        "https": f"http://{proxy}"
    }

def get_playwright_proxy_argument(proxy):
    if '@' in proxy:
        creds, host = proxy.split('@')
        username, password = creds.split(':')
        address, port = host.split(':')
        return {
            "server": f"http://{address}:{port}",
            "username": username,
            "password": password
        }
    else:
        address, port = proxy.split(':')
        return {
            "server": f"http://{address}:{port}"
        }