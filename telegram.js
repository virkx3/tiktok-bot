import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';

const token = '7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw';
const userId = 1098100073;
const bot = new TelegramBot(token, { polling: false });

export async function sendTelegramMessage(text) {
  try {
    await bot.sendMessage(userId, text, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Telegram send error:', err.message);
  }
}

export async function sendTelegramPhoto(filepath, caption) {
  try {
    await bot.sendPhoto(userId, fs.createReadStream(filepath), { caption });
  } catch (err) {
    console.error('Telegram photo error:', err.message);
  }
}