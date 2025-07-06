const https = require('https');

const TELEGRAM_TOKEN = '7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw';
const TELEGRAM_USER_ID = '1098100073';

function sendTelegramLog(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_USER_ID}&text=${encodeURIComponent(message)}`;
  return new Promise((resolve) => {
    https.get(url, res => res.on('end', resolve)).on('error', resolve);
  });
}

module.exports = sendTelegramLog;