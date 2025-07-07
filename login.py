from playwright.sync_api import sync_playwright

USERNAME = "sociaixzl3s"
PASSWORD = "Virksaab@12345"

def login_to_tiktok():
    playwright = sync_playwright().start()
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("https://www.tiktok.com/login")

    print("[*] Waiting for login page to load...")
    page.wait_for_timeout(5000)

    print("[*] Clicking on 'Use phone / email / username'...")
    page.click("text=Use phone / email / username")
    page.wait_for_timeout(2000)

    print("[*] Clicking on 'Email / Username' tab...")
    page.click("text=Log in with email or username")
    page.wait_for_timeout(1000)

    print("[*] Filling in credentials...")
    page.fill('input[name="username"]', USERNAME)
    page.fill('input[type="password"]', PASSWORD)
    page.click('button[type="submit"]')

    print("[*] Waiting for login to complete...")
    page.wait_for_timeout(8000)

    # Check if login successful
    if "For You" not in page.content():
        print("[!] Login may have failed. Please check credentials or captcha.")
    else:
        print("[+] Login successful.")

    return browser, context, page
