/**
 * 真实历史人物角色系统 - 全面测试脚本 v1.0
 *
 * 测试内容：
 * 1. 数据完整性验证（35个角色）
 * 2. 字段规范性检查
 * 3. 提示词生成测试
 * 4. 角色管理器功能测试
 * 5. 分类统计验证
 * 6. 搜索推荐功能测试
 */

const RoleManager = require('./server/services/roleManager');
const { generateSystemPrompt } = require('./server/services/realPersonPromptGenerator');
const { realPersonPresets } = require('./src/data/realPersonPresets');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     真实历史人物角色系统 - 全面测试报告                    ║');
console.log('║     测试时间: ' + new Date().toLocaleString('zh-CN') + '              ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : (status === 'FAIL' ? '❌' : '⚠️');
  console.log(`${icon} ${testName}${details ? ': ' + details : ''}`);
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
  
  testResults.tests.push({ name: testName, status, details });
}

// ==================== 测试1: 数据完整性验证 ====================
console.log('━━━ 测试1: 数据完整性验证 ━━━');

logTest('总角色数量检查', 
  RoleManager.getAllRoles().length === 35 ? 'PASS' : 'FAIL',
  `期望35个，实际${RoleManager.getAllRoles().length}个`
);

const validation = RoleManager.validateAllRoles();
logTest('角色数据有效性', 
  validation.valid === 35 ? 'PASS' : 'WARN',
  `有效${validation.valid}/${validation.total} (${validation.validityRate})`
);

if (validation.details.length > 0) {
  validation.details.forEach(d => {
    logTest(`角色 ${d.id} 缺失字段`, 'WARN', d.missingFields.join(', '));
  });
}

// ==================== 测试2: 必填字段检查 ====================
console.log('\n━━━ 测试2: 必填字段规范性检查 ━━━');

const requiredFields = ['id', 'name', 'soul', 'identity', 'character'];
const optionalFields = ['englishName', 'avatar', 'category', 'era', 'description', 
                      'famousQuotes', 'works', 'achievements', 'roleType'];

let fieldStats = {};
requiredFields.forEach(f => fieldStats[f] = { present: 0, missing: 0 });
optionalFields.forEach(f => fieldStats[f] = { present: 0, missing: 0 });

RoleManager.getAllRoles().forEach(role => {
  requiredFields.forEach(field => {
    if (role[field]) fieldStats[field].present++;
    else fieldStats[field].missing++;
  });
  optionalFields.forEach(field => {
    if (role[field]) fieldStats[field].present++;
    else fieldStats[field].missing++;
  });
});

requiredFields.forEach(field => {
  logTest(`${field} 字段覆盖率`, 
    fieldStats[field].present === 35 ? 'PASS' : 'FAIL',
    `${fieldStats[field].present}/35 (${(fieldStats[field].present/35*100).toFixed(1)}%)`
  );
});

// ==================== 测试3: Soul深度设定质量 ====================
console.log('\n━━━ 测试3: Soul深度设定质量检查 ━━━');

let soulQualityStats = { excellent: 0, good: 0, acceptable: 0, poor: 0 };

RoleManager.getAllRoles().forEach(role => {
  if (!role.soul) {
    soulQualityStats.poor++;
    return;
  }
  
  const soulLength = role.soul.length;
  const hasForbiddenBehavior = role.soul.includes('禁止行为');
  const hasInteractionGuide = role.soul.includes('你在讨论中的表现');
  const hasIdentitySection = role.soul.includes('你是');
  
  let quality = 'poor';
  if (soulLength > 1000 && hasForbiddenBehavior && hasInteractionGuide && hasIdentitySection) {
    quality = 'excellent';
  } else if (soulLength > 500 && hasForbiddenBehavior && hasIdentitySection) {
    quality = 'good';
  } else if (soulLength > 200 && hasIdentitySection) {
    quality = 'acceptable';
  }
  
  soulQualityStats[quality]++;
});

logTest('Soul设定优秀率（>1000字+完整结构）', 
  soulQualityStats.excellent >= 25 ? 'PASS' : 'WARN',
  `${soulQualityStats.excellent}/35 角色`
);

logTest('Soul设定合格率（>200字+基础结构）', 
  (soulQualityStats.excellent + soulQualityStats.good + soulQualityStats.acceptable) === 35 ? 'PASS' : 'FAIL',
  `${soulQualityStats.excellent + soulQualityStats.good + soulQualityStats.acceptable}/35`
);

// ==================== 测试4: 分类覆盖度 ====================
console.log('\n━━━ 测试4: 角色分类覆盖度检查 ━━━');

const categories = RoleManager.getCategories();
const stats = RoleManager.getStatistics();

logTest('分类数量', categories.length >= 6 ? 'PASS' : 'WARN', `${categories.length} 个分类`);

