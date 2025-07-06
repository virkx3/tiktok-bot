import fetch from 'node-fetch';

export async function getProxy() {
  let proxies = [];
  try {
    proxies = await fetchTelegramProxies();
    if (!proxies.length) throw 'Telegram failed';
  } catch (e) {
    proxies = await fetchGitHubProxies();
  }
  proxies = proxies.filter(ip => !ip.includes('.in'));
  return proxies.length ? `socks5://${proxies[Math.floor(Math.random() * proxies.length)]}` : null;
}

async function fetchTelegramProxies() {
  try {
    const html = await fetch('https://t.me/s/virkx3proxy').then(res => res.text());
    return [...new Set(Array.from(html.matchAll(/\b\d+\.\d+\.\d+\.\d+:\d+\b/g)).map(m => m[0]))];
  } catch (e) {
    return [];
  }
}

async function fetchGitHubProxies() {
  try {
    const raw = await fetch('https://raw.githubusercontent.com/databay-labs/free-proxy-list/master/socks5.txt').then(res => res.text());
    return raw.split('\n').map(p => p.trim()).filter(p => p);
  } catch (e) {
    return [];
  }
}
