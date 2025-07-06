// index.js require("dotenv").config(); const puppeteer = require("puppeteer-extra"); const StealthPlugin = require("puppeteer-extra-plugin-stealth"); const TelegramBot = require("node-telegram-bot-api"); const fs = require("fs"); const path = require("path"); const axios = require("axios"); const HttpsProxyAgent = require("https-proxy-agent");

const processedPath = path.join(__dirname, "processed.json"); const logPath = path.join(__dirname, "log.txt");

puppeteer.use(StealthPlugin());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false }); const telegramUserId = process.env.TELEGRAM_USER_ID; const proxyChannel = process.env.PROXY_CHANNEL; const usernames = process.env.TIKTOK_USERNAMES.split(",").map(u => u.trim());

function log(message) { const logMessage = [${new Date().toISOString()}] ${message}; console.log(logMessage); fs.appendFileSync(logPath, logMessage + "\n"); if (telegramUserId) bot.sendMessage(telegramUserId, logMessage).catch(() => {}); }

function loadProcessed() { try { return JSON.parse(fs.readFileSync(processedPath)); } catch { return {}; } }

function saveProcessed(data) { fs.writeFileSync(processedPath, JSON.stringify(data, null, 2)); }

async function getLatestProxies() { const updates = await bot.getUpdates(); const messages = updates.map(u => u.channel_post).filter(Boolean); for (let msg of messages.reverse()) { if (msg.chat && msg.chat.username === proxyChannel.replace("@", "")) { const proxies = msg.text.match(/\b(?:\d{1,3}.){3}\d{1,3}:\d{2,5}\b/g); if (proxies && proxies.length) return proxies; } } return []; }

async function testProxy(proxy) { try { const agent = new HttpsProxyAgent(http://${proxy}); const res = await axios.get("https://www.tiktok.com", { httpsAgent: agent, timeout: 8000 }); return res.status === 200; } catch { return false; } }

async function getWorkingProxy() { const proxies = await getLatestProxies(); for (let proxy of proxies) { log(Testing proxy: ${proxy}); if (await testProxy(proxy)) { log(✅ Working proxy: ${proxy}); return proxy; } } log("❌ No working proxies found"); return null; }

async function startBot() { const processed = loadProcessed(); const proxy = await getWorkingProxy(); if (!proxy) return;

const browser = await puppeteer.launch({ headless: true, args: [ --proxy-server=http://${proxy}, "--no-sandbox", "--disable-setuid-sandbox" ] });

const context = await browser.createIncognitoBrowserContext(); const page = await context.newPage();

await page.setUserAgent( "Mozilla/5.0 (Linux; Android 11; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.97 Mobile Safari/537.36 TikTok/26.1.3" ); await page.setViewport({ width: 390, height: 844, isMobile: true });

// Load cookies const cookiesPath = path.join(__dirname, "cookies.json"); if (fs.existsSync(cookiesPath)) { const cookies = JSON.parse(fs.readFileSync(cookiesPath)); await page.setCookie(...cookies); } else { log("❌ No TikTok cookies found. Please login manually and save them as cookies.json"); await browser.close(); return; }

for (let username of usernames) { try { const profileUrl = https://www.tiktok.com/@${username}; log(📲 Visiting profile: ${profileUrl}); await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 60000 }); await page.waitForTimeout(5000);

const videoLinks = await page.$$eval("a", as =>
    as.map(a => a.href).filter(h => h.includes("/video/"))
  );

  for (let link of [...new Set(videoLinks)].slice(0, 10)) {
    const videoId = link.split("/").filter(Boolean).pop();
    if (processed[videoId]) continue;

    log(`➡️ Processing post: ${link}`);
    await page.goto(link, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);

    // Like the video
    try {
      await page.click('span[data-e2e="like-icon"]');
      log("❤️ Liked");
    } catch {
      log("⚠️ Like button not found or already liked");
    }

    // Get like count
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

await browser.close(); log("✅ Cycle complete. Sleeping 2 hours..."); setTimeout(startBot, 2 * 60 * 60 * 1000); }

startBot();

