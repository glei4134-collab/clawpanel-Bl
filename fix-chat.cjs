const fs = require('fs');
let content = fs.readFileSync('src/locales/modules/chat.js', 'utf8');
// Remove any broken newMessageArrived lines
content = content.replace(/,\s*newMessageArrived:\s*'[^']*'/g, '');
content = content.replace(/,\s*newMessageArrived:\s*"[^"]*"/g, '');
// Remove trailing comma + newMessageArrived + closing brace patterns
content = content.replace(/,[\s\n]*newMessageArrived[\s\n]*:[\s\n]*'[^']*'[\s\n]*\}/g, '}');
content = content.replace(/,[\s\n]*newMessageArrived[\s\n]*:[\s\n]*"[^"]*"[\s\n]*\}/g, '}');
// Make sure it ends with }
content = content.trim();
if (!content.endsWith('}')) {
  content += '\n}';
} else {
  // Remove trailing whitespace before }
  content = content.replace(/[\s\n]+\}$/, '\n}');
}
// Remove trailing comma before }
content = content.replace(/,(\s*\})$/, '$1');
// Add comma to last entry if needed
if (!content.match(/,\s*$/)) {
  // Find last } and add comma before it if the line above doesn't have comma
}
const lines = content.split('\n');
const lastLine = lines[lines.length - 1];
const secondLastLine = lines[lines.length - 2];
if (!secondLastLine.trim().endsWith(',') && secondLastLine.trim() !== '{') {
  lines[lines.length - 2] = secondLastLine + ',';
}
content = lines.join('\n');
// Now add newMessageArrived
content = content.replace(/\}\s*$/, ',\n  newMessageArrived: "新消息"\n}');
fs.writeFileSync('src/locales/modules/chat.js', content, 'utf8');
console.log('done');
const final = fs.readFileSync('src/locales/modules/chat.js', 'utf8');
const finalLines = final.split('\n');
console.log('last 4 lines:', finalLines.slice(-4).join('\n'));
