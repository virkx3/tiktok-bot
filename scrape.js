const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeUserVideos(username, proxy, attempt = 1) {
  console.log(`🔍 Scraping: ${username} (Attempt ${attempt})`);

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox'],
      proxy: proxy ? { server: `socks5://${proxy}` } : undefined,
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36"
    });

    const page = await context.newPage();

    const userUrl = `https://www.tiktok.com/@${username}`;
    console.log(`🌐 Navigating to ${userUrl}`);
    await page.goto(userUrl, { timeout: 20000 });

    console.log("🔍 Waiting for video list...");
    await page.waitForSelector('div[data-e2e="user-post-item-list"]', { timeout: 15000 });

    const videoLinks = await page.$$eval('a[href*="/video/"]', links =>
      links.map(link => link.href)
    );

    console.log(`🎞️ Found ${videoLinks.length} videos for ${username}`);

    for (const link of videoLinks) {
      console.log(`➡️ Visiting video: ${link}`);
      await page.goto(link, { timeout: 20000 });

      // Wait and click Share
      await page.waitForSelector('button[data-e2e="share-button"]', { timeout: 10000 });
      await page.click('button[data-e2e="share-button"]');
      console.log("📤 Clicked share button");

      // Wait and click Copy Link
      await page.waitForSelector('button[data-e2e="copy-link"]', { timeout: 10000 });
      await page.click('button[data-e2e="copy-link"]');
      console.log("🔗 Clicked copy link (share simulated)");
    }

    await browser.close();
    console.log(`✅ Done scraping ${username}`);

  } catch (err) {
    console.error(`⚠️ Scraping error for ${username} (attempt ${attempt}):`, err.message);
    const screenshotPath = path.join(__dirname, `screenshot-${username}.png`);
    if (browser) {
      const page = (await browser.contexts()[0].pages())[0];
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Saved screenshot to ${screenshotPath}`);
    }
    if (browser) await browser.close();

    if (attempt < 3) {
      await scrapeUserVideos(username, proxy, attempt + 1);
    } else {
      console.error(`❌ Failed scraping ${username} after 3 attempts.`);
    }
  }
}

module.exports = scrapeUserVideos;