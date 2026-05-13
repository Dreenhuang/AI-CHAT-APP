const fs = require('fs');
const filePath = process.argv[2] || 'src/data/realPersonPresets.js';
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split(/\r?\n/);
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  if (/^\s+\*\s+'/.test(lines[i])) {
    const indent = lines[i].length - lines[i].trimStart().length;
    const afterStar = lines[i].trim().replace(/^\*\s*/, '');
    lines[i] = ' '.repeat(indent) + afterStar;
    fixed++;
  }
}
fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log('Fixed', fixed, 'lines.');
