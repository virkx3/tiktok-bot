const fetch = require("node-fetch");
const { chromium } = require("playwright");

const PROXY_SOURCE = "https://raw.githubusercontent.com/databay-labs/free-proxy-list/master/socks5.txt";

async function isProxyValid(proxy) {
  try {
    const browser = await chromium.launch({
      headless: true,
      proxy: {
        server: `socks5://${proxy}`,
      },
    });

    const page = await browser.newPage();
    await page.goto("https://www.tiktok.com", { timeout: 15000 });

    // Optional: check if redirected to banned message
    const content = await page.content();
    await browser.close();

    return !/403|blocked|unavailable|captcha/i.test(content);
  } catch (err) {
    return false;
  }
}

async function getValidProxy() {
  try {
    const res = await fetch(PROXY_SOURCE);
    const text = await res.text();

    const proxies = text
      .split("\n")
      .map(p => p.trim())
      .filter(p => p && !p.startsWith("#"));

    for (const proxy of proxies) {
      console.log(`🔍 Testing proxy: ${proxy}`);
      const isWorking = await isProxyValid(proxy);

      if (isWorking) {
        console.log(`✅ Proxy works: ${proxy}`);
        return `socks5://${proxy}`;
      } else {
        console.log(`❌ Proxy blocked or failed: ${proxy}`);
      }
    }

    console.warn("⚠️ No working proxies found.");
    return null;
  } catch (err) {
    console.error("❌ Proxy fetch error:", err.message);
    return null;
  }
}

module.exports = getValidProxy;