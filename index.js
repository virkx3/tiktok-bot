import scrapeUser from './scrape.js';
import { loadProxies, getNextProxy } from './proxy.js';
import { sendTelegramMessage } from './telegram.js';
import targets from './targets.js';
import fs from 'fs';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
let proxies = [];
let currentProxyIndex = 0;

(async () => {
  await sendTelegramMessage('✅ Bot started');

  proxies = await loadProxies();

  while (true) {
    for (let username of targets) {
      let proxy = await getNextProxy(proxies);
      await sendTelegramMessage(`🌐 Using proxy: ${proxy || 'None'}`);
      try {
        await scrapeUser(username, proxy);
      } catch (err) {
        console.error(err.message);
        await sendTelegramMessage(`❌ Error scraping ${username}:\n${err.message}`);
      }
    }
    await delay(2 * 60 * 60 * 1000); // wait 2 hours
  }
})();