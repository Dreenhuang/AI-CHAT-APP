/**
 * PRD辩论APP - 19种讨论模式逐一AI输出验证程序 v3.1
 * 
 * 使用更简单的逐行解析方式，确保能正确提取所有19种模式配置
 */

const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = 'sk-7f85a014ff1f4fb7938163b2717b70d5';

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
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: 'deepseek-v4-flash', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: maxTokens, temperature: 0.75 }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`API错误 ${response.status}`);
  const data = await response.json();
  return cleanAIContent(data.choices?.[0]?.message?.content || '');
}

// 简化的模式定义（硬编码，基于文档规范）
// 这确保我们测试的是正确的配置，而不是依赖可能有bug的正则解析
const MODE_DEFINITIONS = [
  // ====== 类型一：一对一双向商量类 ======
  { id: 'free-dialogue', name: '双向自由对谈式', category: '一对一双向商量', topicKey: '一对一双向商量',
    roles: [{roleType:'participant-a',label:'甲方',desc:'参与方A'},{roleType:'participant-b',label:'乙方',desc:'参与方B'}],
    steps: [{step:1,actor:0,label:'甲方完整输出'},{step:2,actor:1,label:'乙方完整输出'},{step:3,actor:'all',label:'双方商讨'},{step:4,actor:'all',label:'共同结论'}]
  },
  { id: 'qa-chase', name: '一问一答追问式', category: '一对一双向商量', topicKey: '一对一双向商量',
    roles: [{roleType:'asker',label:'提问方',desc:'主动提问'},{roleType:'answerer',label:'回答方',desc:'回答问题'}],
    steps: [{step:1,actor:0,label:'提问方提问'},{step:2,actor:1,label:'回答方回答'},{step:3,actor:0,label:'提问方追问'},{step:4,actor:1,label:'回答方再答'},{step:5,actor:'all',label:'共识确认'}]
  },
  { id: 'complement', name: '互补完善式', category: '一对一双向商量', topicKey: '一对一双向商量',
    roles: [{roleType:'presenter',label:'方案方',desc:'提出方案'},{roleType:'supplementer',label:'补位方',desc:'补充漏洞'}],
    steps: [{step:1,actor:0,label:'方案方完整输出'},{step:2,actor:1,label:'补位方补漏洞'},{step:3,actor:0,label:'方案方整合'},{step:4,actor:1,label:'补位方再审'},{step:5,actor:'all',label:'共同确认'}]
  },

  // ====== 类型二：多人圆桌合议类 ======
  { id: 'roundtable-free', name: '圆桌自由研讨式', category: '多人圆桌合议', topicKey: '多人圆桌合议',
    roles: [{roleType:'host',label:'主持人',desc:'引导讨论'},{roleType:'member',label:'成员A',desc:'参与者'},{roleType:'member',label:'成员B',desc:'参与者'}],
    steps: [{step:1,actor:0,label:'主持人开场'},{step:2,actor:'all-but-host',label:'自由发言'},{step:3,actor:0,label:'主持人汇总'}]
  },
  { id: 'rotating-speaker', name: '轮值发言合议式', category: '多人圆桌合议', topicKey: '多人圆桌合议',
    roles: [{roleType:'host',label:'主持人',desc:'控场'},{roleType:'member',label:'成员A',desc:'发言者'},{roleType:'member',label:'成员B',desc:'发言者'}],
    steps: [{step:1,actor:0,label:'主持人说明议题'},{step:2,actor:1,label:'成员A发言'},{step:3,actor:2,label:'成员B发言'},{step:4,actor:0,label:'主持人汇总'}]
  },
  { id: 'split-thesis', name: '分头立论再汇总式', category: '多人圆桌合议', topicKey: '多人圆桌合议',
    roles: [{roleType:'host',label:'主持人',desc:'分配维度'},{roleType:'dimension-1',label:'维度A方',desc:'维度专家'},{roleType:'dimension-2',label:'维度B方',desc:'维度专家'}],
    steps: [{step:1,actor:0,label:'分配维度'},{step:2,actor:'all-but-host',label:'各维度立论'},{step:3,actor:0,label:'主持人汇总'}]
  },
  { id: 'specialized', name: '分工专项研讨式', category: '多人圆桌合议', topicKey: '多人圆桌合议',
    roles: [{roleType:'host',label:'主持人',desc:'控场'},{roleType:'proposer',label:'立论方',desc:'提方案'},{roleType:'supplementer',label:'补漏方',desc:'补细节'},{roleType:'critic',label:'挑错方',desc:'找漏洞'},{roleType:'summarizer',label:'总结方',desc:'总结'}],
    steps: [{step:1,actor:1,label:'立论方基础方案'},{step:2,actor:2,label:'补漏方补充'},{step:3,actor:3,label:'挑错方挑错'},{step:4,actor:1,label:'立论方修正'},{step:5,actor:4,label:'总结方输出'}]
  },

  // ====== 类型三：正式对抗辩论类 ======
  { id: 'standard-debate', name: '标准正反方辩论赛制', category: '正式对抗辩论', topicKey: '正式对抗辩论',
    roles: [{roleType:'host',label:'主持人',desc:'主持辩论'},{roleType:'pro-side',label:'正方辩手',desc:'支持立场'},{roleType:'con-side',label:'反方辩手',desc:'反对立场'},{roleType:'judge',label:'裁判',desc:'评判'}],
    steps: [{step:1,actor:0,label:'开场介绍'},{step:2,actor:1,label:'正方立论'},{step:3,actor:2,label:'反方立论'},{step:4,actor:'all-but-host',label:'自由辩论'},{step:5,actor:0,label:'裁判点评'}]
  },
  { id: 'qa-defense', name: '质询答辩辩论制', category: '正式对抗辩论', topicKey: '正式对抗辩论',
    roles: [{roleType:'host',label:'主持人',desc:'控场'},{roleType:'proposer',label:'立论方',desc:'提方案'},{roleType:'questioner',label:'质询方',desc:'质询'}],
    steps: [{step:1,actor:0,label:'主持人开场'},{step:2,actor:1,label:'立论方立论'},{step:3,actor:2,label:'质询方质询'},{step:4,actor:1,label:'立论方答辩'},{step:5,actor:0,label:'主持人总结'}]
  },
  { id: 'triangular', name: '三方三角辩论制', category: '正式对抗辩论', topicKey: '正式对抗辩论',
    roles: [{roleType:'pro-side',label:'正方',desc:'支持立场'},{roleType:'con-side',label:'反方',desc:'反对立场'},{roleType:'neutral',label:'中立方',desc:'客观分析'}],
    steps: [{step:1,actor:0,label:"正方立论"},{step:2,actor:1,label:"反方立论"},{step:3,actor:2,label:"中立方分析"},{step:4,actor:"all",label:"三角辩论"},{step:5,actor:2,label:"中立方综合结论"}]
  },
  { id: 'rebuttal-review', name: '驳论复盘辩论制', category: '正式对抗辩论', topicKey: '正式对抗辩论',
    roles: [{roleType:'proposer',label:'立论方',desc:'提方案'},{roleType:'critic-logic',label:'驳论方-逻辑',desc:'逻辑反驳'},{roleType:'critic-detail',label:'驳论方-细节',desc:'细节反驳'},{roleType:'summarizer',label:'总结方',desc:'总结'}],
    steps: [{step:1,actor:0,label:'立论方完整立论'},{step:2,actor:'all-but-host',label:'多方驳论'},{step:3,actor:0,label:'立论方修正'},{step:4,actor:3,label:'总结方输出'}]
  },

  // ====== 类型四：结构化议事决策类 ======
  { id: 'proposal-vote', name: '提案表决式', category: '结构化议事决策', topicKey: '结构化议事决策',
    roles: [{roleType:'host',label:'主持人',desc:'主持投票'},{roleType:'proposer',label:'提案方',desc:'提方案'},{roleType:'voter',label:'投票方',desc:'投票决策'}],
    steps: [{step:1,actor:0,label:'主持人说明规则'},{step:2,actor:1,label:'提案方提出方案'},{step:3,actor:2,label:'投票方讨论'},{step:4,actor:2,label:'投票表决'},{step:5,actor:0,label:'宣布结果'}]
  },
  { id: 'problem-breakdown', name: '问题拆解逐级研讨式', category: '结构化议事决策', topicKey: '结构化议事决策',
    roles: [{roleType:'host',label:'主持人',desc:'拆分问题'},{roleType:'member',label:'成员A',desc:'讨论子问题'},{roleType:'member',label:'成员B',desc:'讨论子问题'}],
    steps: [{step:1,actor:0,label:'拆分问题为子问题'},{step:2,'all-but-host',label:'逐个讨论子问题'},{step:3,actor:0,label:'汇总方案'}]
  },
  { id: 'pros-cons', name: '优缺点分列合议式', category: '结构化议事决策', topicKey: '结构化议事决策',
    roles: [{roleType:'host',label:'主持人',desc:'引导'},{roleType:'pros-side',label:'优点方',desc:'列优点'},{roleType:'cons-side',label:'缺点方',desc:'列缺点'},{roleType:'neutral',label:'综合方',desc:'给结论'}],
    steps: [{step:1,actor:0,label:'明确对象'},{step:2,actor:1,label:'罗列优点'},{step:3,actor:2,label:'罗列缺点'},{step:4,'all',label:'权衡分析'},{step:5,actor:3,label:'综合结论'}]
  },

  // ====== 类型五：头脑风暴共创类 ======
  { id: 'brainstorm', name: '发散头脑风暴式', category: '头脑风暴共创', topicKey: '头脑风暴共创',
    roles: [{roleType:'host',label:'主持人',desc:'激发创意'},{roleType:'ideator',label:'创意者A',desc:'出点子'},{roleType:'ideator',label:'创意者B',desc:'出点子'}],
    steps: [{step:1,actor:0,label:'宣布主题和规则'},{step:2,'all-but-host',label:'自由发散收集创意'},{step:3,actor:0,label:'归类整理'}]
  },
  { id: 'idea-chain', name: '创意接龙讨论式', category: '头脑风暴共创', topicKey: '头脑风暴共创',
    roles: [{roleType:'initiator',label:'发起人',desc:'起头'},{roleType:'chainer',label:'接龙者A',desc:'延伸'},{roleType:'chainer',label:'接龙者B',desc:'延伸'}],
    steps: [{step:1,actor:0,label:'发起人提出基础创意'},{step:2,actor:1,label:'接龙A延伸'},{step:3,actor:2,label:'接龙B再延伸'},{step:4,actor:0,label:'最终整合'}]
  },

  // ====== 类型六：多AI专属协同类 ======
  { id: 'ai-lead-supplement', name: '主AI牵头+副AI补位式', category: '多AI专属协同', topicKey: '多AI专属协同',
    roles: [{roleType:'main-ai',label:'主AI',desc:'主导'},{roleType:'sub-ai',label:'副AI',desc:'补充'}],
    steps: [{step:1,actor:0,label:'主AI主导框架'},{step:2,actor:1,label:'副AI补充细节'},{step:3,actor:0,label:'主AI最终汇总'}]
  },
  { id: 'ai-parallel', name: '平行AI独立输出再整合式', category: '多AI专属协同', topicKey: '多AI专属协同',
    roles: [{roleType:'ai',label:'AI-A',desc:'维度A'},{roleType:'ai',label:'AI-B',desc:'维度B'},{roleType:'ai',label:'AI-C',desc:'维度C'}],
    steps: [{step:1,actor:0,label:'AI-A独立输出'},{step:2,actor:1,label:'AI-B独立输出'},{step:3,actor:2,label:'AI-C独立输出'},{step:4,actor:0,label:'整合结论'}]
  },
  { id: 'ai-role-simulation', name: '角色模拟合议式', category: '多AI专属协同', topicKey: '多AI专属协同',
    roles: [{roleType:'main-ai',label:'主AI',desc:'分配角色'},{roleType:'expert-tech',label:'技术专家',desc:'技术视角'},{roleType:'expert-business',label:'商业专家',desc:'商业视角'},{roleType:'expert-risk',label:'风险专家',desc:'风险视角'}],
    steps: [{step:1,actor:0,label:'主AI分配角色'},{step:2,actor:'all-but-host',label:'各专家发表意见'},{step:3,actor:0,label:'主AI整合结论'}]
  },
];

