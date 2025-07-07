from utils import read_targets, scrape_user_posts, share_post, get_previous_share_data, save_share_data

def process_targets(page):
    usernames = read_targets("target.txt")
    
    for username in usernames:
        print(f"[*] Scraping posts for {username}...")
        posts = scrape_user_posts(page, username)

        for post in posts:
            video_id = post['video_id']
            like_count = post['like_count']
            share_count = post['share_count']

            if like_count < 100:
                print(f"[-] Skipping post {video_id} (only {like_count} likes)")
                continue
            
            prev_shared = get_previous_share_data(video_id)
            target_shares = 0

            if 100 <= like_count <= 999:
                target_shares = 30 + (prev_shared if prev_shared else 0)
            elif 1000 <= like_count <= 5000:
                target_shares = 50 + (prev_shared if prev_shared else 0)
            elif like_count > 5000:
                target_shares = 100 + (prev_shared if prev_shared else 0)

            print(f"[+] Sharing post {video_id} {target_shares - share_count} more times...")
            share_post(page, post['url'], target_shares)
            save_share_data(video_id, target_shares)