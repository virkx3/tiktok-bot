// scrape.js
import { chromium } from 'playwright';

export async function scrapeUserVideos(username) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const profileUrl = `https://www.tiktok.com/@${username}`;
  try {
    await page.goto(profileUrl, { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const videos = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('div[data-e2e="user-post-item"] a'));
  return items.slice(0, 10).map(a => {
    const url = a.href;
    const idMatch = url.match(/\/video\/(\d+)/);
    return {
      id: idMatch ? idMatch[1] : url,
      url
    };
  });
});

    for (const video of videos) {
      try {
        const videoPage = await browser.newPage();
        await videoPage.goto(video.url, { timeout: 30000, waitUntil: 'domcontentloaded' });
        await videoPage.waitForTimeout(1500);

        const { likes, shares } = await videoPage.evaluate(() => {
          const getCount = (selector) => {
            const el = document.querySelector(selector);
            if (!el) return 0;
            const text = el.innerText.replace(/[^\\d\\.kKmM]/g, '').toLowerCase();
            if (text.endsWith('k')) return Math.round(parseFloat(text) * 1000);
            if (text.endsWith('m')) return Math.round(parseFloat(text) * 1000000);
            return parseInt(text) || 0;
          };

          return {
            likes: getCount('[data-e2e="like-count"]'),
            shares: getCount('[data-e2e="share-count"]')
          };
        });

        video.likes = likes;
        video.shares = shares;
        await videoPage.close();
      } catch (err) {
        console.warn(`⚠️ Failed to extract metrics from ${video.url}`);
        video.likes = 0;
        video.shares = 0;
      }
    }

    await browser.close();
    return videos;
  } catch (err) {
    await browser.close();
    console.error(`❌ Failed to load profile: ${profileUrl}`);
    return [];
  }
}
