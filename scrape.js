import { chromium } from 'playwright';
import fs from 'fs';
import { sendTelegramMessage, sendTelegramPhoto } from './telegram.js';

export default async function scrapeUser(username, proxy) {
  const videoSelector = 'div[data-e2e="user-post-item-list"]';
  const baseURL = `https://www.tiktok.com/@${username}`;
  const browser = await chromium.launch({
    headless: true,
    proxy: proxy ? { server: `socks5://${proxy}` } : undefined,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseURL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector(videoSelector, { timeout: 15000 });

    const videos = await page.$$eval(`${videoSelector} a`, (els) =>
      els.map((el) => el.href)
    );

    for (let videoUrl of videos) {
      await page.goto(videoUrl, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('strong[data-e2e="like-count"]', { timeout: 10000 });

      const likeCountText = await page.$eval('strong[data-e2e="like-count"]', el => el.textContent || "0");
      const likeCount = parseInt(likeCountText.replace(/[^0-9]/g, ''));

      let shares = 0;
      if (likeCount >= 100 && likeCount < 1000) shares = 50;
      else if (likeCount >= 1000 && likeCount <= 5000) shares = 100;
      else if (likeCount > 5000) shares = 150;

      for (let i = 0; i < shares; i++) {
        try {
          await page.click('button[data-e2e="share-icon"]');
          await page.click('button[data-e2e="copy-link"]');
        } catch {}
      }

      await sendTelegramMessage(`📹 ${videoUrl}\n❤️ ${likeCount} likes\n🚀 Shared ${shares}x`);
    }
  } catch (err) {
    const screenshotPath = `/app/screenshot-${username}.png`;
    await page.screenshot({ path: screenshotPath });
    await sendTelegramPhoto(screenshotPath, `⚠️ Error scraping ${username}`);
    throw err;
  } finally {
    await browser.close();
  }
}