const fs = require('fs');
const b = fs.readFileSync('src/locales/modules/chat.js');
// Find the string ", 'Chat en vivo'" which should be near the end of the 5th locale
// The bytes for ", 'Chat en vivo'" are: 2c 20 27 43 68 61 74 20 65 6e 20 76 69 76 6f 27
const search = Buffer.from([0x2c, 0x20, 0x27, 0x43, 0x68, 0x61, 0x74, 0x20, 0x65, 0x6e, 0x20, 0x76, 0x69, 0x76, 0x6f, 0x27]);
const idx = b.indexOf(search, 200);
console.log('Found at byte offset:', idx);
if (idx >= 0) {
  // Show context
  console.log('Context:', b.slice(Math.max(0,idx-10), idx+20).toString('utf8'));
}
