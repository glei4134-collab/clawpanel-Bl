const { readFileSync, writeFileSync } = require('fs');

const orig = readFileSync('src/locales/modules/chat.js', 'utf8');
const lines = orig.split('\n');

// Remove the last line (newMessageArrived) if it's there, and fix trailing comma
const lastLine = lines[lines.length - 1].trim();
if (lastLine === '}' || lastLine === ',"新消息"' || lastLine === ',') {
  // Remove last 2 lines (comma-line and closing brace)
  lines.splice(-2);
}

// Now lines ends with the hostedContextSummary line
// Make sure it has a trailing comma
const lastContentLine = lines[lines.length - 1].trimEnd();
if (!lastContentLine.endsWith(',')) {
  lines[lines.length - 1] = lastContentLine + ',';
}

// Add newMessageArrived and closing brace
lines.push('  newMessageArrived: "新消息"');
lines.push('}');

const result = lines.join('\n');
writeFileSync('src/locales/modules/chat.js', result, 'utf8');
console.log('Done. File size:', result.length);
console.log('Last 3 lines:', lines.slice(-3));
