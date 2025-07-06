const playwright = require('playwright');
const fs = require('fs');
const sendLog = require('./telegram');
const { getNextProxy } = require('./proxyManager');

const sharedCounts = {}; // Keep track of how many shares already done

function getShareCount(likes) {
  if (likes < 100) return 0;
  if (likes < 1000) return 50;
  if (likes < 5000) return 100;
  return 150;
}

async function scrape(username) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const proxy = getNextProxy();
    sendLog(`🌐 Using proxy: ${proxy || 'None'}`);
    
    const browser = await playwright.chromium.launch({
      headless: true,
      proxy: proxy ? { server: `socks5://${proxy}` } : undefined,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      sendLog(`🔍 Scraping: ${username} (Attempt ${attempt})`);
      const url = `https://www.tiktok.com/@${username}`;
      await page.goto(url, { timeout: 30000, waitUntil: 'load' });
      await page.waitForSelector('div[data-e2e="user-post-item-list"]', { timeout: 15000 });

      const videoLinks = await page.$$eval('div[data-e2e="user-post-item-list"] a', links =>
        links.map(a => a.href).slice(0, 3)
      );

      for (const link of videoLinks) {
        await page.goto(link, { timeout: 30000 });
        await page.waitForSelector('strong[data-e2e="like-count"]');

        const likes = await page.$eval('strong[data-e2e="like-count"]', el =>
          Number(el.textContent.replace(/[^\d]/g, ''))
        );

        const prevShares = sharedCounts[link] || 0;
        const totalShares = getShareCount(likes);

        const sharesToDo = totalShares - prevShares;
        if (sharesToDo > 0) {
          sendLog(`📈 ${link} has ${likes} likes, sharing ${sharesToDo} times`);
          for (let i = 0; i < sharesToDo; i++) {
            try {
              await page.click('button[data-e2e="share-icon"]');
              await page.waitForSelector('button[data-e2e="copy-link"]', { timeout: 10000 });
              await page.click('button[data-e2e="copy-link"]');
              await page.waitForTimeout(500);
            } catch (err) {
              sendLog(`⚠️ Share failed: ${err.message}`);
              break;
            }
          }
          sharedCounts[link] = totalShares;
        } else {
          sendLog(`✅ ${link} already shared ${prevShares} times`);
        }
      }

      await browser.close();
      break;
    } catch (err) {
      sendLog(`⚠️ Scraping error for ${username} (attempt ${attempt}): ${err.message}`);
      const screenshotPath = `screenshot-${username}.png`;
      await page.screenshot({ path: screenshotPath }).catch(() => {});
      await browser.close();
    }
  }
}

module.exports = scrape;