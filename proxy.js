// proxy.js
const fs = require('fs');
const { chromium } = require('playwright');

const isIndianIP = async (ip) => {
  // Use a geo-IP service or stub this out
  return false; // For now, assume false unless you want to use an API
};

const checkProxy = async (proxy) => {
  try {
    const browser = await chromium.launch({
      headless: true,
      proxy: { server: `socks5://${proxy}` },
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://www.tiktok.com', { timeout: 15000 });
    await page.waitForSelector('body', { timeout: 5000 });
    await browser.close();

    return true;
  } catch (err) {
    return false;
  }
};

const getWorkingProxy = async () => {
  const proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').filter(p => p.trim());
  for (const proxy of proxies) {
    if (await isIndianIP(proxy)) continue;

    const isValid = await checkProxy(proxy);
    if (isValid) return proxy;
  }
  return null;
};

module.exports = { getWorkingProxy };