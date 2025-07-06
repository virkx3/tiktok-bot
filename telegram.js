const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw';
const USER_ID = '1098100073';

const bot = new TelegramBot(TOKEN);

function sendLog(message) {
  bot.sendMessage(USER_ID, message, { parse_mode: 'Markdown' });
}

module.exports = sendLog;