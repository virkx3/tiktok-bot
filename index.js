const scrapeUserVideos = require('./scrape');
const fs = require('fs');

const targets = ['its.sahiba2233', 'iamvirk'];
const proxyListPath = './socks5.txt'; // you must have saved proxies here

function getRandomProxy() {
  if (!fs.existsSync(proxyListPath)) return null;
  const proxies = fs.readFileSync(proxyListPath, 'utf-8')
    .split('\n')
    .map(p => p.trim())
    .filter(p => p && !p.includes('IN')); // skip India proxies
  return proxies[Math.floor(Math.random() * proxies.length)] || null;
}

(async () => {
  console.log("✅ Bot started");
  for (const user of targets) {
    const proxy = getRandomProxy();
    console.log(`🌐 Using proxy: ${proxy || 'None'}`);
    await scrapeUserVideos(user, proxy);
  }
})();