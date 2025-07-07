import aiohttp
import asyncio
import random

async def is_proxy_valid(proxy):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('https://www.tiktok.com', proxy=f"http://{proxy}", timeout=10) as response:
                if response.status == 200:
                    ip_info = await session.get(f"http://ip-api.com/json/{proxy.split(':')[0]}")
                    data = await ip_info.json()
                    if data['countryCode'] != "IN":
                        return True
    except:
        return False
    return False

async def load_proxies():
    with open("proxy.txt") as f:
        raw_proxies = f.read().splitlines()
    valid = []
    for proxy in raw_proxies:
        if await is_proxy_valid(proxy):
            valid.append(proxy)
    return valid

def get_random_proxy(valid_list):
    return random.choice(valid_list) if valid_list else None
