/**
 * 修复 realPersonPresets.js 中数组元素缺少引号和多余前缀的问题
 * 
 * 使用行级状态追踪，只修改 personality/speakingStyle/values 数组中的元素
 * 不会修改 soul 模板字符串中的内容
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/realPersonPresets.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let fixCount = 0;
let inArray = false;          // 在 personality/speakingStyle/values 数组中
let inTemplateLiteral = false; // 在 soul: ` ... ` 模板字符串中

const ARRAY_PROPERTIES = ['personality', 'speakingStyle', 'values'];

const result = lines.map((line, index) => {
  const trimmed = line.trim();
  const indent = line.slice(0, line.length - line.trimStart().length);
  
  // 检测模板字符串开始
  if (trimmed.startsWith('soul:') || trimmed.startsWith('soul :')) {
    inTemplateLiteral = true;
    return line;
  }
  
  // 检测模板字符串结束（遇到 `, 或 ` 结束）
  if (inTemplateLiteral && (trimmed.endsWith('`,') || trimmed === '`' || trimmed.endsWith('`'))) {
    inTemplateLiteral = false;
    return line;
  }
  
  // 如果在模板字符串中，跳过
  if (inTemplateLiteral) {
    return line;
  }
  
  // 检测是否进入数组块
  for (const prop of ARRAY_PROPERTIES) {
    if (trimmed === `${prop}: [` || trimmed === `${prop}:[`) {
      inArray = true;
      return line;
    }
  }
  
  // 检测是否离开数组块
  if (inArray && (trimmed === '],' || trimmed.startsWith('],'))) {
    inArray = false;
    return line;
  }
  
  if (inArray) {
    // 模式1: "- '文本'," → "'文本',"
    let m = trimmed.match(/^- '(.+)'(,?)$/);
    if (m) {
      fixCount++;
      return `${indent}'${m[1]}'${m[2]}`;
    }
    
    // 模式2: "- 文本'," → "'文本',"
    m = trimmed.match(/^- (.+)'(,?)$/);
    if (m && !m[1].startsWith("'") && !m[1].startsWith('"')) {
      fixCount++;
      return `${indent}'${m[1]}'${m[2]}`;
    }
    
    // 模式3: "- "文本"," → ""文本","
    m = trimmed.match(/^- "(.+)",?$/);
    if (m) {
      fixCount++;
      return `${indent}"${m[1]}",`;
    }
    
    // 模式4: "- 文本," → "'文本',"
    m = trimmed.match(/^- (.+),$/);
    if (m && !m[1].includes("'") && !m[1].includes('"') && !m[1].startsWith('`')) {
      fixCount++;
      return `${indent}'${m[1]}',`;
    }
  }
  
  return line;
});

fs.writeFileSync(filePath, result.join('\n'), 'utf8');
console.log(`修复完成！共修复 ${fixCount} 处语法错误`);
