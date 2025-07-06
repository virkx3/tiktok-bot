const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const MAX_RETRIES = 3;

async function getLatestVideos(username) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`🔁 [${username}] Attempt ${attempt}...`);

    const browser = await chromium.launch({ headless: true });

const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Linux; Android 11; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36",
});

const page = await context.newPage();

      const profileUrl = `https://www.tiktok.com/@${username}`;
      await page.goto(profileUrl, { timeout: 60000 });

      // Wait for video thumbnails
      await page.waitForSelector("img", { timeout: 20000 });

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

      await browser.close();
      return videos;

    } catch (err) {
      console.warn(`⚠️ Scraping error for ${username} (attempt ${attempt}):`, err.message);

      // Optional: Save screenshot for debugging
      try {
        const filePath = path.join(__dirname, `screenshot-${username}.png`);
        await page.screenshot({ path: filePath });
        console.log(`📸 Saved screenshot to ${filePath}`);
      } catch (_) {}

      await browser.close();
    }
  }

  console.error(`❌ Failed scraping ${username} after ${MAX_RETRIES} attempts.`);
  return [];
}

module.exports = { getLatestVideos };