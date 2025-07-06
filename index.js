// index.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const HttpsProxyAgent = require('https-proxy-agent');
const SocksProxyAgent = require('socks-proxy-agent');

puppeteer.use(StealthPlugin());

// === CONFIGURATION ===
const TELEGRAM_BOT_TOKEN = '7596985533:AAE8PFpoOEpgYM_OuI5r7hqKqUqvrEKh8iA';
const TELEGRAM_USER_ID = 1098100073;
const TELEGRAM_CHANNEL = 'virkx3proxy';
const ACCOUNTS = ['its.sahiba2233', 'iamvirk'];
const SESSION_FILE = './session.json';
const PROCESSED_FILE = './processed.json';
const SHARE_LIMITS = [
  { min: 100, max: 999, shares: [30, 50] },
  { min: 1000, max: 4999, shares: [50, 100] },
  { min: 5000, max: Infinity, shares: [100, 150] }
];

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

function log(msg) {
  const time = new Date().toISOString();
  const fullMsg = `[${time}] ${msg}`;
  console.log(fullMsg);
  fs.appendFileSync('log.txt', fullMsg + '\n');
  bot.sendMessage(TELEGRAM_USER_ID, msg).catch(() => {});
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchProxiesFromTelegram() {
  try {
    const updates = await bot.getUpdates({ timeout: 10 });
    const messages = updates.map(u => u.message).filter(Boolean);
    const proxies = [];
    for (const msg of messages.reverse()) {
      if (msg.chat && msg.chat.username === TELEGRAM_CHANNEL) {
        const matches = msg.text.match(/(\d+\.\d+\.\d+\.\d+):(\d+)/g);
        if (matches) proxies.push(...matches);
      }
    }
    return [...new Set(proxies)];
  } catch {
    return [];
  }
}

async function fetchProxiesFromGitHub() {
  const url = 'https://raw.githubusercontent.com/databay-labs/free-proxy-list/master/socks5.txt';
  try {
    const res = await axios.get(url);
    return res.data.split('\n').filter(line => line.includes(':'));
  } catch {
    return [];
  }
}

async function testProxy(proxy) {
  const agent = proxy.includes('1080')
    ? new SocksProxyAgent('socks5://' + proxy)
    : new HttpsProxyAgent('http://' + proxy);
  try {
    const res = await axios.get('https://www.tiktok.com', {
      timeout: 10000,
      httpsAgent: agent,
      httpAgent: agent
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function getValidProxy() {
  let proxies = await fetchProxiesFromTelegram();
  if (proxies.length === 0) {
    log('⚠️ No Telegram proxies, loading GitHub fallback...');
    proxies = await fetchProxiesFromGitHub();
    log(`📦 GitHub fallback proxies cached: ${proxies.length}`);
  }
  for (const proxy of proxies) {
    if (proxy.includes('.in')) continue; // skip Indian
    log(`🌐 Testing proxy: ${proxy}`);
    const ok = await testProxy(proxy);
    if (ok) {
      log(`✅ Working proxy: ${proxy}`);
      return proxy;
    }
  }
  log('❌ No working proxies');
  return null;
}

function getShareCount(likes) {
  const group = SHARE_LIMITS.find(r => likes >= r.min && likes <= r.max);
  if (!group) return 0;
  const [min, max] = group.shares;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getProcessed() {
  try {
    return JSON.parse(fs.readFileSync(PROCESSED_FILE));
  } catch {
    return {};
  }
}

function saveProcessed(data) {
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(data));
}

async function shareVideo(page, url, likes) {
  if (likes < 100) return false;
  const count = getShareCount(likes);
  log(`🎯 Targeting: ${url}`);
  log(`🔁 Shared 0x (likes: ${likes})`);
  for (let i = 0; i < count; i++) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(1000);
    await page.keyboard.press('ArrowDown');
    await sleep(1000);
  }
  return true;
}

async function getVideoLinks(page, username) {
  const url = `https://www.tiktok.com/@${username}`;
  log(`📲 Visiting: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('PageDown');
    await sleep(1000);
  }
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/video/"]'))
      .map(a => a.href)
      .slice(0, 10);
  });
  return [...new Set(links)];
}

async function startBot() {
  const proxy = await getValidProxy();
  if (!proxy) return;

  const args = [`--proxy-server=${proxy}`];
  const browser = await puppeteer.launch({ headless: 'new', args });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36');

  const processed = getProcessed();

  for (const user of ACCOUNTS) {
    try {
      const links = await getVideoLinks(page, user);
      for (const link of links) {
        const videoId = link.split('/').pop();
        const last = processed[videoId];
        const now = Date.now();
        if (last && now - last < 2 * 60 * 60 * 1000) {
          log(`♻️ Skipped: ${link}`);
          continue;
        }
        await page.goto(link, { timeout: 60000 });
        await sleep(3000);
        const likes = await page.evaluate(() => {
          const el = document.querySelector('[data-e2e="like-count"]');
          return el ? parseInt(el.textContent.replace(/[^\d]/g, '')) : 0;
        });
        const shared = await shareVideo(page, link, likes);
        if (shared) processed[videoId] = now;
        saveProcessed(processed);
        await sleep(3000);
      }
    } catch (err) {
      log(`❌ Error @${user}: ${err.message}`);
    }
  }
  await browser.close();
  log(`✅ Cycle complete. Sleeping 5 minutes...`);
  setTimeout(startBot, 5 * 60 * 1000);
}

startBot();
