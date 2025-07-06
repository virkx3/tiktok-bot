const scrape = require('./scrape');
const sendLog = require('./telegram');
const { loadProxies } = require('./proxyManager');

const TARGET_USERS = ['its.sahiba2233', 'iamvirk'];

async function run() {
  sendLog('✅ Bot started');
  loadProxies();

  for (const username of TARGET_USERS) {
    await scrape(username);
  }

  // Re-run every 2 hours
  setTimeout(run, 2 * 60 * 60 * 1000);
}

run();