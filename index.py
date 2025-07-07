from login import login_to_tiktok
from scrape import process_targets

def main():
    print("[*] Logging into TikTok...")
    browser, context, page = login_to_tiktok()
    
    print("[*] Processing target accounts...")
    process_targets(page)

    browser.close()

if __name__ == "__main__":
    main()