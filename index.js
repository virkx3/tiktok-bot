// index.js
require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent");

const processedPath = path.join(__dirname, "processed.json");
const logPath = path.join(__dirname, "log.txt");

puppeteer.use(StealthPlugin());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const telegramUserId = process.env.TELEGRAM_USER_ID;
const proxyChannel = process.env.PROXY_CHANNEL;
const usernames = process.env.TIKTOK_USERNAMES.split(",").map(u => u.trim());

function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logPath, logMessage + "\n");
  if (telegramUserId) bot.sendMessage(telegramUserId, logMessage).catch(() => {});
}

function loadProcessed() {
  try {
    return JSON.parse(fs.readFileSync(processedPath));
  } catch {
    return {};
  }
}

function saveProcessed(data) {
