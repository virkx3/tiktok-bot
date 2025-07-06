const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

puppeteer.use(StealthPlugin());

const TELEGRAM_TOKEN = "8059719971:AAGEB3EcDYxjlNHf8lbyQQhBLAsqe1eDlHE";
const TELEGRAM_USER_ID = 1098100073;
const bot = new TelegramBot(TELEGRAM_TOKEN);

const TARGETS = ["its.sahiba2233", "iamvirk"];
let processed = fs.existsSync("processed.json") ? JSON.parse(fs.readFileSync("processed.json")) : {};

function log(msg) {
  const time = new Date().toISOString();
  const fullMsg = `[${time}] ${msg}`;
  console.log(fullMsg);
  fs.appendFileSync("log.txt", fullMsg + "\n");
  bot.sendMessage(TELEGRAM_USER_ID, msg).catch(() => {});
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extractVideoId(url) {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

async function likeAndShare(page, url, likes, videoId) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForTimeout(3000);
    log(`🎯 New post: ${url}`);

    try {
      await page.click("button[data-e2e='like-button']");
      log("❤️ Liked");
    } catch {
      log("❌ Like failed");
    }

    const shareCount =
      likes < 1000
        ? randomBetween(30, 50)
        : likes < 5000
        ? randomBetween(50, 100)
        : randomBetween(100, 150);

    let shared = 0;
    for (let i = 0; i < shareCount; i++) {
      try {
        await page.click("button[data-e2e='share-button']");
        await page.waitForTimeout(500);
        await page.click("button[data-e2e='copy-link']");
        await page.waitForTimeout(1000);
        shared++;
      } catch {
        break;
      }
    }

    log(`🔁 Shared ${shared}x`);
    processed[videoId] = true;
    fs.writeFileSync("processed.json", JSON.stringify(processed));
  } catch (err) {
    log(`❌ Error: ${err.message}`);
  }
}

async function startBot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 });

  for (const username of TARGETS) {
    const profileUrl = `https://www.tiktok.com/@${username}`;
    log(`📲 Visiting profile: ${profileUrl}`);

    try {
      await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await page.waitForTimeout(3000);

      const videoLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href*='/video/']")).map(a => a.href)
      );

      const last10Links = [...new Set(videoLinks)].slice(0, 10);

      for (const url of last10Links) {
        const videoId = extractVideoId(url);
        if (!videoId || processed[videoId]) {
          log(`♻️ Skipping already processed: ${url}`);
          continue;
        }

        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
        await page.waitForTimeout(3000);

        const likes = await page.evaluate(() => {
          const el = document.querySelector("strong[data-e2e='like-count']");
          return el ? parseInt(el.innerText.replace(/\D/g, '')) : 0;
        });

        await likeAndShare(page, url, likes, videoId);
      }
    } catch (err) {
      log(`❌ Error with @${username}: ${err.message}`);
    }
  }

  await browser.close();
  log("✅ Cycle complete. Sleeping 2 hours...");
  setTimeout(startBot, 2 * 60 * 60 * 1000); // repeat every 2 hours
}

startBot();
