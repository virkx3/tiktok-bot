import random
import time
from playwright.sync_api import sync_playwright
from utils import (
    get_target_usernames,
    get_valid_proxies,
    get_random_proxy,
    get_videos_from_user,
    already_shared,
    mark_as_shared,
    get_share_count_based_on_likes
)

RECHECK_INTERVAL = 2 * 60 * 60  # 2 hours in seconds

def scrape():
    target_usernames = get_target_usernames()
    shared_cache = already_shared()
    proxies = get_valid_proxies()

    while True:
        print("\n[+] Starting scrape loop...")
        for username in target_usernames:
            print(f"[+] Checking videos for @{username}")
            videos = get_videos_from_user(username, proxies)
            for video in videos:
                video_id = video['id']
                likes = video['likes']
                url = video['url']

                if video_id in shared_cache:
                    previous_shares = shared_cache[video_id]['shares']
                    previous_likes = shared_cache[video_id]['likes']
                    if likes > previous_likes:
                        new_shares = get_share_count_based_on_likes(likes) - previous_shares
                        if new_shares > 0:
                            print(f"[↑] Likes increased for {video_id}, sharing {new_shares} more times.")
                            perform_shares(url, new_shares, proxies)
                            shared_cache[video_id]['shares'] += new_shares
                            shared_cache[video_id]['likes'] = likes
                            mark_as_shared(shared_cache)
                    continue

                share_count = get_share_count_based_on_likes(likes)
                if share_count > 0:
                    print(f"[+] Sharing {video_id} ({likes} likes) {share_count} times.")
                    perform_shares(url, share_count, proxies)
                    shared_cache[video_id] = {'shares': share_count, 'likes': likes}
                    mark_as_shared(shared_cache)

        print(f"[*] Sleeping for {RECHECK_INTERVAL // 3600} hours...\n")
        time.sleep(RECHECK_INTERVAL)


def perform_shares(video_url, count, proxies):
    for _ in range(count):
        proxy = get_random_proxy(proxies)
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(proxy={"server": proxy}, headless=True)
                context = browser.new_context()
                page = context.new_page()
                page.goto(video_url, timeout=30000)
                page.click('text=Share', timeout=10000)
                time.sleep(random.uniform(2, 4))
                browser.close()
        except Exception as e:
            print(f"[!] Error while sharing with proxy {proxy}: {e}")