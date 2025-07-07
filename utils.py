import os
import json
import random
from time import sleep

TARGET_FILE = "target.txt"
SHARE_LOG = "share_log.json"

USERNAME = "sociaixzl3s"
PASSWORD = "Virksaab@12345"


def read_targets():
    with open(TARGET_FILE, "r") as f:
        return [line.strip() for line in f if line.strip()]


def get_previous_share_data(post_url):
    if not os.path.exists(SHARE_LOG):
        return 0
    with open(SHARE_LOG, "r") as f:
        data = json.load(f)
    return data.get(post_url, 0)


def save_share_data(post_url, count):
    if os.path.exists(SHARE_LOG):
        with open(SHARE_LOG, "r") as f:
            data = json.load(f)
    else:
        data = {}
    data[post_url] = count
    with open(SHARE_LOG, "w") as f:
        json.dump(data, f)


async def login(page):
    await page.goto("https://www.tiktok.com/login")
    await page.wait_for_timeout(3000)
    await page.click('text=Use phone / email / username')
    await page.click('text=Log in with password')
    await page.fill('input[name="username"]', USERNAME)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.wait_for_timeout(8000)
    print("[✅] Logged in successfully.")


async def scrape_user_posts(page, username):
    await page.goto(f"https://www.tiktok.com/@{username}")
    await page.wait_for_timeout(5000)

    posts = []
    cards = await page.query_selector_all('div[data-e2e="user-post-item"]')

    for card in cards[:10]:  # Limit to last 10 posts
        link_elem = await card.query_selector("a")
        url = await link_elem.get_attribute("href")
        text_elem = await card.query_selector('strong[data-e2e="like-count"]')
        like_text = await text_elem.inner_text() if text_elem else "0"
        share_elem = await card.query_selector('strong[data-e2e="share-count"]')
        share_text = await share_elem.inner_text() if share_elem else "0"

        def parse_count(text):
            text = text.lower().strip()
            if 'k' in text:
                return int(float(text.replace("k", "")) * 1000)
            elif 'm' in text:
                return int(float(text.replace("m", "")) * 1000000)
            else:
                return int(text) if text.isdigit() else 0

        posts.append({
            "url": url,
            "likes": parse_count(like_text),
            "shares": parse_count(share_text),
        })

    return posts


async def share_post(page, post_url, times):
    count = 0
    for _ in range(times):
        try:
            await page.goto(post_url)
            await page.wait_for_timeout(3000)
            share_button = await page.query_selector('[data-e2e="share-button"]')
            if share_button:
                await share_button.click()
                await page.wait_for_timeout(2000)
                # Optional: Add more logic here to interact with the share modal
                count += 1
            await page.wait_for_timeout(random.randint(2000, 4000))
        except Exception as e:
            print(f"[⚠️] Error sharing: {e}")
            await page.wait_for_timeout(2000)
    return count