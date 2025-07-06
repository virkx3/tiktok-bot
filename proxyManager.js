const fs = require('fs');
let proxies = [];
let current = 0;

function loadProxies() {
  const lines = fs.readFileSync('proxy.txt', 'utf-8').split('\n').filter(Boolean);
  proxies = lines.filter(p => p.includes(':')); // Only valid proxies
  current = 0;
}

function getNextProxy() {
  if (proxies.length === 0) return null;
  const proxy = proxies[current];
  current = (current + 1) % proxies.length;
  return proxy;
}

module.exports = { loadProxies, getNextProxy };