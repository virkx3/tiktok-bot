import asyncio
from playwright.async_api import async_playwright
from utils import (
    read_targets,
    login,
    scrape_user_posts,
    share_post,
    get_previous_share_data,
    save_share_data,
)

USERNAME = "sociaixzl3s" PASSWORD = "Virksaab@12345"

async def process_targets(): targets = read_targets("target.txt")

async with async_playwright() as p:
    browser = await p.chromium.launch(headless=True)
    context = await browser.new_context()
    page = await context.new_page()

    # Login
    print("Logging into TikTok...")
    await login(page, USERNAME, PASSWORD)

    for username in targets:
        print(f"\nProcessing {username}...")
        posts = await scrape_user_posts(page, username)

        for post in posts:
            video_id = post["id"]
            likes = post["likes"]
            shares = post["shares"]

            # Skip post if likes < 99
            if likes < 99:
                print(f"Skipping post {video_id} — only {likes} likes.")
                continue

            previous_shares = get_previous_share_data(username, video_id)

            # Determine how many new shares to do
            total_needed = 0
            if 100 <= likes <= 999:
                total_needed = 50
            elif 1000 <= likes <= 5000:
                total_needed = 100
            elif likes > 5000:
                total_needed = 150

            new_shares_needed = total_needed - previous_shares
            if new_shares_needed <= 0:
                print(f"Already shared enough for {video_id} ({previous_shares}/{total_needed})")
                continue

            print(f"Sharing post {video_id} {new_shares_needed} times...")
            for _ in range(new_shares_needed):
                await share_post(page, post["url"])
                await asyncio.sleep(2)

            save_share_data(username, video_id, total_needed)

    await context.close()
    await browser.close()

if name == "main": asyncio.run(process_targets())

