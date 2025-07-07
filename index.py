import asyncio
from scrape import scrape
from proxy_handler import load_proxies, get_random_proxy

TARGET_USERNAMES = ["its.sahiba2233", "iamvirk"]

async def main():
    valid_proxies = await load_proxies()
    print(f"✅ Loaded {len(valid_proxies)} working proxies.")

    while True:
        for username in TARGET_USERNAMES:
            proxy = get_random_proxy(valid_proxies)
            print(f"🌐 Using proxy: {proxy}")
            result = await scrape(username, proxy=proxy)

        await asyncio.sleep(7200)  # wait 2 hours

if __name__ == "__main__":
    asyncio.run(main())
