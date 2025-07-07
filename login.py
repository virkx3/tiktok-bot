from playwright.sync_api import sync_playwright

def login_to_tiktok():
    playwright = sync_playwright().start()
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("https://www.tiktok.com/login")

    # Your login steps...
    page.click("text=Use phone / email / username")
    page.click("text=Email / Username")
    page.fill('input[name="username"]', "sociaixzl3s")
    page.fill('input[type="password"]', "Virksaab@12345")
    page.click('button:has-text("Log in")')
    page.wait_for_timeout(5000)  # Replace with wait_for_selector if needed

    print("[+] Login successful.")
    return browser, context, page