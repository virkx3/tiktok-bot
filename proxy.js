import fs from 'fs/promises';
import axios from 'axios';

export async function loadProxies() {
  const raw = await fs.readFile('proxy.txt', 'utf8');
  const proxies = raw.split('\n').map(p => p.trim()).filter(Boolean);
  const validProxies = [];

  for (const proxy of proxies) {
    try {
      const browser = await import('playwright').then(p => p.chromium.launch({
        headless: true,
        proxy: { server: `socks5://${proxy}` }
      }));
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('https://www.tiktok.com', { timeout: 15000 });
      const ip = await page.evaluate(() => fetch('https://api.ipify.org').then(res => res.text()));
      const geo = await axios.get(`http://ip-api.com/json/${ip}`);
      await browser.close();

      if (geo.data.country !== 'India') validProxies.push(proxy);
    } catch {
      // skip invalid proxy
    }
  }

  return validProxies;
}

let index = 0;
export async function getNextProxy(proxies) {
  if (!proxies.length) return null;
  const proxy = proxies[index % proxies.length];
  index++;
  return proxy;
}