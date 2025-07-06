require("dotenv").config();
const { getLatestVideos } = require("./scrape");
const { shareVideo } = require("./share");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES) || 5;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const sharedFilePath = path.join(__dirname, "shared.json");

const sendTelegramLog = async (message) => {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_USER_ID,
        text: message,
      }),
    });
  } catch (e) {
    console.error("❌ Telegram error:", e.message);
  }
};

const loadShared = () => {
  try {
    return JSON.parse(fs.readFileSync(sharedFilePath, "utf8"));
  } catch {
    return [];
  }
};

const saveShared = (data) => {
  fs.writeFileSync(sharedFilePath, JSON.stringify(data, null, 2));
};

const getShareTargetCount = (likes) => {
  if (likes < 100) return 0;
  if (likes < 1000) return 50;
  if (likes <= 5000) return 100;
  return 150;
};

const runBot = async () => {
  console.log("✅ Bot started");
  await sendTelegramLog("🚀 TikTok Share Bot started!");

  const usernames = ["its.sahiba2233", "iamvirk"];
  let shared = loadShared();

  for (const username of usernames) {
    console.log(`🔍 Scraping: ${username}`);
    const videos = await getLatestVideos(username);
    for (const video of videos) {
      if (shared.includes(video.url)) continue;

      const shares = getShareTargetCount(video.likes);
      if (shares === 0) continue;

      await sendTelegramLog(`📹 Sharing ${video.url} (${video.likes} likes → ${shares} shares)`);

      const result = await shareVideo(video.url, shares);
      if (result) {
        shared.push(video.url);
        saveShared(shared);
        await sendTelegramLog(`✅ Shared: ${video.url}`);
      } else {
        await sendTelegramLog(`⚠️ Failed to share: ${video.url}`);
      }
    }
  }
};

runBot();
setInterval(runBot, INTERVAL_MINUTES * 60 * 1000);

process.on("unhandledRejection", err => {
  console.error("💥 Unhandled error:", err);
  sendTelegramLog(`💥 Bot crashed: ${err.message}`);
});