const axios = require('axios');

const botToken = '7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw';
const userId = '1098100073';

async function sendTelegramLog(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: userId,
      text: message,
    });
  } catch (e) {
    console.error('❌ Failed to send Telegram log:', e.message);
  }
}

module.exports = { sendTelegramLog };