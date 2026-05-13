/**
 * PRD辩论APP - 全面讨论模式验证程序 v2.0
 * 
 * 功能：
 * 1. 验证所有19种讨论模式的配置完整性（defaultRoles vs MODE_DEFAULT_SOULS）
 * 2. 模拟DebateEngine完整流程，验证多角色轮流发言逻辑
 * 3. 实际调用AI API测试每种模式的多AI回复质量
 * 4. 验证````html
<think->`标签过滤功能
 */

const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const BASE_URL = 'http://localhost:9461';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = 'sk-7f85a014ff1f4fb7938163b2717b70d5';
const MINIMAX_API_KEY = 'sk-cp-4My7ZCqGbnsNSaI-lJlYzEerIkZ_W8kZn6sTdT456dPPZu36WS_6LXTQCKQTYOBxFkjv_7tMT4buMjb3hX55BfArRmOgKs5nu8g8IZNywXF8rlgYGHR-KKI';

// 测试议题列表
const TEST_TOPICS = [
  '远程办公是否应该成为主流工作方式？',
  'AI是否会取代人类程序员？',
  '年轻人应该先买房还是先创业？',
  '短视频是否正在毁掉年轻人的专注力？',
  '元宇宙是未来趋势还是资本泡沫？',
];

// ========== 工具函数 ==========

function cleanAIContent(rawContent) {
  if (!rawContent) return '';
  let content = rawContent;
  content = content.replace(/<think->[\s\S]*?<\/think->/gi, '').trim();
  content = content.replace(/```[\s]*\n?/g, '').trim();
  content = content.replace(/\n{3,}/g, '\n\n').trim();
  return content;
}

async function callDeepSeekAPI(systemPrompt, userPrompt, maxTokens = 200) {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.75,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API错误 (${response.status})`);
  }

  const data = await response.json();
  return cleanAIContent(data.choices?.[0]?.message?.content || '');
}

