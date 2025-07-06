// share.js
import { chromium } from 'playwright';

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function shareVideo(video, count, proxy) {
  const browser = await chromium.launch({
    headless: true,
    proxy: proxy ? { server: proxy } : undefined,
  });

  const page = await browser.newPage();
  try {
    await page.goto(video.url, { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.mouse.wheel(0, 400);

    for (let i = 0; i < count; i++) {
      // Simulate delay between each share
      await new Promise(res => setTimeout(res, rand(200, 500)));
    }

    await browser.close();
    return true;
  } catch (err) {
    console.warn(`❌ Puppeteer failed for ${video.url} — ${err.message}`);
    await browser.close();
    return false;
  }
}
