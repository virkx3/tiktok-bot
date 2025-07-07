from playwright.sync_api import sync_playwright, TimeoutError

def login_to_tiktok():
    playwright = sync_playwright().start()
    browser = playwright.chromium.launch(headless=False, slow_mo=100)  # headless=False for debugging
    context = browser.new_context()
    page = context.new_page()

    try:
        print("[*] Navigating to TikTok login page...")
        page.goto("https://www.tiktok.com/login", timeout=30000)

        print("[*] Waiting for 'Use phone / email / username' button...")
        page.wait_for_selector('text="Use phone / email / username"', timeout=15000)
        page.click('text="Use phone / email / username"')

        print("[*] Clicking on 'Email / Username' tab...")
        page.wait_for_selector('text="Email / Username"', timeout=10000)
        page.click('text="Email / Username"')

        print("[*] Filling in credentials...")
        page.wait_for_selector('input[name="username"]', timeout=10000)
        page.fill('input[name="username"]', "sociaixzl3s")
        page.fill('input[type="password"]', "Virksaab@12345")

        print("[*] Clicking login button...")
        page.click('button:has-text("Log in")')

        print("[*] Waiting for navigation after login...")
        page.wait_for_url("https://www.tiktok.com/*", timeout=15000)

        print("[+] Login successful.")
        return browser, context, page

    except TimeoutError as e:
        print("[!] Timeout error:", e)
        browser.close()
        raise

    except Exception as e:
        print("[!] Unexpected error:", e)
        browser.close()
        raise
