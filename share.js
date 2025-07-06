const playwright = require('playwright');
const { getWorkingProxy } = require('./proxy');
const login = require('./tiktok-login');

async function shareVideo(url, count) {
  for (let i = 0; i < count; i++) {
    try {
      const proxy = await getWorkingProxy();
      const browser = await playwright.chromium.launch({
        headless: true,
        proxy: proxy ? { server: `socks5://${proxy}` } : undefined,
      });

      const context = await browser.newContext();
      const page = await context.newPage();

      await login(page);

      await page.goto(url, { timeout: 60000 });
      await page.waitForTimeout(3000);
      await page.click('button[data-e2e="share-icon"]');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Copy link")'); // fallback if available

      await browser.close();
    } catch (err) {
      console.log(`⚠️ Share error: ${err.message}`);
    }
  }
  return true;
}

module.exports = shareVideo;