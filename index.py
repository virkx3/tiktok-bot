from login import login_to_tiktok
from scrape import process_targets
import time

def main():
    print("[*] Logging into TikTok...")
    browser, context, page = login_to_tiktok()
    
    print("[*] Processing target accounts...")
    while True:
        process_targets(page)
        print("[*] Sleeping for 2 hours before rechecking...")
        time.sleep(2 * 60 * 60)  # 2 hours

if __name__ == "__main__":
    main()
