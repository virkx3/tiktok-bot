const fs = require('fs');
const path = require('path');

// Load and parse proxies
function loadProxies() {
  const filePath = path.resolve(__dirname, 'proxy.txt');
  if (!fs.existsSync(filePath)) {
    console.log('❌ proxy.txt file not found');
    return [];
  }

  const lines = fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.includes('IN') && line.includes(':'));

  return lines;
}

const proxies = loadProxies();