// index.js
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { shareVideo } from './share.js';
import { scrapeUserVideos } from './scrape.js';
import { getProxy } from './proxy.js';
import fetch from 'node-fetch';

const TARGET_USERS = ['its.sahiba2233', 'iamvirk'];
const INTERVAL_MINUTES = 5;
const RESHARE_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours

const shared = fs.existsSync('shared.json') ? JSON.parse(fs.readFileSync('shared.json')) : {};
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync('log.txt', line + '\n');
  telegramLog(msg);
};

const telegramLog = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_USER_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
};

const getShareTargetCount = (likes) => {
  if (likes < 100) return 0;
  if (likes < 1000) return rand(30, 50);
  if (likes <= 5000) return rand(50, 100);
  return rand(100, 150);
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function mainLoop() {
  for (const username of TARGET_USERS) {
    const videos = await scrapeUserVideos(username);
    for (const video of videos.slice(0, 10)) {
      const key = video.id;
      const lastShared = shared[key];
      const now = Date.now();

      if (video.likes < 100) {
        log(`Skipped ${key} - not enough likes (${video.likes})`);
        continue;
      }
      if (video.shares >= 150) {
        log(`Skipped ${key} - already has ${video.shares} shares`);
        continue;
      }
      if (lastShared && now - lastShared < RESHARE_COOLDOWN) {
        log(`Skipped ${key} - shared recently`);
        continue;
      }

      const shareCount = getShareTargetCount(video.likes);
      const proxy = await getProxy();
      const success = await shareVideo(video, shareCount, proxy);

      if (success) {
        shared[key] = Date.now();
        fs.writeFileSync('shared.json', JSON.stringify(shared, null, 2));
        log(`Shared ${key} with ${shareCount} shares`);
      } else {
        log(`Failed to share ${key}`);
      }
    }
  }
}

mainLoop();
setInterval(mainLoop, INTERVAL_MINUTES * 60 * 1000);
