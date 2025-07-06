// index.js
import puppeteer from 'puppeteer';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

const PROXY_CHANNEL_URL = 'https://t.me/s/virkx3proxy';
const GITHUB_PROXY_URL = 'https://raw.githubusercontent.com/databay-labs/free-proxy-list/master/socks5.txt';

const TARGET_USERS = ['its.sahiba2233', 'iamvirk'];
const MIN_LIKES = 100;
const MAX_TOTAL_SHARES = 150;
const RECHECK_INTERVAL_MINUTES = 5;
const REPEAT_SHARE_HOURS = 2;
const VIDEO_LIMIT = 10;

let shared = {};

if (fs.existsSync('./shared.json')) {
  shared = JSON.parse(fs.readFileSync('./shared.json'));
}

function log(msg) {
  console.log(msg);
  fs.appendFileSync('./log.txt', `${new Date().toISOString()} - ${msg}\n`);
  sendTelegram(msg);
}

async function sendTelegram(text) {
  try {
    await fetch(TELEGRAM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_USER_ID, text })
    });
  } catch (e) {
    fs.appendFileSync('./log.txt', `${new Date().toISOString()} - Telegram error: ${e}\n`);
  }
}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function shouldReshare(videoId) {
  if (!shared[videoId]) return true;
  const last = new Date(shared[videoId].lastShared);
  const now = new Date();
  const diff = (now - last) / 1000 / 60 / 60;
  return diff >= REPEAT_SHARE_HOURS;
}

function getShareCountBasedOnLikes(likes) {
  if (likes < 100) return 0;
  if (likes < 1000) return rand(30, 50);
  if (likes < 5000) return rand(50, 100);
  return rand(100, 150);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getProxies() {
  let proxies = [];
  try {
    const res = await fetch(GITHUB_PROXY_URL);
    const text = await res.text();
    proxies = text.split('\n').filter(p => p && !p.includes('.in'));
  } catch (e) {
    log('Proxy fetch failed: ' + e);
  }
  return proxies;
}

async function scrapeUserVideos(username) {
  return [
    {
      id: `${username}_vid1`,
      url: `https://www.tiktok.com/@${username}/video/123456789`,
      likes: 1200,
      shares: 30
    },
    {
      id: `${username}_vid2`,
      url: `https://www.tiktok.com/@${username}/video/987654321`,
      likes: 90,
      shares: 10
    },
    {
      id: `${username}_vid3`,
      url: `https://www.tiktok.com/@${username}/video/112233445`,
      likes: 400,
      shares: 130
    }
  ];
}

async function shareVideo(video, shareCount) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(video.url);
    await page.waitForTimeout(rand(1000, 3000));
    await page.evaluate(() => window.scrollBy(0, 300));
    for (let i = 0; i < shareCount; i++) {
      // Simulate click share + copy link (not literally clicking, placeholder)
      await page.waitForTimeout(rand(300, 800));
    }
    await browser.close();
    return true;
  } catch (e) {
    await browser.close();
    log(`Failed to share ${video.id}: ${e}`);
    return false;
  }
}

async function mainLoop() {
  const proxies = await getProxies();
  for (const user of TARGET_USERS) {
    const videos = await scrapeUserVideos(user);
    for (const video of videos.slice(0, VIDEO_LIMIT)) {
      const id = video.id;
      const likes = video.likes;
      const shares = video.shares;
      const prevBotShares = shared[id]?.shareCount || 0;
      const totalShares = shares + prevBotShares;

      if (likes < MIN_LIKES) {
        log(`Skipped ${id} - not enough likes (${likes})`);
        continue;
      }
      if (totalShares >= MAX_TOTAL_SHARES) {
        log(`Skipped ${id} - already has ${totalShares} shares`);
        continue;
      }
      if (!shouldReshare(id)) {
        log(`Skipped ${id} - recently shared`);
        continue;
      }

      const count = getShareCountBasedOnLikes(likes);
      const success = await shareVideo(video, count);
      if (success) {
        shared[id] = {
          lastShared: new Date().toISOString(),
          shareCount: prevBotShares + count
        };
        log(`Shared ${id} with ${count} shares`);
        fs.writeFileSync('./shared.json', JSON.stringify(shared, null, 2));
      }
    }
  }
}

setInterval(mainLoop, RECHECK_INTERVAL_MINUTES * 60 * 1000);
mainLoop();
