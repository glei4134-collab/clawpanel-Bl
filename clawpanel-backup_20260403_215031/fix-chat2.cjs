const fs = require('fs');
// Read with UTF8
let content = fs.readFileSync('src/locales/modules/chat.js', 'utf8');
// Check what's at the end
const lines = content.split('\n');
console.log('Line count:', lines.length);
console.log('Last 5 lines:');
for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
  console.log(i + ':', JSON.stringify(lines[i]));
}
