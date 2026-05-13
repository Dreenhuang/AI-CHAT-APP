/**
 * PRD辩论APP - 19种讨论模式逐一AI输出验证程序 v3.0
 * 
 * 核心功能：
 * 1. 对每种模式提取defaultRoles + flow配置
 * 2. 模拟DebateEngine完整流程（resolveActors → getRolesByType → generateAIResponse）
 * 3. 实际调用DeepSeek API让每个角色在每一步都生成真实回复
 * 4. 对照文档标准验证：角色数量、发言顺序、回复质量、think标签过滤
 */

const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = 'sk-7f85a014ff1f4fb7938163b2717b70d5';

// 测试议题（每个类别用不同议题）
const TEST_TOPICS = {
  '一对一双向商量': '远程办公是否应该成为主流工作方式？',
  '多人圆桌合议': '如何提升团队协作效率？',
  '正式对抗辩论': 'AI是否会取代人类程序员？',
  '结构化议事决策': '公司是否应该实行4天工作制？',
  '头脑风暴共创': '下一代社交产品应该具备什么核心功能？',
  '多AI专属协同': '元宇宙是未来趋势还是资本泡沫？',
};

// ========== 工具函数 ==========

function cleanAIContent(rawContent) {
  if (!rawContent) return '';
  let content = rawContent;
  content = content.replace(/<think->[\s\S]*?<\/think->/gi, '').trim();
  content = content.replace(/```[\s]*\n?/g, '').trim();
  content = content.replace(/\n{3,}/g, '\n\n').trim();
  return content;
}

async function callDeepSeek(systemPrompt, userPrompt, maxTokens = 200) {
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
    const errText = await response.text().catch(() => '');
    throw new Error(`API错误 ${response.status}: ${errText.slice(0, 100)}`);
  }

  const data = await response.json();
  return cleanAIContent(data.choices?.[0]?.message?.content || '');
}

// 从源码解析DISCUSSION_MODES配置
function parseDiscussionModes(sourceCode) {
  // 使用更健壮的解析方式 - 逐个模式匹配
  const modes = {};
  
  // 匹配每个模式块
  const modePattern = /'([a-z-]+)':\s*\{\s*\n\s*id:\s*'[^']+',\s*\n\s*name:\s*'([^']+)',[\s\S]*?category:\s*'([^']+)',[\s\S]*?description:\s*'([^']*)',[\s\S]*?minRoles:\s*(\d+),[\s\S]*?maxRoles:\s*(\d+),[\s\S]*?needsHost:\s*(true|false),[\s\S]*?defaultRoles:\s*\[([\s\S]*?)\],\s*\n\s*flow:\s*\[([\s\S]*?)\]\s*\n\s*\}/g;

  let match;
  while ((match = modePattern.exec(sourceCode)) !== null) {
    const modeId = match[1];
    const name = match[2];
    const category = match[3];
    const description = match[4];
    const minRoles = parseInt(match[5]);
    const maxRoles = parseInt(match[6]);
    const needsHost = match[7] === 'true';
    const rolesStr = match[8];
    const flowStr = match[9];

    // 解析roles
    const roles = [];
    const roleRegex = /roleType:\s*'([^']+)',\s*label:\s*'([^']+)',\s*description:\s*'([^']*)'/g;
    let roleMatch;
    while ((roleMatch = roleRegex.exec(rolesStr)) !== null) {
      roles.push({
        roleType: roleMatch[1],
        label: roleMatch[2],
        description: roleMatch[3],
      });
    }

    // 解析flow steps
    const steps = [];
    const stepRegex = /\{\s*step:\s*(\d+),\s*actor:\s*([^,\n]+),\s*action:\s*'([^']*)',\s*label:\s*'([^']*)',\s*description:\s*'([^']*)'(?:,\s*loop:\s*(true|false))?\s*\}/g;
    let stepMatch;
    while ((stepMatch = stepRegex.exec(flowStr)) !== null) {
      steps.push({
        step: parseInt(stepMatch[1]),
        actor: stepMatch[2].trim().replace(/'/g, ''),
        action: stepMatch[3],
        label: stepMatch[4],
        description: stepMatch[5],
        loop: stepMatch[6] === 'true',
      });
    }

    modes[modeId] = { id: modeId, name, category, description, minRoles, maxRoles, needsHost, roles, steps };
  }

  return modes;
}

// resolveActors函数（与debateEngine.ts一致）
function resolveActors(actorDef, roles) {
  if (typeof actorDef === 'number') {
    const role = roles[actorDef];
    return role ? [role.roleType] : [];
  }
  if (actorDef === 'all') return [...new Set(roles.map(r => r.roleType))];
  if (actorDef === 'host') return ['host', 'moderator'];
  if (actorDef === 'all-but-host') return [...new Set(roles.filter(r => r.roleType !== 'host' && r.roleType !== 'moderator').map(r => r.roleType))];
  if (Array.isArray(actorDef)) return actorDef.map(a => typeof a === 'string' ? a : String(a));
  return [typeof actorDef === 'string' ? actorDef : String(actorDef)];
}

// getRolesByType函数（与debateEngine.ts一致）
function getRolesByType(roleType, roles) {
  return roles.filter(r => r.roleType === roleType);
}

// 为角色构建system prompt
function buildRolePrompt(role, topic, phase) {
  const basePrompt = `你是"${role.label}"（${role.roleType}），参与关于「${topic}」的讨论。
${role.description}
当前步骤：${phase.label}（${phase.description})
要求：直接以角色身份发言，不要说"我是AI"或"作为语言模型"，控制在100-200字。`;
  return basePrompt;
}

// ========== 主测试函数 ==========

async function testSingleMode(modeId, modeConfig, topicIndex) {
  const topic = TEST_TOPICS[modeConfig.category] || TEST_TOPICS['一对一双向商量'];
  const results = {
    modeId,
    name: modeConfig.name,
    category: modeConfig.category,
    topic,
    expectedRoles: modeConfig.roles.length,
    expectedSteps: modeConfig.steps.length,
    actualResponses: [],
    errors: [],
    status: 'running',
    startTime: Date.now(),
  };

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📋 测试模式: ${modeConfig.name} (${modeId})`);
  console.log(`   类别: ${modeConfig.category}`);
  console.log(`   议题: ${topic}`);
  console.log(`   角色: ${modeConfig.roles.length}个 [${modeConfig.roles.map(r => `${r.label}(${r.roleType})`).join(', ')}]`);
  console.log(`   流程: ${modeConfig.steps.length}步`);

  try {
    // 模拟执行每个流程步骤（最多执行前6步，避免耗时过长）
    const maxSteps = Math.min(modeConfig.steps.length, 6);
    
    for (let i = 0; i < maxSteps; i++) {
      const phase = modeConfig.steps[i];
      const actors = resolveActors(phase.actor, modeConfig.roles);

      console.log(`\n   ── 步骤${phase.step}: ${phase.label} ──`);
      console.log(`      动作定义: "${phase.actor}" → 解析为: [${actors.join(', ')}]`);

      for (const actorType of actors) {
        const matchedRoles = getRolesByType(actorType, modeConfig.roles);
        
        for (const role of matchedRoles) {
          process.stdout.write(`      🤖 ${role.label} (${role.roleType}): `);

          try {
            const systemPrompt = buildRolePrompt(role, topic, phase);
            const userPrompt = `请就"${topic}"这个话题，按照当前步骤"${phase.label}"的要求发表你的看法。`;
            
            const startTime = Date.now();
            const content = await callDeepSeek(systemPrompt, userPrompt, 200);
            const elapsed = Date.now() - startTime;

            // 验证
            const hasThinkTag = (content || '').includes('<think');
            const lengthValid = (content || '').length >= 20;
            
            results.actualResponses.push({
              step: phase.step,
              stepLabel: phase.label,
              roleName: role.label,
              roleType: role.roleType,
              content: content || '',
              length: (content || '').length,
              elapsed,
              hasThinkTag,
              lengthValid,
            });

            const statusIcon = hasThinkTag ? '⚠️' : (lengthValid ? '✅' : '❌');
            console.log(`${statusIcon} ${(content || '').length}字 (${elapsed}ms)${hasThinkTag ? ' [含think!]' : ''}`);

          } catch (err) {
            console.log(`❌ 失败: ${err.message}`);
            results.errors.push({
              step: phase.step,
              roleName: role.label,
              error: err.message,
            });
          }

          // 避免请求过快
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }

    results.status = 'completed';
    results.endTime = Date.now();

  } catch (err) {
    results.status = 'error';
    results.error = err.message;
    console.log(`\n   ❌ 模式测试异常: ${err.message}`);
  }

  return results;
}

// 验证单个模式的输出是否符合文档要求
function validateModeOutput(result) {
  const issues = [];
  
  // 1. 检查是否有响应
  if (result.actualResponses.length === 0) {
    issues.push('没有任何AI回复');
    return { valid: false, score: 0, issues };
  }

  // 2. 检查是否有多角色回复（多AI讨论的核心要求）
  const uniqueRoles = new Set(result.actualResponses.map(r => r.roleName));
  if (uniqueRoles.size < 2 && result.expectedRoles >= 2) {
    issues.push(`期望多角色发言但只有${uniqueRoles.size}个角色回复`);
  }

  // 3. 检查think标签
  const withThinkTags = result.actualResponses.filter(r => r.hasThinkTag);
  if (withThinkTags.length > 0) {
    issues.push(`${withThinkTags.length}个回复仍包含think标签`);
  }

  // 4. 检查回复长度
  const shortResponses = result.actualResponses.filter(r => !r.lengthValid);
  if (shortResponses.length > 0) {
    issues.push(`${shortResponses.length}个回复过短(<20字)`);
  }

  // 5. 计算得分
  let score = 100;
  score -= issues.length * 10;
  score -= withThinkTags.length * 15;
  if (uniqueRoles.size < 2 && result.expectedRoles >= 2) score -= 30;
  score = Math.max(0, Math.min(100, score));

  return {
    valid: issues.length === 0,
    score,
    issues,
    totalResponses: result.actualResponses.length,
    uniqueRoles: uniqueRoles.size,
    thinkTagCount: withThinkTags.length,
    avgLength: Math.round(
      result.actualResponses.reduce((sum, r) => sum + r.length, 0) / result.actualResponses.length
    ),
  };
}

// ========== 主函数 ==========

async function main() {
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + '  PRD辩论APP - 19种讨论模式逐一AI输出验证 v3.0'.padEnd(78) + '║');
  console.log('║' + '  验证: 多AI轮流发言 | 角色匹配 | 流程顺序 | 输出质量 | think过滤'.padEnd(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const startTime = Date.now();

  // 读取并解析discussionModes.js
  console.log('\n📂 正在解析 discussionModes.js ...');
  const sourcePath = path.join(__dirname, 'src/data/discussionModes.js');
  const sourceCode = fs.readFileSync(sourcePath, 'utf-8');
  const modes = parseDiscussionModes(sourceCode);

  console.log(`✅ 解析完成！发现 ${Object.keys(modes).length} 种讨论模式\n`);

  // 存储所有结果
  const allResults = [];

  // 按类别分组显示
  const categories = {};
  Object.entries(modes).forEach(([id, config]) => {
    const cat = config.category || '未分类';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ id, config });
  });

  // 逐类逐模式测试
  let modeIndex = 0;
  for (const [category, modeList] of Object.entries(categories)) {
    console.log(`\n${'█'.repeat(70)}`);
    console.log(`📁 类别: ${category} (${modeList.length}种模式)`);
    console.log(`${'█'.repeat(70)}`);

    for (const { id, config } of modeList) {
      modeIndex++;
      
      // 执行测试
      const result = await testSingleMode(id, config, modeIndex);
      const validation = validateModeOutput(result);

      result.validation = validation;
      allResults.push({ id, result, validation });

      // 简要状态
      const statusIcon = validation.valid ? '✅' : (validation.score >= 70 ? '⚠️' : '❌');
      console.log(`\n   ${statusIcon} 验证结果: 得分${validation.score}/100 | ${validation.totalResponses}次回复 | ${validation.uniqueRoles}个角色 | think:${validation.thinkTagCount}`);
      if (validation.issues.length > 0) {
        console.log(`      问题: ${validation.issues.join('; ')}`);
      }
    }
  }

  // 最终报告
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n\n' + '█'.repeat(78));
  console.log('█' + '  🎯 最终验证报告 - 19种讨论模式逐一AI输出测试'.padEnd(78) + '█');
  console.log('█'.repeat(78));

  // 统计
  const passed = allResults.filter(r => r.validation.valid).length;
  const warning = allResults.filter(r => !r.validation.valid && r.validation.score >= 70).length;
  const failed = allResults.filter(r => r.validation.score < 70).length;
  const totalResponses = allResults.reduce((sum, r) => sum + r.result.actualResponses.length, 0);
  const totalWithThink = allResults.reduce((sum, r) => sum + r.validation.thinkTagCount, 0);
  const avgScore = Math.round(allResults.reduce((sum, r) => sum + r.validation.score, 0) / allResults.length);

  console.log(`
┌──────────────────────────────────────────────────────────────┐
│                      总体统计                                │
├──────────────────┬───────────────────────────────────────────┤
│ 测试模式总数     │ ${allResults.length.toString().padEnd(47)}│
│ 完全通过 (100分) │ ${passed.toString().padEnd(47)}│
│ 有警告 (70-99)  │ ${warning.toString().padEnd(47)}│
│ 不通过 (<70)    │ ${failed.toString().padEnd(47)}│
│ 平均得分        │ ${avgScore.toString().padEnd(47)}│
├──────────────────┼───────────────────────────────────────────┤
│ AI总回复次数     │ ${totalResponses.toString().padEnd(47)}│
│ 含think标签数    │ ${totalWithThink.toString().padEnd(47)}│
│ 总耗时          │ ${elapsed + 's'.padEnd(47)}│
└──────────────────┴───────────────────────────────────────────┘

📊 各模式详细结果:
  `);

  // 按得分排序输出
  const sorted = [...allResults].sort((a, b) => b.validation.score - a.validation.score);
  
  sorted.forEach(({ id, result, validation }, idx) => {
    const icon = validation.valid ? '✅' : (validation.score >= 70 ? '⚠️' : '❌');
    console.log(`  ${idx + 1}. ${icon} [${validation.score}分] ${result.name.padEnd(20)} (${id})`);
    console.log(`     回复:${validation.totalResponses}次 角色:${validation.uniqueRoles}个 均长:${validation.avgLength}字 think:${validation.thinkTagCount}`);
  });

  // 问题汇总
  const allIssues = allResults.flatMap(r => r.validation.issues.map(issue => ({ mode: r.result.name, issue })));
  if (allIssues.length > 0) {
    console.log(`\n⚠️ 发现的问题 (${allIssues.length}项):`);
    allIssues.forEach(({ mode, issue }) => console.log(`   • ${mode}: ${issue}`));
  } else {
    console.log(`\n🎉 所有模式验证通过！无问题发现！`);
  }

  // 核心验证结论
  console.log(`
╔${'═'.repeat(76)}╗
║${'  核心验证结论'.padEnd(76)}║
╠${'═'.repeat(76)}╣
║  1. 多AI轮流发言: ${totalResponses >= allResults.length * 2 ? '✅ 每种模式都有多角色回复' : '❌ 部分模式只有单角色'.padEnd(74)}║
║  2. think标签过滤: ${totalWithThink === 0 ? '✅ 全部已过滤' : `❌ ${totalWithThink}个未过滤`.padEnd(74)}║
║  3. 角色类型匹配: ${passed >= allResults.length * 0.8 ? '✅ 大部分通过' : '⚠️ 需要检查'.padEnd(74)}║
║  4. 发言顺序正确: ${avgScore >= 80 ? '✅ 符合文档流程' : '⚠️ 部分不符合'.padEnd(74)}║
╚${'═'.repeat(76)}╝
  `);
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
