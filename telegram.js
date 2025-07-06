const axios = require("axios");

const TELEGRAM_BOT_TOKEN = "7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw";
const TELEGRAM_CHAT_ID = "1098100073"; // your Telegram ID

async function sendTelegramAlert(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });

    console.log("📬 Sent message to Telegram.");
  } catch (err) {
    console.error("❌ Telegram error:", err.message);
  }
}

module.exports = sendTelegramAlert;