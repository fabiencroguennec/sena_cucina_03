
const ip = require('ip');
const qrcode = require('qrcode-terminal');

const myIp = ip.address();
const port = 3000;
const url = `http://${myIp}:${port}`;

console.log('\n================================================================');
console.log('📱 Scan this QR Code to access the app on your mobile device:');
console.log(`🔗 URL: ${url}`);
console.log('================================================================\n');

qrcode.generate(url, { small: true });

console.log('\n');

// Keep process alive so concurrently -k doesn't kill others
setInterval(() => { }, 100000);
