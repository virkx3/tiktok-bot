# proxy_handler.py

import asyncio
import random
import aiohttp
import re
from utils import is_indian_proxy, extract_proxy_parts

PROXY_FILE = "proxy.txt"

async def check_proxy(proxy: str) -> bool:
    try:
        proxy_url = f"http://{proxy}"
        async with aiohttp.ClientSession() as session:
            async with session.get("https://www.tiktok.com", proxy=proxy_url, timeout=10) as resp:
                text = await resp.text()
                if "TikTok" in text and not is_indian_proxy(proxy):
                    return True
    except:
        pass
    return False

async def load_valid_proxies() -> list:
    valid_proxies = []
    try:
        with open(PROXY_FILE, "r") as file:
            proxies = [line.strip() for line in file if line.strip()]
    except FileNotFoundError:
        return []

    tasks = [check_proxy(proxy) for proxy in proxies]
    results = await asyncio.gather(*tasks)

    for proxy, is_valid in zip(proxies, results):
        if is_valid:
            valid_proxies.append(proxy)
    return valid_proxies

class ProxyManager:
    def __init__(self, proxies: list):
        self.proxies = proxies
        self.index = 0

    def get_next_proxy(self):
        if not self.proxies:
            return None
        proxy = self.proxies[self.index]
        self.index = (self.index + 1) % len(self.proxies)
        return extract_proxy_parts(proxy)