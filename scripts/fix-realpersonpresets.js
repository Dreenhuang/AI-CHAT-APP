/**
 * 修复 realPersonPresets.js 中的注释格式错误
 * 将错误的 "*   *   - " 和 "*   - " 格式转换为正确注释
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/realPersonPresets.js');
let content = fs.readFileSync(filePath, 'utf8');

// 统计修复数量
let fixCount = 0;

// 模式1: 修复 '*   *   - ' 开头但在字符串内的行
// 匹配类似: '文字...*   *   - 注释文字',
const pattern1 = /'(\s*)\*   \*   - ([^']+)',?/g;
content = content.replace(pattern1, (match, indent, comment) => {
  fixCount++;
  return `${indent}// * ${comment}`;
});

// 模式2: 修复 '*   - ' 开头但在字符串内的行
// 匹配类似: '文字...*   - 注释文字',
const pattern2 = /'(\s*)\*   - ([^']+)',?/g;
content = content.replace(pattern2, (match, indent, comment) => {
  fixCount++;
  return `${indent}// ${comment}`;
});

// 模式3: 修复直接以 *   *   - 开头的行（不在字符串内）
const pattern3 = /^(\s*)\*   \*   - (.+)$/gm;
content = content.replace(pattern3, (match, indent, comment) => {
  fixCount++;
  return `${indent}// * ${comment}`;
});

// 模式4: 修复直接以 *   - 开头的行（不在字符串内）
const pattern4 = /^(\s*)\*   - (.+)$/gm;
content = content.replace(pattern4, (match, indent, comment) => {
  fixCount++;
  return `${indent}// ${comment}`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`修复完成！共修复 ${fixCount} 处语法错误`);
