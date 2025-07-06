const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { getNextProxy } = require('./proxyManager');
const { sendTelegramLog } = require('./telegram');

const shareThresholds = [
  { minLikes: 5000, shares: 150 },
  { minLikes: 1000, shares: 100 },
  { minLikes: 100, shares: 50 },
  { minLikes: 0, shares: 0 }
];

const sharedHistory = {};

async function scrape(username) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const proxy = getNextProxy();
    console.log(`🌐 Using proxy: ${proxy || 'None'}`);
    console.log(`🔍 Scraping: ${username} (Attempt ${attempt})`);

    try {
      const browser = await chromium.launch({
        headless: true,
        proxy: proxy ? { server: `socks5://${proxy}` } : undefined,
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
        locale: 'en-US'
      });

      const page = await context.newPage();
      const url = `https://www.tiktok.com/@${username}`;
      console.log(`🌐 Navigating to ${url}`);
      await page.goto(url, { timeout: 20000 });

      console.log('🔍 Waiting for video list...');
      await page.waitForSelector('div[data-e2e="user-post-item-list"]', { timeout: 15000 });

      const videos = await page.$$eval('div[data-e2e="user-post-item"] a', links =>
        links.map(link => link.href)
      );

      console.log(`🎬 Found ${videos.length} videos`);

      for (const videoUrl of videos) {
        const videoId = videoUrl.split('/').pop();
        await page.goto(videoUrl, { timeout: 15000 });
        await page.waitForTimeout(5000);

        const likes = await page.$eval('strong[data-e2e="like-count"]', el =>
          parseInt(el.textContent.replace(/[^\d]/g, '') || '0')
        );

        const previousShares = sharedHistory[videoId] || 0;
        const shareTarget = shareThresholds.find(t => likes >= t.minLikes).shares;

        const sharesToDo = Math.max(shareTarget - previousShares, 0);
        if (sharesToDo > 0) {
          console.log(`📈 Sharing ${videoId} - ${sharesToDo} times`);
          for (let i = 0; i < sharesToDo; i++) {
            try {
              await page.click('button[data-e2e="share-icon"]');
              await page.click('button[data-e2e="copy-link"]');
              await page.waitForTimeout(500);
            } catch (err) {
              console.log(`⚠️ Share click failed: ${err.message}`);
            }
          }

          sharedHistory[videoId] = previousShares + sharesToDo;
          await sendTelegramLog(`✅ Shared [${videoId}] ${sharesToDo}x (Likes: ${likes})`);
        } else {
          console.log(`⏭️ Skipping [${videoId}] (Likes: ${likes}, Already Shared: ${previousShares})`);
        }
      }

      await browser.close();
      break;
    } catch (err) {
      console.error(`⚠️ Scraping error for ${username} (attempt ${attempt}): ${err.message}`);
      await sendTelegramLog(`❌ Error scraping ${username}: ${err.message}`);
      const screenshotPath = path.join(__dirname, `screenshot-${username}.png`);
      fs.writeFileSync(screenshotPath, await page.screenshot());
    }
  }
}

module.exports = scrape;