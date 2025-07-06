const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')();
const axios = require('axios');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const HttpsProxyAgent = require('https-proxy-agent');
const SocksProxyAgent = require('socks-proxy-agent');

// Plugins
puppeteer.use(StealthPlugin);

// CONFIG
const TELEGRAM_BOT_TOKEN = '7596985533:AAE8PFpoOEpgYM_OuI5r7hqKqUqvrEKh8iA';
const TELEGRAM_CHANNEL = '@virkx3proxy';
const TELEGRAM_USER_ID = 1098100073;
const TARGET_USERNAMES = ['its.sahiba2233', 'iamvirk'];
const GITHUB_PROXY_URL = 'https://raw.githubusercontent.com/databay-labs/free-proxy-list/master/socks5.txt';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
let processedPosts = new Set();
let proxyCache = [];

// Logging
function log(msg) {
  const time = new Date().toISOString();
  const fullMsg = `[${time}] ${msg}`;
  console.log(fullMsg);
  fs.appendFileSync("log.txt", fullMsg + "\n");
  bot.sendMessage(TELEGRAM_USER_ID, fullMsg).catch(() => {});
}

// Utils
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get proxy geolocation
async function getCountry(proxy) {
  try {
    const response = await axios.get('https://ipapi.co/json/', {
      timeout: 8000,
      httpsAgent: proxy.startsWith('socks') ? new SocksProxyAgent('socks://' + proxy) : new HttpsProxyAgent('http://' + proxy),
    });
    return response.data.country_name || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Parse proxies from Telegram
async function getTelegramProxies() {
  try {
    const updates = await bot.getUpdates();
    const proxyMsgs = updates.flatMap(u =>
      u.channel_post?.chat?.username === TELEGRAM_CHANNEL.replace('@', '') &&
      u.channel_post?.text ? [u.channel_post.text] : []
    );

    const proxies = [];
    for (const msg of proxyMsgs) {
      const lines = msg.split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^(\d{1,3}(\.\d{1,3}){3}):(\d{2,5})$/);
        if (match) proxies.push(match[0]);
      }
    }

    return [...new Set(proxies)];
  } catch (err) {
    log(`❌ Failed to fetch Telegram proxies: ${err.message}`);
    return [];
  }
}

// GitHub fallback proxies
async function getGithubProxies() {
  try {
    const res = await axios.get(GITHUB_PROXY_URL);
    return res.data.split('\n')
      .map(l => l.trim())
      .filter(l => /^(\d{1,3}\.){3}\d{1,3}:\d+$/.test(l));
  } catch (err) {
    log(`❌ Failed to fetch GitHub proxies: ${err.message}`);
    return [];
  }
}

// Validate proxy for TikTok access
async function validateProxy(proxy) {
  try {
    const testUrl = 'https://www.tiktok.com';
    const agent = proxy.startsWith('socks') ?
      new SocksProxyAgent('socks://' + proxy) :
      new HttpsProxyAgent('http://' + proxy);

    const res = await axios.get(testUrl, { httpsAgent: agent, timeout: 10000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

// Get a working proxy with geolocation
async function getWorkingProxy() {
  const allProxies = [...proxyCache];

  if (allProxies.length === 0) {
    log('⚠️ No Telegram proxies, loading GitHub fallback...');
    const telegramProxies = await getTelegramProxies();
    const githubProxies = await getGithubProxies();
    proxyCache = [...telegramProxies, ...githubProxies];
    log(`📦 GitHub fallback proxies cached: ${proxyCache.length}`);
  }

  for (const proxy of [...proxyCache]) {
    log(`🌐 Testing proxy: ${proxy}`);
    const country = await getCountry(proxy);
    if (country === 'India') {
      log(`❌ Skipping Indian proxy (${proxy})`);
      continue;
    }
    if (await validateProxy(proxy)) {
      log(`✅ Working proxy: ${proxy} (${country})`);
      return { proxy, country };
    }
  }

  return null;
}

// Puppeteer Bot Action
async function sharePosts(username, proxy) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [`--proxy-server=${proxy}`],
  });

  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
  );

  try {
    const profileUrl = `https://www.tiktok.com/@${username}`;
    log(`📲 Visiting: ${profileUrl}`);
    await page.goto(profileUrl, { timeout: 60000 });

    const postUrls = await page.$$eval('a[href*="/video/"]', links =>
      links.map(a => a.href).slice(0, 10)
    );

    for (const url of postUrls) {
      if (processedPosts.has(url)) {
        log(`♻️ Skipped: ${url}`);
        continue;
      }

      log(`🎯 Targeting: ${url}`);
      await page.goto(url, { timeout: 60000 });

      await page.waitForTimeout(getRandomInt(1000, 2000));
      const likes = await page.$eval('strong[data-e2e="like-count"]', el => parseInt(el.textContent.replace(/[^\d]/g, '')));
      let shares = 0;

      if (likes < 1000) shares = getRandomInt(30, 50);
      else if (likes < 5000) shares = getRandomInt(50, 100);
      else shares = getRandomInt(100, 150);

      for (let i = 0; i < shares; i++) {
        await page.click('button[data-e2e="share-icon"]');
        await page.waitForSelector('button[data-e2e="share-copylink"]', { timeout: 5000 });
        await page.click('button[data-e2e="share-copylink"]');
        await page.waitForTimeout(getRandomInt(500, 1000));
      }

      log(`🔁 Shared ${shares}x (likes: ${likes})`);
      processedPosts.add(url);

      // Rotate proxy after 1–3 posts
      if (getRandomInt(1, 3) === 1) break;
    }

  } catch (err) {
    log(`❌ Error @${username}: ${err.message}`);
  } finally {
    await browser.close();
  }
}

// Runner
async function startBot() {
  const proxyInfo = await getWorkingProxy();
  if (!proxyInfo) {
    log('❌ No working proxies');
    return;
  }

  for (const username of TARGET_USERNAMES) {
    await sharePosts(username, proxyInfo.proxy);
    await delay(getRandomInt(3000, 5000));
  }

  log('✅ Cycle complete. Sleeping 5 minutes...');
  setTimeout(startBot, 5 * 60 * 1000);
}

startBot();
