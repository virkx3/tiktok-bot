from login import login_to_tiktok
from utils import get_share_count, already_shared, save_shared, get_random_share_count
import json
import time

def get_target_usernames():
    with open("target.txt", "r") as f:
        return [line.strip() for line in f if line.strip()]

def get_user_videos(page, username):
    print(f"[*] Navigating to @{username}'s profile...")
    page.goto(f"https://www.tiktok.com/@{username}")
    page.wait_for_timeout(5000)

    print("[*] Scraping video links...")
    video_links = set()
    anchors = page.query_selector_all('a[href*="/video/"]')
    for a in anchors:
        href = a.get_attribute("href")
        if href and "/video/" in href:
            video_links.add(href)

    return list(video_links)[:10]  # Limit to last 10 videos

def should_share(video_data):
    likes = video_data["likes"]
    shares = video_data["shares"]

    if likes < 100:
        return 0
    elif 100 <= likes <= 999:
        return get_random_share_count(30, 50, shares)
    elif 1000 <= likes <= 5000:
        return get_random_share_count(50, 100, shares)
    else:
        return get_random_share_count(100, 150, shares)

def process_user_videos(page, username):
    videos = get_user_videos(page, username)
    for url in videos:
        video_id = url.split("/video/")[-1]
        if already_shared(video_id):
            print(f"[=] Already shared video {video_id}. Skipping.")
            continue

        print(f"[*] Processing video {video_id}")
        page.goto(url)
        page.wait_for_timeout(5000)

        # Extract like/share count
        try:
            likes = int(page.inner_text('[data-e2e="like-count"]').replace(',', ''))
            shares = get_share_count(page)
        except Exception as e:
            print(f"[!] Failed to get counts: {e}")
            continue

        share_times = should_share({"likes": likes, "shares": shares})
        if share_times == 0:
            print(f"[!] Not enough likes to share. Skipping video.")
            continue

        print(f"[+] Sharing video {video_id} — {share_times} times")

        for _ in range(share_times):
            try:
                page.click('button[data-e2e="share-button"]')
                page.wait_for_timeout(1500)
                page.click('button[data-e2e="share-copylink"]')
                time.sleep(1)
            except Exception as e:
                print(f"[!] Failed to share: {e}")

        save_shared(video_id)
        print(f"[✓] Shared {video_id} and marked as done.\n")

def scrape():
    browser, context, page = login_to_tiktok()
    usernames = get_target_usernames()

    for user in usernames:
        process_user_videos(page, user)
        time.sleep(3)

    browser.close()
