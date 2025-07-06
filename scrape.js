const { chromium } = require("playwright");

async function getLatestVideos(username) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`https://www.tiktok.com/@${username}`, { timeout: 60000 });

    await page.waitForSelector("div[data-e2e='user-post-item-list']", { timeout: 20000 });

    const videos = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a")).filter(a =>
        a.href.includes("/video/") && a.querySelector("img")
      );

      return anchors.slice(0, 5).map((a) => {
        const likesElement = a.querySelector("strong");
        let likes = 0;

        if (likesElement) {
          const text = likesElement.innerText.trim().toLowerCase();
          if (text.endsWith("k")) likes = parseFloat(text) * 1000;
          else if (text.endsWith("m")) likes = parseFloat(text) * 1000000;
          else likes = parseInt(text);
        }

        return {
          url: a.href,
          likes: Math.floor(likes),
        };
      });
    });

    return videos;
  } catch (err) {
    console.error(`❌ Scraping error for ${username}:`, err.message);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { getLatestVideos };