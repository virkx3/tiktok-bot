const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

puppeteer.use(StealthPlugin());

const TELEGRAM_TOKEN = "7596985533:AAE8PFpoOEpgYM_OuI5r7hqKqUqvrEKh8iA";
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

async function sharePost(page, url, likes, videoId) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    log(`🎯 Targeting: ${url}`);

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
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.click("button[data-e2e='copy-link']");
        await new Promise(resolve => setTimeout(resolve, 1000));
        shared++;
      } catch (e) {
        break;
      }
    }

    log(`🔁 Shared ${shared}x (likes: ${likes})`);
    processed[videoId] = true;
    fs.writeFileSync("processed.json", JSON.stringify(processed));
  } catch (err) {
    log(`❌ Share error: ${err.message}`);
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
    log(`📲 Visiting: ${profileUrl}`);

    const tryProfile = async () => {
      try {
        await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 60000 });
        await new Promise(r => setTimeout(r, 3000));

        const videoLinks = await page.evaluate(() =>
          Array.from(document.querySelectorAll("a[href*='/video/']")).map(a => a.href)
        );

        const last10 = [...new Set(videoLinks)].slice(0, 10);

        for (const url of last10) {
          const videoId = extractVideoId(url);
          if (!videoId || processed[videoId]) {
            log(`♻️ Skipped: ${url}`);
            continue;
          }

          await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
          await new Promise(r => setTimeout(r, 3000));

          const likes = await page.evaluate(() => {
            const el = document.querySelector("strong[data-e2e='like-count']");
            return el ? parseInt(el.innerText.replace(/\D/g, "")) : 0;
          });

          await sharePost(page, url, likes, videoId);
        }
      } catch (err) {
        log(`❌ Error @${username}: ${err.message}`);
        log(`🔁 Retrying @${username} instantly...`);
        try {
          await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 60000 });
        } catch (e2) {
          log(`❌ Second fail @${username}: ${e2.message}`);
        }
      }
    };

    await tryProfile();
  }

  await browser.close();
  log("✅ Cycle complete. Sleeping 5 minutes...");
  setTimeout(startBot, 5 * 60 * 1000); // Retry after 5 minutes
}

startBot();
