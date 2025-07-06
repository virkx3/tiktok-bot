require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent");

puppeteer.use(StealthPlugin());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const telegramUserId = process.env.TELEGRAM_USER_ID;
const proxyChannel = process.env.PROXY_CHANNEL;
const usernames = process.env.TIKTOK_USERNAMES.split(",").map(u => u.trim());

const loginUsername = "ssociaixzl3s";
const loginPassword = "Virksaab@12345";

const testedProxies = new Set();

function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync("log.txt", logMessage + "\n");
  if (telegramUserId) bot.sendMessage(telegramUserId, logMessage).catch(() => {});
}

function loadProcessed() {
  try {
    return JSON.parse(fs.readFileSync("processed.json"));
  } catch {
    return {};
  }
}

function saveProcessed(data) {
  fs.writeFileSync("processed.json", JSON.stringify(data, null, 2));
}

async function getLatestProxiesFromTelegram() {
  try {
    const { data } = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`);
    const proxies = [];

    for (let update of data.result.reverse()) {
      const text = update?.channel_post?.text || "";
      if (text.includes("proxies can reach Instagram")) {
        const matches = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}:\d{2,5}\b/g);
        if (matches) {
          for (let proxy of matches) {
            if (!testedProxies.has(proxy)) proxies.push(proxy);
          }
        }
      }
    }

    return proxies;
  } catch (err) {
    log("❌ Failed to get proxies from Telegram: " + err.message);
    return [];
  }
}

async function testProxy(proxy) {
  try {
    const agent = new HttpsProxyAgent(`http://${proxy}`);
    const res = await axios.get("https://www.tiktok.com", {
      httpsAgent: agent,
      timeout: 8000,
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function getWorkingProxy() {
  const proxies = await getLatestProxiesFromTelegram();
  if (!proxies.length) {
    log("❌ No new proxies found from Telegram");
    return null;
  }

  for (let proxy of proxies) {
    testedProxies.add(proxy);
    log(`🌐 Testing proxy: ${proxy}`);
    if (await testProxy(proxy)) {
      log(`✅ Working proxy found: ${proxy}`);
      return proxy;
    }
  }

  log("❌ No working proxies after testing all");
  return null;
}

async function scrollActivity(page) {
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, 100 + Math.random() * 300);
    });
    await page.waitForTimeout(1000 + Math.random() * 2000);
  }
}

async function loginIfNeeded(page) {
  try {
    await page.goto("https://www.tiktok.com", { waitUntil: "networkidle2" });
    await page.waitForTimeout(5000);
    if (await page.$("a[href='/login']")) {
      log("🔐 Session expired, logging in...");
      await page.goto("https://www.tiktok.com/login/phone-or-email/email");
      await page.waitForSelector("input[name='email']", { timeout: 10000 });
      await page.type("input[name='email']", loginUsername, { delay: 100 });
      await page.type("input[name='password']", loginPassword, { delay: 100 });
      await page.click("button[type='submit']");
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 });
      const cookies = await page.cookies();
      fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
      log("✅ Logged in and cookies saved");
    } else {
      log("✅ Session active with cookies");
    }
  } catch (err) {
    log("❌ Login failed: " + err.message);
  }
}

async function startBot() {
  const processed = loadProcessed();
  const proxy = await getWorkingProxy();
  if (!proxy) {
    log("🕐 Retrying in 5 minutes...");
    return setTimeout(startBot, 5 * 60 * 1000);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [`--proxy-server=http://${proxy}`, "--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  await page.setUserAgent("Mozilla/5.0 (Linux; Android 11; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.97 Mobile Safari/537.36 TikTok/26.1.3");
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  if (fs.existsSync("cookies.json")) {
    const cookies = JSON.parse(fs.readFileSync("cookies.json"));
    await page.setCookie(...cookies);
  }

  await loginIfNeeded(page);

  for (let username of usernames) {
    try {
      const profileUrl = `https://www.tiktok.com/@${username}`;
      log(`📲 Visiting profile: ${profileUrl}`);
      await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await scrollActivity(page);

      const videoLinks = await page.$$eval("a", as =>
        as.map(a => a.href).filter(h => h.includes("/video/"))
      );

      for (let link of [...new Set(videoLinks)].slice(0, 10)) {
        const videoId = link.split("/").filter(Boolean).pop();
        if (processed[videoId]) continue;

        log(`➡️ Processing post: ${link}`);
        await page.goto(link, { waitUntil: "networkidle2" });
        await scrollActivity(page);

        try {
          await page.click('span[data-e2e="like-icon"]');
          log("❤️ Liked");
        } catch {
          log("⚠️ Like button not found or already liked");
        }

        let likeCount = await page.evaluate(() => {
          const el = document.querySelector('strong[data-e2e="like-count"]');
          return el ? parseInt(el.textContent.replace(/,/g, "")) : 0;
        });

        let shares = 30;
        if (likeCount >= 1000 && likeCount < 5000) shares = Math.floor(Math.random() * 51) + 50;
        else if (likeCount >= 5000) shares = Math.floor(Math.random() * 51) + 100;
        else shares = Math.floor(Math.random() * 21) + 30;

        for (let i = 0; i < shares; i++) {
          try {
            await page.click('button[data-e2e="share-button"]');
            await page.waitForSelector('div[data-e2e="copy-link"]', { timeout: 3000 });
            await page.click('div[data-e2e="copy-link"]');
            await page.waitForTimeout(Math.floor(Math.random() * 4000) + 2000);
          } catch {
            log("⚠️ Share failed");
            break;
          }
        }

        log(`✅ Shared ${shares} times (likes: ${likeCount})`);
        processed[videoId] = { liked: true, shared: true };
        saveProcessed(processed);
      }
    } catch (err) {
      log(`❌ Error with ${username}: ${err.message}`);
    }
  }

  await browser.close();
  log("✅ Cycle complete. Sleeping 2 hours...");
  setTimeout(startBot, 2 * 60 * 60 * 1000);
}

startBot();
