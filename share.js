const { chromium } = require("playwright");
const getProxy = require("./proxy");

const USERNAME = process.env.TIKTOK_USERNAME || "sociaixzl3s";
const PASSWORD = process.env.TIKTOK_PASSWORD || "Virksaab@12345";

async function shareVideo(videoUrl, shareCount = 1) {
  const proxy = await getProxy();

  const browser = await chromium.launch({
    headless: true,
    proxy: proxy ? { server: proxy } : undefined,
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://www.tiktok.com/login/phone-or-email/email", { timeout: 60000 });

    await page.fill('input[name="email"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    for (let i = 0; i < shareCount; i++) {
      console.log(`📤 Sharing attempt ${i + 1}...`);
      await page.goto(videoUrl);
      await page.waitForTimeout(2000);
    }

    return true;
  } catch (err) {
    console.error("❌ Sharing error:", err.message);
    return false;
  } finally {
    await browser.close();
  }
}

module.exports = { shareVideo };