const https = require('https');

let proxies = [];

function filterValid(proxyList) {
  return proxyList.filter(p => !p.includes('IN') && !p.includes('India'));
}

function fetchProxies() {
  return new Promise((resolve) => {
    https.get('https://raw.githubusercontent.com/databay-labs/free-proxy-list/master/socks5.txt', res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        proxies = filterValid(data.split('\n').map(line => line.trim()).filter(Boolean));
        resolve();
      });
    });
  });
}

async function getWorkingProxy() {
  if (proxies.length === 0) await fetchProxies();
  return proxies[Math.floor(Math.random() * proxies.length)];
}

module.exports = { getWorkingProxy };