const scrapeVideos = require('./scrape');
const shareVideo = require('./share');
const sendTelegramLog = require('./telegram');
const fs = require('fs');

const usernames = ['its.sahiba2233', 'iamvirk'];
const CHECK_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours
let sharedData = {};

try {
  sharedData = JSON.parse(fs.readFileSync('data.json'));
} catch {
  sharedData = {};
}

async function processUsername(username) {
  const videos = await scrapeVideos(username);
  if (!videos) return;

  for (const { url, likes } of videos) {
    const key = `${username}:${url}`;
    const alreadyShared = sharedData[key] || 0;

    let targetShares = 0;
    if (likes >= 5000) targetShares = 150;
    else if (likes >= 1000) targetShares = 100;
    else if (likes >= 100) targetShares = 50;

    const remainingShares = targetShares - alreadyShared;
    if (remainingShares > 0) {
      await sendTelegramLog(`📤 Sharing ${remainingShares}x: ${url}`);
      const success = await shareVideo(url, remainingShares);
      if (success) {
        sharedData[key] = alreadyShared + remainingShares;
        fs.writeFileSync('data.json', JSON.stringify(sharedData, null, 2));
      }
    }
  }
}

async function startBot() {
  await sendTelegramLog('✅ Bot started');
  for (const username of usernames) {
    await sendTelegramLog(`🔍 Scraping: ${username}`);
    await processUsername(username);
  }
  setTimeout(startBot, CHECK_INTERVAL);
}

startBot();