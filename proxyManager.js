const fs = require('fs');
let proxies = [];
let currentIndex = 0;

function loadProxies() {
  try {
    proxies = fs.readFileSync('./proxy.txt', 'utf-8')
      .split('\n')
      .map(p => p.trim())
      .filter(p => p && !p.includes('IN') && !p.startsWith('#'));
  } catch (e) {
    console.warn('⚠️ Could not load proxy.txt:', e.message);
    proxies = [];
  }
}

function getNextProxy() {
  if (proxies.length === 0) loadProxies();
  if (proxies.length === 0) return null;

  const proxy = proxies[currentIndex];
  currentIndex = (currentIndex + 1) % proxies.length;
  return proxy;
}

module.exports = { getNextProxy };
