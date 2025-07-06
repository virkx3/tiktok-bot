// index.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');
const http = require('http');
const readline = require('readline');
const path = require('path');

puppeteer.use(StealthPlugin());

const TELEGRAM_BOT_TOKEN = '8059719971:AAGEB3EcDYxjlNHf8lbyQQhBLAsqe1eDlHE';
const TELEGRAM_USER_ID = 1098100073;
const TELEGRAM_CHANNEL = '@virkx3proxy';
const GITHUB_PROXY_URL = 'https://raw.githubusercontent.com/databay-labs/free-proxy-list/master/socks5.txt';
const PROFILES = ['its.sahiba2233', 'iamvirk'];

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
const processed = new Set();
let proxyCache = [];

function log(msg) {
  const time = new Date().toISOString();
  const fullMsg = `[${time}] ${msg}`;
  console.log(fullMsg);
  fs.appendFileSync('log.txt', fullMsg + '\n');
  bot.sendMessage(TELEGRAM_USER_ID, msg).catch(() => {});
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function fetchGitHubProxies() {
  return new Promise((resolve) => {
