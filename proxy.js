const axios = require('axios');

async function getProxies() {
  try {
    const res = await axios.get('https://raw.githubusercontent.com/SoliSpirit/proxy-list/main/socks5.txt');
    const rawProxies = res.data.split('\n').map(p => p.trim()).filter(Boolean);

    // Optional: Filter only SOCKS5-looking ports (1080 and other common ones)
    const socks5Ports = [1080, 9050, 9150];
    const socks5Proxies = rawProxies.filter(proxy => {
      const port = parseInt(proxy.split(':')[1]);
      return socks5Ports.includes(port);
    });

    return socks5Proxies;
  } catch (err) {
    console.error('❌ Failed to fetch proxies:', err.message);
    return [];
  }
}

module.exports = { getProxies };