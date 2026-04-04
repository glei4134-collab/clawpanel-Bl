const fs = require('fs');
// Read the file as Buffer to check encoding
const buf = fs.readFileSync('src/locales/modules/chat.js');
// Check for BOM
const hasBOM = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
// Check encoding by looking at high bytes
let hasHighBytes = false;
for (let i = 0; i < buf.length; i++) {
  if (buf[i] > 0x7F) { hasHighBytes = true; break; }
}
console.log('Has BOM:', hasBOM);
console.log('Has high bytes:', hasHighBytes);

// The issue: if there's a UTF-8 BOM or wrong encoding, strip it and re-encode
// Actually, let's check if the file has UTF-8 BOM marker at start
if (hasBOM) {
  console.log('File has UTF-8 BOM, stripping...');
  const content = buf.toString('utf8');
  fs.writeFileSync('src/locales/modules/chat.js', '\ufeff' + content, 'utf8');
} else {
  // Read with UTF8 and rewrite with BOM
  const content = buf.toString('utf8');
  console.log('File content (first 100 chars):', content.substring(0, 100));
}
