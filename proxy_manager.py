import requests
import random
from urllib.parse import urlparse

VALID_PROXIES = []
CURRENT_PROXY_INDEX = 0

def load_proxies(filename='proxy.txt'):
    with open(filename, 'r') as f:
        proxies = [line.strip() for line in f if line.strip()]
    return proxies

def is_indian_proxy(ip):
    try:
        resp = requests.get(f'https://ipapi.co/{ip}/country/', timeout=5)
        return resp.text.strip().upper() == 'IN'
    except:
        return True  # Treat as Indian or blocked

def test_proxy(proxy):
    ip = proxy.split(':')[0]
    if is_indian_proxy(ip):
        return False
    try:
        proxies = {
            'http': f'http://{proxy}',
            'https': f'http://{proxy}',
        }
        resp = requests.get('https://www.tiktok.com', proxies=proxies, timeout=10)
        return 'tiktok' in resp.text.lower()
    except:
        return False

def initialize_valid_proxies():
    global VALID_PROXIES
    proxies = load_proxies()
    VALID_PROXIES = []
    for proxy in proxies:
        print(f"🔍 Testing proxy: {proxy}")
        if test_proxy(proxy):
            VALID_PROXIES.append(proxy)
            print(f"✅ Proxy usable: {proxy}")
        else:
            print(f"❌ Proxy invalid or blocked: {proxy}")
    if not VALID_PROXIES:
        raise Exception("No working proxies available.")

def get_next_proxy():
    global CURRENT_PROXY_INDEX
    if not VALID_PROXIES:
        initialize_valid_proxies()
    proxy = VALID_PROXIES[CURRENT_PROXY_INDEX]
    CURRENT_PROXY_INDEX = (CURRENT_PROXY_INDEX + 1) % len(VALID_PROXIES)
    return proxy
