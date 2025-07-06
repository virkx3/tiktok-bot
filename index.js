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
