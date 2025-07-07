from playwright.sync_api import sync_playwright

def login_to_tiktok():
    playwright = sync_playwright().start()
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("https://www.tiktok.com/login")

    print("[*] Waiting for login page to load...")
    page.wait_for_selector("text=Use phone / email / username", timeout=15000)
    page.click("text=Use phone / email / username")

    print("[*] Clicking on 'Email / Username' tab...")
    page.wait_for_selector("text=Email / Username", timeout=10000)
    page.click("text=Email / Username")

    print("[*] Filling in credentials...")
    page.wait_for_selector('input[name="username"]')
    page.fill('input[name="username"]', "sociaixzl3s")
    page.fill('input[type="password"]', "Virksaab@12345")

    page.click('button:has-text("Log in")')

    print("[*] Waiting for login to complete...")
    page.wait_for_timeout(5000)  # Optional: Replace with a more precise wait

    print("[+] Login successful.")
    return browser, context, page