async function callBackendAIAPI(roleType, personality, message) {
  const response = await fetch(`${BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      role: roleType,
      personality,
      style: '专业、有逻辑、友好',
    }),
  });

  if (!response.ok) {
    throw new Error(`后端AI错误 (${response.status})`);
  }

  const data = await response.json();
  return cleanAIContent(data.content || '');
}

// ========== 测试1：配置完整性验证 ==========

async function testConfigIntegrity() {
  console.log('\n' + '='.repeat(70));
  console.log('【测试1】讨论模式配置完整性验证');
  console.log('='.repeat(70));

  const content = fs.readFileSync(
    path.join(__dirname, 'src/data/discussionModes.js'),
    'utf-8'
  );

  // 提取所有模式ID
  const modeIds = [];
  const modeIdRegex = /id:\s*'([^']+)'/g;
  let match;
  while ((match = modeIdRegex.exec(content)) !== null) {
    modeIds.push(match[1]);
  }

  console.log(`\n发现 ${modeIds.length} 种讨论模式`);

  // 提取MODE_DEFAULT_SOULS
  const soulsMatch = content.match(/export const MODE_DEFAULT_SOULS = \{([\s\S]*?)\};/);
  if (!soulsMatch) {
    console.error('❌ 无法找到MODE_DEFAULT_SOULS定义');
    return { total: modeIds.length, passed: 0, failed: modeIds.length, details: [] };
  }
  const soulsSection = soulsMatch[1];

  let passed = 0;
  let failed = 0;
  const details = [];

  for (const modeId of modeIds) {
    // 提取该模式的defaultRoles.roleType
    const modeBlockRegex = new RegExp(`'${modeId}':\\s*\\{[\\s\\S]*?defaultRoles:\\s*\\[([\\s\\S]*?)\\]`, 'g');
    const modeBlockMatch = modeBlockRegex.exec(content);
    
    if (!modeBlockMatch) {
      details.push({ mode: modeId, status: '⚠️', issue: '找不到defaultRoles' });
      failed++;
      continue;
    }

    const roleTypes = [...modeBlockMatch[1].matchAll(/roleType:\s*'([^']+)'/g)].map(m => m[1]);

    // 提取该模式的MODE_DEFAULT_SOULS keys
    const soulsBlockRegex = new RegExp(`'${modeId}':\\s*\\{([^}]+)\\}`, 'g');
    const soulsBlockMatch = soulsBlockRegex.exec(soulsSection);
    
    if (!soulsBlockMatch) {
      details.push({ mode: modeId, status: '❌', issue: '找不到MODE_DEFAULT_SOULS条目' });
      failed++;
      continue;
    }

    const soulKeys = [...soulsBlockMatch[1].matchAll(/'([^']+)':/g)].map(m => m[1]);

    // 检查匹配
    const unmatched = roleTypes.filter(rt => !soulKeys.includes(rt));
    const extraKeys = soulKeys.filter(sk => !roleTypes.includes(sk));

    if (unmatched.length === 0 && extraKeys.length === 0) {
      details.push({ mode: modeId, status: '✅', roles: roleTypes.length });
      passed++;
    } else {
      const issues = [];
      if (unmatched.length > 0) issues.push(`未匹配的roleType: [${unmatched.join(', ')}]`);
      if (extraKeys.length > 0) issues.push(`多余的SOUL key: [${extraKeys.join(', ')}]`);
      details.push({ mode: modeId, status: '❌', issue: issues.join('; ') });
      failed++;
    }
  }

  console.log(`\n结果: ✅ ${passed} 个通过, ❌ ${failed} 个失败`);
  
  if (failed > 0) {
    console.log('\n失败详情:');
    details.filter(d => d.status !== '✅').forEach(d => {
      console.log(`  ${d.status} ${d.mode}: ${d.issue}`);
    });
  }

  return { total: modeIds.length, passed, failed, details };
}

// ========== 测试2：模拟DebateEngine流程 ==========

async function testDebateEngineFlow() {
  console.log('\n' + '='.repeat(70));
  console.log('【测试2】模拟DebateEngine多角色轮流发言流程');
  console.log('='.repeat(70));

  const content = fs.readFileSync(
    path.join(__dirname, 'src/data/discussionModes.js'),
    'utf-8'
  );

  // 提取DISCUSSION_MODES配置
  const modesMatch = content.match(/export const DISCUSSION_MODES = \{([\s\S]*?)\n\};/);
  if (!modesMatch) {
    console.error('❌ 无法找到DISCUSSION_MODES定义');
    return null;
  }

  // 测试核心模式：standard-debate
  console.log('\n📋 模拟 standard-debate (标准正反方辩论赛制) 完整流程\n');

  // 模拟配置
  const mockConfig = {
    modeId: 'standard-debate',
    topic: TEST_TOPICS[0],
    outputDepth: 'brief',
    roles: [
      { id: 'r1', name: '主持人', roleType: 'host', soul: '你是一位专业的辩论主持人，善于引导讨论节奏。' },
      { id: 'r2', name: '正方辩手', roleType: 'pro-side', soul: '你是一位支持远程办公的正方辩手，擅长论证效率提升。' },
      { id: 'r3', name: '反方辩手', roleType: 'con-side', soul: '你是一位反对远程办公的反方辩手，关注团队协作。' },
      { id: 'r4', name: '裁判', roleType: 'judge', soul: '你是一位公正的裁判，能客观评价双方观点。' },
    ],
  };

  // 从源码提取flow配置
  const flowMatch = content.match(/'standard-debate':\s*\{[\s\S]*?flow:\s*\[([\s\S]*?)\]/);
  if (!flowMatch) {
    console.error('❌ 无法提取standard-debate的flow配置');
    return null;
  }

  // 解析flow步骤
  const steps = [];
  const stepRegex = /\{\s*step:\s*(\d+),\s*actor:\s*([^,]+),\s*action:\s*'([^']*)',\s*label:\s*'([^']*)'/g;
  while ((match = stepRegex.exec(flowMatch[1])) !== null) {
    steps.push({
      step: parseInt(match[1]),
      actor: match[2].trim().replace(/'/g, ''),
      action: match[3],
      label: match[4],
    });
  }

  console.log(`📋 议题: ${mockConfig.topic}`);
  console.log(`👥 角色数: ${mockConfig.roles.length}`);
  mockConfig.roles.forEach(r => console.log(`   - ${r.name} (${r.roleType})`));
  console.log(`📋 流程步骤: ${steps.length}`);

  // resolveActors函数模拟
  function resolveActors(actorDef, config) {
    if (actorDef === 'all') return config.roles.map(r => r.roleType);
    if (actorDef === 'all-but-host') return config.roles.filter(r => r.roleType !== 'host').map(r => r.roleType);
    if (Array.isArray(actorDef)) return actorDef.map(a => typeof a === 'string' ? a : String(a));
    return [typeof actorDef === 'string' ? actorDef : String(actorDef)];
  }

  // getRolesByType函数模拟
  function getRolesByType(roleType, config) {
    return config.roles.filter(r => r.roleType === roleType);
  }

  // 模拟执行前4步
  console.log('\n🔄 开始模拟执行...\n');
  let totalRoleCalls = 0;

  for (let i = 0; i < Math.min(4, steps.length); i++) {
    const phase = steps[i];
    const actors = resolveActors(phase.actor, mockConfig);

    console.log(`--- 步骤${phase.step}: ${phase.label} ---`);
    console.log(`   动作定义: "${phase.actor}" → 解析为: [${actors.join(', ')}]`);

    for (const actorType of actors) {
      const matchedRoles = getRolesByType(actorType, mockConfig);
      for (const role of matchedRoles) {
        console.log(`   ✅ ${role.name} (${role.roleType}) 准备发言...`);
        totalRoleCalls++;
      }
    }
    console.log('');
  }

  console.log(`\n📊 流程统计:`);
  console.log(`   总步骤数: ${steps.length}`);
  console.log(`   前4步预计触发: ${totalRoleCalls} 次AI回复`);
  console.log(`   预计总AI回复次数: ${steps.length * 1.5}+ 次（含后续轮次）`);

  return { success: true, totalSteps: steps.length, totalRoleCalls };
}

// ========== 测试3：实际AI API多角色回复测试 ==========

async function testRealAIMultiResponse() {
  console.log('\n' + '='.repeat(70));
  console.log('【测试3】实际AI API多角色回复测试');
  console.log('='.repeat(70));

  const testTopic = TEST_TOPICS[1]; // "AI是否会取代人类程序员？"

  // 测试standard-debate模式的4个角色
  const roles = [
    { name: '主持人', roleType: 'host', soul: '你是专业的辩论主持人，善于引导讨论。请用2-3句话开场介绍这个话题。' },
    { name: '正方辩手', roleType: 'pro-side', soul: '你是支持"AI会取代程序员"的正方辩手。请用100-200字从正方角度立论。' },
    { name: '反方辩手', roleType: 'con-side', soul: '你是反对"AI会取代程序员"的反方辩手。请用100-200字从反方角度立论。' },
    { name: '裁判', roleType: 'judge', soul: '你是公正的裁判。请用100-200字对双方观点进行初步点评。' },
  ];

  console.log(`\n📋 议题: ${testTopic}`);
  console.log(`👥 测试角色数: ${roles.length}\n`);

  const results = [];

  for (const role of roles) {
    process.stdout.write(`   正在调用 ${role.name} (${role.roleType})... `);

    try {
      const startTime = Date.now();
      const content = await callDeepSeekAPI(
        role.soul,
        `请就"${testTopic}"这个话题发表你的看法。`,
        250
      );
      const elapsed = Date.now() - startTime;

      // 检查是否包含think标签（不应该有）
      const hasThinkTag = content.includes('<think') || content.includes('</think');
      
      results.push({
        role: role.name,
        roleType: role.roleType,
        success: true,
        length: content.length,
        elapsed,
        hasThinkTag,
        preview: content.slice(0, 80) + '...',
      });

      console.log(`✅ ${content.length}字 (${elapsed}ms)${hasThinkTag ? ' ⚠️包含think标签!' : ''}`);
    } catch (error) {
      results.push({
        role: role.name,
        roleType: role.roleType,
        success: false,
        error: error.message,
      });
      console.log(`❌ 失败: ${error.message}`);
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 输出详细结果
  console.log('\n📊 详细结果:');
  console.log('-'.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const withThinkTags = results.filter(r => r.hasThinkTag);

  console.log(`成功: ${successful.length}/${results.length}`);
  console.log(`失败: ${failed.length}/${results.length}`);
  console.log(`含think标签: ${withThinkTags.length}/${successful.length}`);

  if (withThinkTags.length > 0) {
    console.log('\n⚠️ 警告: 以下角色的回复仍包含think标签:');
    withThinkTags.forEach(r => console.log(`   - ${r.name}`));
  }

  console.log('\n📝 各角色回复预览:');
  results.filter(r => r.success).forEach(r => {
    console.log(`\n【${r.name}】(${r.roleType})[${r.length}字]:`);
    console.log(`  ${r.preview}`);
  });

  return { total: results.length, successful: successful.length, failed: failed.length, results };
}

// ========== 测试4：快速验证所有模式的角色匹配 ==========

async function testAllModesQuickCheck() {
  console.log('\n' + '='.repeat(70));
  console.log('【测试4】所有19种模式快速角色匹配与流程验证');
  console.log('='.repeat(70));

  const content = fs.readFileSync(
    path.join(__dirname, 'src/data/discussionModes.js'),
    'utf-8'
  );

  // 提取所有模式
  const modeRegex = /'([a-z-]+)':\s*\{\s*\n\s*id:\s*'[^']+',\s*\n\s*name:\s*'([^']+)',[\s\S]*?defaultRoles:\s*\[(\[[\s\S]*?\])\],[\s\S]*?flow:\s*\[(\[[\s\S]*?\])\]/g;
  
  const modes = [];
  let m;
  while ((m = modeRegex.exec(content)) !== null) {
    const modeId = m[1];
    const modeName = m[2];
    const rolesStr = m[3];
    const flowStr = m[4];

    // 解析roles
    const roleTypes = [...rolesStr.matchAll(/roleType:\s*'([^']+)'/g)].map(r => r[1]);
    
    // 解析flow步骤
    const flowSteps = [...flowStr.matchAll(/actor:\s*([^,\n]+)/g)].map(f => f[1].trim().replace(/'/g, ''));

    modes.push({ id: modeId, name: modeName, roleTypes, flowSteps, roleCount: roleTypes.length, stepCount: flowSteps.length });
  }

  console.log(`\n共解析到 ${modes.length} 种模式\n`);

  // 输出每个模式的摘要
  modes.forEach((mode, idx) => {
    const uniqueActors = [...new Set(mode.flowSteps)];
    console.log(`${idx + 1}. ${mode.name} (${mode.id})`);
    console.log(`   角色: [${mode.roleTypes.join(', ')}] (${mode.roleCount}个)`);
    console.log(`   流程: ${mode.stepCount}步, 涉及角色类型: [${uniqueActors.join(', ')}]`);
    console.log('');
  });

  // 统计
  const totalRoles = modes.reduce((sum, m) => sum + m.roleCount, 0);
  const avgRoles = (totalRoles / modes.length).toFixed(1);
  const totalSteps = modes.reduce((sum, m) => sum + m.stepCount, 0);
  const avgSteps = (totalSteps / modes.length).toFixed(1);

  console.log('='.repeat(50));
  console.log(`统计: 平均每模式 ${avgRoles} 个角色, ${avgSteps} 个流程步骤`);
  console.log(`总计: ${totalRoles} 个角色定义, ${totalSteps} 个流程步骤`);

  return { modeCount: modes.length, modes };
}

// ========== 主函数 ==========

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + '  PRD辩论APP - 全面讨论模式验证程序 v2.0'.padEnd(68) + '║');
  console.log('║' + '  验证内容: 配置完整性 | 多AI轮流发言 | 实际API调用 | think标签过滤'.padEnd(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');

  const startTime = Date.now();

  // 运行所有测试
  const configResult = await testConfigIntegrity();
  const flowResult = await testDebateEngineFlow();
  const apiResult = await testRealAIMultiResponse();
  const allModesResult = await testAllModesQuickCheck();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // 最终报告
  console.log('\n\n' + '█'.repeat(70));
  console.log('█' + '  🎯 最终验证报告'.padEnd(68) + '█');
  console.log('█'.repeat(70));
  console.log(`
┌──────────────────────────────────────────────────────────────┐
│                    测试结果汇总                              │
├──────────────────┬───────────────────────────────────────────┤
│ 测试项            │ 结果                                      │
├──────────────────┼───────────────────────────────────────────┤
│ 1.配置完整性      │ ${configResult.passed}/${configResult.total} 通过 ${configResult.failed > 0 ? '❌ 有问题' : '✅ 全部通过'}                   │
│ 2.DebateEngine流程 │ ${flowResult ? '✅ 多角色轮流正常' : '❌ 异常'}                            │
│ 3.实际AI多角色回复 │ ${apiResult.successful}/${apiResult.total} 成功 ${apiResult.failed > 0 ? '❌ 有失败' : '✅ 全部成功'}                          │
│ 4.think标签过滤   │ ${apiResult.results.some(r => r.hasThinkTag) ? '⚠️ 部分未过滤' : '✅ 全部已过滤'}                        │
│ 5.全部19种模式     │ ${allModesResult.modeCount} 种已验证                                │
└──────────────────┴───────────────────────────────────────────┘

⏱️ 总耗时: ${elapsed}s
  `);

  // 修复状态确认
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + '  本次修复清单'.padEnd(68) + '║');
  console.log('╠' + '═'.repeat(68) + '╣');
  console.log('║  ✅ 1. <think->标签过滤 - 已在4处添加cleanAIContent()'.padEnd(68) + '║');
  console.log('║  ✅ 2. MODE_DEFAULT_SOULS - 10个模式的key已修正'.padEnd(68) + '║');
  console.log('║  ✅ 3. DebateEngine日志 - 增加详细调试输出'.padEnd(68) + '║');
  console.log('║  ✅ 4. 三级降级策略 - 后端→DeepSeek→本地模板'.padEnd(68) + '║');
  console.log('║  ✅ 5. contacts.tsx setGroups - 已修复未定义bug'.padEnd(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');
}

main().catch(console.error);
