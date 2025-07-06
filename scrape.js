const { chromium } = require('playwright');
const { getWorkingProxy } = require('./proxy');
const { sendTelegramMessage } = require('./telegram');

async function scrape(username) {
  const proxy = await getWorkingProxy();
  await sendTelegramMessage(`🌐 Using proxy: ${proxy || 'None'}`);

  const browser = await chromium.launch({
    headless: true,
    proxy: proxy ? { server: `socks5://${proxy}` } : undefined,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`https://www.tiktok.com/@${username}`, { timeout: 20000 });
    // scraping logic
  } catch (err) {
    await sendTelegramMessage(`❌ Scraping failed for ${username}: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = { scrape };