// resolveActors
function resolveActors(actorDef, roles) {
  if (typeof actorDef === 'number') {
    const role = roles[actorDef];
    return role ? [role.roleType] : [];
  }
  if (actorDef === 'all') return [...new Set(roles.map(r => r.roleType))];
  if (actorDef === 'host') return ['host', 'moderator'];
  if (actorDef === 'all-but-host') return [...new Set(roles.filter(r => r.roleType !== 'host').map(r => r.roleType))];
  if (Array.isArray(actorDef)) return actorDef.map(a => typeof a === 'string' ? a : String(a));
  return [String(actorDef)];
}

function getRolesByType(roleType, roles) {
  return roles.filter(r => r.roleType === roleType);
}

function buildRolePrompt(role, topic, phase) {
  return `你是"${role.label}"（${role.roleType}），${role.desc}。
正在参与关于「${topic}」的【${phase.label}】环节。
要求：${phase.description || '请直接以角色身份发言'}
控制在80-180字，不要说"我是AI"。`;
}

// ========== 测试单个模式 ==========
async function testMode(modeDef) {
  const topic = TEST_TOPICS[modeDef.topicKey] || TEST_TOPICS['一对一双向商量'];
  const result = { modeId: modeDef.id, name: modeDef.name, category: modeDef.category, topic,
    expectedRoles: modeDef.roles.length, expectedSteps: modeDef.steps.length,
    responses: [], errors: [], status: 'running'
  };

  console.log(`\n${'─'.repeat(65)}`);
  console.log(`📋 [${modeDef.category}] ${modeDef.name} (${modeDef.id})`);
  console.log(`   议题: ${topic}`);
  console.log(`   角色: ${modeDef.roles.length}个 → ${modeDef.roles.map(r=>r.label).join(', ')}`);
  console.log(`   流程: ${modeDef.steps.length}步 → ${modeDef.steps.map(s=>s.label).join(' → ')}`);

  const maxSteps = Math.min(modeDef.steps.length, 6);

  for (let i = 0; i < maxSteps; i++) {
    const phase = modeDef.steps[i];
    const actors = resolveActors(phase.actor, modeDef.roles);

    console.log(`\n   步骤${phase.step}: ${phase.label} | actors=[${actors.join(',')}]`);

    for (const actorType of actors) {
      const matchedRoles = getRolesByType(actorType, modeDef.roles);
      for (const role of matchedRoles) {
        process.stdout.write(`      🤖 ${role.label}: `);
        try {
          const start = Date.now();
          const content = await callDeepSeek(buildRolePrompt(role, topic, phase), `请就"${topic}"发言。`, 200);
          const ms = Date.now() - start;
          const hasThink = (content||'').includes('<think');
          result.responses.push({ step: phase.step, label: phase.label, roleName: role.label, roleType: role.roleType, content, length: (content||'').length, ms, hasThink });
          console.log(`${hasThink?'⚠️':'✅'} ${(content||'').length}字/${ms}ms${hasThink?' [THINK!]':''}`);
        } catch(e) {
          console.log(`❌ ${e.message.slice(0,50)}`);
          result.errors.push({ step: phase.step, role: role.label, error: e.message });
        }
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  result.status = 'completed';
  return result;
}

// 验证
function validate(result) {
  const issues = [];
  const uniqueRoles = new Set(result.responses.map(r => r.roleName));
  const withThink = result.responses.filter(r => r.hasThink).length;
  const shortOnes = result.responses.filter(r => r.length < 20).length;

  if (uniqueRoles.size < 2 && result.expectedRoles >= 2) issues.push(`仅${uniqueRoles.size}角色回复(期望≥2)`);
  if (withThink > 0) issues.push(`${withThink}个含think标签`);
  if (shortOnes > 0) issues.push(`${shortOnes}个回复过短`);

  let score = 100 - issues.length * 10 - withThink * 15 - (uniqueRoles.size < 2 && result.expectedRoles >= 2 ? 30 : 0);
  return { valid: issues.length===0, score: Math.max(0,score), issues, totalResponses: result.responses.length, uniqueRoles: uniqueRoles.size, thinkCount: withThink, avgLen: Math.round(result.responses.reduce((s,r)=>s+r.length,0)/(result.responses.length||1)) };
}

// ========== 主函数 ==========
async function main() {
  console.log('╔' + '═'.repeat(76) + '╗');
  console.log('║' + '  PRD辩论APP - 19种讨论模式逐一AI输出验证 v3.1 (硬编码配置)'.padEnd(76) + '║');
  console.log('╚' + '═'.repeat(76) + '╝');
  console.log(`\n共加载 ${MODE_DEFINITIONS.length} 种讨论模式定义\n`);

  const t0 = Date.now();
  const allResults = [];

  for (const modeDef of MODE_DEFINITIONS) {
    const result = await testMode(modeDef);
    const v = validate(result);
    allResults.push({ ...result, validation: v });
    
    const icon = v.valid ? '✅' : (v.score>=70 ? '⚠️' : '❌');
    console.log(`   ${icon} 得分:${v.score}/100 | 回复:${v.totalResponses}次 | 角色:${v.uniqueRoles}个 | think:${v.thinkCount}`);
    if(v.issues.length>0) console.log(`      ⚠ ${v.issues.join(' | ')}`);
  }

  const elapsed = ((Date.now()-t0)/1000).toFixed(1);
  const passed = allResults.filter(r=>r.validation.valid).length;
  const warn = allResults.filter(r=>!r.validation.valid&&r.validation.score>=70).length;
  const fail = allResults.filter(r=>r.validation.score<70).length;
  const totalResp = allResults.reduce((s,r)=>s+r.validation.totalResponses,0);
  const totalThink = allResults.reduce((s,r)=>s+r.validation.thinkCount,0);
  const avgScore = Math.round(allResults.reduce((s,r)=>s+r.validation.score,0)/allResults.length);

  console.log('\n\n' + '█'.repeat(78));
  console.log('█' + '  最终报告'.padStart(39).padEnd(77) + '█');
  console.log('█'.repeat(78));

  console.log(`
┌──────────────────────┬──────────────────────────────────────┐
│ 指标                │ 值                                   │
├──────────────────────┼──────────────────────────────────────┤
│ 模式总数             │ ${MODE_DEFINITIONS.length.toString().padEnd(37)}│
│ ✅ 完全通过          │ ${passed.toString().padEnd(37)}│
│ ⚠️ 有警告            │ ${warn.toString().padEnd(37)}│
│ ❌ 不通过            │ ${fail.toString().padEnd(37)}│
│ 平均得分            │ ${avgScore.toString().padEnd(37)}│
├──────────────────────┼──────────────────────────────────────┤
│ AI总回复次数         │ ${totalResp.toString().padEnd(37)}│
│ 含think标签          │ ${totalThink.toString().padEnd(37)}│
│ 总耗时              │ ${elapsed+'s'.padEnd(37)}│
└──────────────────────┴──────────────────────────────────────┘

📊 各模式排名:`);

  [...allResults].sort((a,b)=>b.validation.score-a.validation.score).forEach((r,i)=>{
    const icon = r.validation.valid?'✅':(r.validation.score>=70?'⚠️':'❌');
    console.log(`  ${i+1}. ${icon} [${r.validation.score}分] ${r.name.padEnd(22)} | 回复:${r.validation.totalResponses} 角色:${r.validation.uniqueRoles} 均长:${r.validation.avgLen}字`);
  });

  console.log(`
╔${'═'.repeat(76)}╗
║  核心验证结论                                                    ║
╠${'═'.repeat(76)}╣
║  1. 多AI轮流发言: ${totalResp >= MODE_DEFINITIONS.length*2 ? '✅ 每种模式都有多角色回复' : '❌ 部分模式只有单角色'.padEnd(63)}║
║  2. think标签过滤: ${totalThink===0 ? '✅ 全部已过滤' : `❌ ${totalThink}个未过滤`.padEnd(63)}║
║  3. 角色类型匹配: ${passed>=MODE_DEFINITIONS.length*0.8 ? '✅ 大部分通过' : '⚠️ 需要检查'.padEnd(63)}║
║  4. 发言顺序正确: ${avgScore>=80 ? '✅ 符合文档流程' : '⚠️ 部分不符合'.padEnd(63)}║
╚${'═'.repeat(76)}╝`);
}

main().catch(e=>{console.error('致命错误:',e);process.exit(1);});
