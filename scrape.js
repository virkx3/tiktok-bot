const playwright = require('playwright');
const { getWorkingProxy } = require('./proxy');
const login = require('./tiktok-login');

async function scrapeVideos(username) {
  try {
    const proxy = await getWorkingProxy();
    const browser = await playwright.chromium.launch({
      headless: true,
      proxy: proxy ? { server: `socks5://${proxy}` } : undefined,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await login(page);

    await page.goto(`https://www.tiktok.com/@${username}`, { timeout: 60000 });
    await page.waitForSelector('div[data-e2e="user-post-item-list"]', { timeout: 20000 });

    const videos = await page.$$eval('div[data-e2e="user-post-item"] a', links =>
      links.map(link => ({
        url: link.href,
        likes: parseInt(
          link.querySelector('[data-e2e="like-count"]')?.innerText.replace(/[^\d]/g, '') || '0',
          10
        )
      }))
    );

    await browser.close();
    return videos;
  } catch (err) {
    console.error(`❌ Scraping error for ${username}: ${err.message}`);
    return null;
  }
}

module.exports = scrapeVideos;