categories.forEach(cat => {
  const count = stats.categories[cat] || 0;
  logTest(`${cat}分类`, count > 0 ? 'PASS' : 'FAIL', `${count} 个角色`);
});

// ==================== 测试5: 提示词生成测试 ====================
console.log('\n━━━ 测试5: 提示词生成功能测试 ━━━');

const testRoles = ['elon-musk', 'confucius', 'einstein', 'shakespeare', 'lu-xun'];
let promptGenSuccess = 0;

testRoles.forEach(id => {
  try {
    const prompt = generateSystemPrompt(id, realPersonPresets, {
      includeWebSearch: true,
      includeHistoricalContext: true
    });
    
    if (prompt && prompt.length > 500) {
      promptGenSuccess++;
      logTest(`${id} 提示词生成`, 'PASS', `${prompt.length} 字符`);
    } else {
      logTest(`${id} 提示词生成`, 'FAIL', `长度不足或为空`);
    }
  } catch (e) {
    logTest(`${id} 提示词生成`, 'FAIL', e.message);
  }
});

logTest('提示词生成成功率', 
  promptGenSuccess === testRoles.length ? 'PASS' : 'WARN',
  `${promptGenSuccess}/${testRoles.length}`
);

// ==================== 测试6: 搜索与推荐功能 ====================
console.log('\n━━━ 测试6: 搜索与推荐功能测试 ━━━');

const searchTests = [
  { query: '哲学家', expectedMin: 5 },
  { query: '企业家', expectedMin: 3 },
  { query: '科学家', expectedMin: 4 },
];

searchTests.forEach(({ query, expectedMin }) => {
  const results = RoleManager.search(query);
  logTest(`搜索"${query}"`, 
    results.length >= expectedMin ? 'PASS' : 'WARN',
    `返回${results.length}个结果 (期望≥${expectedMin})`
  );
});

const recommendations = RoleManager.recommendForScenario('哲学思辨', 8);
logTest('场景推荐功能', 
  recommendations.length === 8 ? 'PASS' : 'FAIL',
  `返回${recommendations.length}个推荐角色`
);

// ==================== 测试7: 展示格式转换 ====================
console.log('\n━━━ 测试7: 前端展示格式转换测试 ━━━');

const sampleRole = RoleManager.getRoleById('elon-musk');
if (sampleRole) {
  const displayFormat = RoleManager.toDisplayFormat(sampleRole, {
    includeFullIdentity: true
  });
  
  logTest('展示格式包含必要字段', 
    displayFormat.id && displayFormat.name && displayFormat.description ? 'PASS' : 'FAIL'
  );
  
  logTest('展示格式包含标签信息', 
    Array.isArray(displayFormat.tags) && displayFormat.tags.length > 0 ? 'PASS' : 'FAIL',
    `${displayFormat.tags.length} 个标签`
  );
}

// ==================== 测试8: 随机选取功能 ====================
console.log('\n━━━ 测试8: 随机角色选取测试 ━━━');

const randomRoles = RoleManager.getRandomRoles(5);
logTest('随机选取功能', 
  randomRoles.length === 5 ? 'PASS' : 'FAIL',
  `成功选取${randomRoles.length}个不重复角色`
);

const uniqueIds = new Set(randomRoles.map(r => r.id));
logTest('随机选取去重验证', 
  uniqueIds.size === 5 ? 'PASS' : 'FAIL',
  `${uniqueIds.size}/5 不重复`
);

// ==================== 最终汇总 ====================
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                   📊 测试结果汇总                            ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║  总测试数: ${testResults.tests.length}`);
console.log(`║  ✅ 通过:   ${testResults.passed}`);
console.log(`║  ⚠️ 警告:   ${testResults.warnings}`);
console.log(`║  ❌ 失败:   ${testResults.failed}`);
console.log(`║  通过率:   ${(testResults.passed / testResults.tests.length * 100).toFixed(1)}%`);
console.log('╚════════════════════════════════════════════════════════════╝');

console.log('\n📋 角色统计信息:');
console.log(`  - 总角色数: ${stats.totalRoles}`);
console.log(`  - 分类数: ${Object.keys(stats.categories).length}`);
console.log(`  - 角色类型数: ${Object.keys(stats.roleTypes).length}`);
console.log('');
console.log('🎯 各分类角色分布:');
for (const [cat, count] of Object.entries(stats.categories)) {
  console.log(`  • ${cat}: ${count}人`);
}
console.log('');

if (testResults.failed === 0) {
  console.log('🎉 所有核心测试通过！系统可以投入使用。');
} else {
  console.log('⚠️ 存在失败项，建议修复后再部署。');
}

process.exit(testResults.failed > 0 ? 1 : 0);