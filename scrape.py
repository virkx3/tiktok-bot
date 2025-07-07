import asyncio
from playwright.async_api import async_playwright
from utils import (
    read_targets,
    login,
    scrape_user_posts,
    share_post,
    get_previous_share_data,
    save_share_data
)


async def process_targets():
    async with async_playwright() as p:
        browser = await p.webkit.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        await login(page)

        targets = read_targets()
        for username in targets:
            print(f"\n[📥] Checking user: {username}")
            posts = await scrape_user_posts(page, username)
            for post in posts:
                url = post["url"]
                likes = post["likes"]
                shares = post["shares"]

                if likes < 100:
                    print(f"[⏭️] Skipping post {url} — Only {likes} likes.")
                    continue

                previous_share = get_previous_share_data(url)
                if previous_share is None:
                    previous_share = 0

                if 100 <= likes <= 999:
                    min_share, max_share = 30, 50
                elif 1000 <= likes <= 5000:
                    min_share, max_share = 50, 100
                else:
                    min_share, max_share = 100, 150

                total_required_share = max(min_share, max_share - previous_share)
                if total_required_share <= 0:
                    print(f"[✅] Already shared enough for {url}")
                    continue

                print(f"[🚀] Sharing {url} — Target: {total_required_share} times (old: {previous_share})")
                count = await share_post(page, url, total_required_share)
                save_share_data(url, previous_share + count)

        await browser.close()