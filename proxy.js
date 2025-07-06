const fetch = require("node-fetch");

const PROXY_SOURCE = "https://raw.githubusercontent.com/databay-labs/free-proxy-list/master/socks5.txt";

async function getProxy() {
  try {
    const res = await fetch(PROXY_SOURCE);
    const text = await res.text();

    const proxies = text
      .split("\n")
      .map(p => p.trim())
      .filter(p => p && !p.startsWith("#"));

    if (proxies.length === 0) return null;

    const selected = proxies[Math.floor(Math.random() * proxies.length)];
    return `socks5://${selected}`;
  } catch (err) {
    console.error("❌ Failed to fetch proxy:", err.message);
    return null;
  }
}

module.exports = getProxy;