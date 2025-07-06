const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const getValidProxy = require("./proxy");

async function scrapeUser(username) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔁 [${username}] Attempt ${attempt}...`);

    let browser;
    try {
      const proxy = await getValidProxy();

      browser = await chromium.launch({
        headless: true,
        proxy: proxy ? { server: proxy } : undefined,
      });

      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Linux; Android 11; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36",
      });

      const page = await context.newPage();
      await page.goto(`https://www.tiktok.com/@${username}`, {
        timeout: 20000,
        waitUntil: "domcontentloaded",
      });

      // Wait for video thumbnails to appear
      await page.waitForSelector("div[data-e2e='user-post-item-list']", {
        timeout: 20000,
      });

      const videoLinks = await page.$$eval(
        "div[data-e2e='user-post-item-list'] a",
        (anchors) => anchors.map((a) => a.href)
      );

      console.log(`📹 [${username}] Found ${videoLinks.length} videos`);

      await browser.close();
      return videoLinks;
    } catch (err) {
      console.error(
        `⚠️ Scraping error for ${username} (attempt ${attempt}):`,
        err.message
      );

      if (browser) {
        const screenshotPath = path.join(
          __dirname,
          `screenshot-${username}.png`
        );
        const page = await browser.newPage().catch(() => null);
        if (page) await page.screenshot({ path: screenshotPath }).catch(() => {});
        console.log(`📸 Saved screenshot to ${screenshotPath}`);
        await browser.close().catch(() => {});
      }

      // Wait a bit before retrying
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  console.error(`❌ Failed scraping ${username} after ${maxAttempts} attempts.`);
  return [];
}

module.exports = scrapeUser;