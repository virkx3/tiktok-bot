main.py

import time import json from tiktok_login import login from tiktok_scraper import get_last_10_posts, get_post_stats, share_post

SHARE_LOG = "shared.json" TARGET_FILE = "target.txt"

Share tiers based on likes

SHARE_RULES = [ (5001, 100, 150), (1000, 50, 100), (100, 30, 50), ]

def load_share_log(): try: with open(SHARE_LOG, "r") as f: return json.load(f) except: return {}

def save_share_log(log): with open(SHARE_LOG, "w") as f: json.dump(log, f, indent=2)

def determine_share_target(likes): for threshold, min_s, max_s in SHARE_RULES: if likes >= threshold: return (min_s, max_s) return (0, 0)

def main(): browser, page = login() share_log = load_share_log()

with open(TARGET_FILE, "r") as f:
    users = [line.strip() for line in f if line.strip()]

for user in users:
    print(f"\nProcessing: {user}")
    posts = get_last_10_posts(page, user)

    for post_url in posts:
        post_id = post_url.split("/")[-1].split("?")[0]
        likes, shares = get_post_stats(page, post_url)

        if likes < 100:
            print(f"Skipping {post_id} — only {likes} likes")
            continue

        min_s, max_s = determine_share_target(likes)
        already_shared = share_log.get(post_id, 0)
        remaining = max(min_s, 0) if already_shared == 0 else max(min_s - already_shared, 0)
        target = min(max_s - already_shared, remaining)

        if target <= 0:
            print(f"Already shared enough for {post_id}")
            continue

        print(f"Sharing {post_id} — {target} times")
        success = share_post(page, post_url, target)

        if success:
            share_log[post_id] = already_shared + target
            save_share_log(share_log)

print("\nWaiting 2 hours to recheck...")
time.sleep(2 * 3600)
main()

if name == "main": main()

