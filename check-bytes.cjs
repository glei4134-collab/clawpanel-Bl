const fs = require('fs');
const buf = fs.readFileSync('src/locales/modules/chat.js');
console.log('First 10 bytes:', buf.slice(0,10).toString('hex'));
console.log('Size:', buf.length);
// Try to parse as UTF8
try {
  const content = buf.toString('utf8');
  // Check for syntax errors
  new Function(content);
  console.log('JS syntax OK');
} catch(e) {
  console.log('JS syntax error:', e.message);
  // Show what's at line 4
  const lines = content.split('\n');
  console.log('Line 4:', JSON.stringify(lines[3]?.substring(0, 200)));
}
