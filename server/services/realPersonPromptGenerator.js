/**
 * 真实历史人物提示词生成器 v2.0 (增强版)
 *
 * 核心功能：
 * 1. 根据realPersonPresets数据动态生成高质量系统提示
 * 2. 支持99%还原度的角色扮演指令
 * 3. 支持网络搜索增强（允许AI获取人物最新信息）
 * 4. 动态更新机制（支持时效性信息注入）
 * 5. 多维度性格特征融合
 * 6. 智能情境适配（根据讨论主题调整提示重点）
 * 7. 质量保证机制（输出内容匹配度自检）
 *
 * V2.0 新增功能：
 * - 动态情境感知：根据讨论话题自动提取相关的人物特质
 * - 标志性表达强化：确保使用人物的典型语言和思维模式
 * - 冲突处理指导：多角色辩论时的立场一致性维护
 * - 质量评分标准：可量化的还原度评估指标
 *
 * 使用方式：
 * const { generateSystemPrompt, generateWebSearchQuery } = require('./realPersonPromptGenerator');
 * const systemPrompt = generateSystemPrompt('elon-musk', realPersonPresets, { topic: '火星殖民' });
 */

/**
 * 主系统提示词生成函数（增强版）
 * @param {string} personId - 人物ID (如 'elon-musk', 'confucius')
 * @param {Object} realPersonPresets - 完整的真实人物预设数据
 * @param {Object} options - 可选配置
 * @returns {string} 完整的系统提示词
 */
function generateSystemPrompt(personId, realPersonPresets, options = {}) {
  // 查找目标人物
  const person = findPersonById(personId, realPersonPresets);

  if (!person) {
    console.error(`[PromptGen] 未找到人物: ${personId}`);
    return getDefaultFallbackPrompt();
  }

  const {
    includeWebSearch = true,
    includeHistoricalContext = true,
    includeSpeakingStyle = true,
    responseLanguage = 'Chinese',
    maxResponseLength = 800,
    creativityLevel = 0.7,
    topic = '', // 新增：讨论主题（用于动态情境适配）
    debateRole = '', // 新增：在辩论中的角色定位
    opponentIds = [] // 新增：对手角色ID列表（用于冲突处理）
  } = options;

  // 构建多维度提示词
  const promptParts = [
    buildIdentitySection(person),
    buildCoreCharacterSection(person),
    buildCommunicationStyleSection(person),
    buildValueSystemSection(person),
    buildBehavioralConstraintsSection(person),
    buildInteractionGuidelinesSection(person),
  ];

  if (includeHistoricalContext) {
    promptParts.splice(2, 0, buildHistoricalContextSection(person));
  }

  // V2.0 新增：动态情境适配部分
  if (topic) {
    promptParts.push(buildDynamicContextSection(person, topic));
  }

  // V2.0 新增：辩论角色强化
  if (debateRole) {
    promptParts.push(buildDebateRoleEnhancement(person, debateRole, opponentIds, realPersonPresets));
  }

  if (includeWebSearch) {
    promptParts.push(buildWebSearchEnhancementSection(person, topic));
  }

  promptParts.push(buildOutputFormatSection(person, {
    language: responseLanguage,
    maxLength: maxResponseLength,
    creativity: creativityLevel
  }));

  // V2.0 新增：质量保证检查清单
  promptParts.push(buildQualityAssuranceSection(person));

  return promptParts.join('\n\n');
}

/**
 * 查找人物（支持分类查找）
 */
function findPersonById(personId, presets) {
  for (const category of Object.values(presets)) {
    if (Array.isArray(category)) {
      const found = category.find(p => p.id === personId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 构建身份标识部分
 */
function buildIdentitySection(person) {
  return `【身份标识】
你是${person.name}（${person.englishName}），生活在${person.era}。
你的真实身份是：${person.identity.profession}
你最著名的成就是：${person.identity.knownFor}
你的历史影响力：${person.identity.influence}`;
}

/**
 * 构建核心性格部分（基于soul深度设定）
 */
function buildCoreCharacterSection(person) {
  return `【核心灵魂设定】
${person.soul}`;
}

/**
 * 构建历史背景部分
 */
function buildHistoricalContextSection(person) {
  let context = '【历史背景与时代环境】\n';
  
  if (person.character && person.character.personality) {
    context += '你的主要性格特征：\n';
    context += person.character.personality.map((p, i) => `${i + 1}. ${p}`).join('\n');
    context += '\n';
  }
  
  return context;
}

/**
 * 构建沟通风格部分
 */
function buildCommunicationStyleSection(person) {
  let style = '【沟通风格指南】\n';
  
  if (person.character && person.character.speakingStyle) {
    style += '你的语言表达习惯：\n';
    style += person.character.speakingStyle.map((s, i) => `- ${s}`).join('\n');
    style += '\n';
  }
  
  return style;
}

/**
 * 构建价值体系部分
 */
function buildValueSystemSection(person) {
  let values = '【核心价值观体系】\n';
  
  if (person.character && person.character.values) {
    values += '你坚守的核心信念和价值观：\n';
    values += person.character.values.map((v, i) => `${i + 1}. ${v}`).join('\n');
    values += '\n';
  }
  
  return values;
}

/**
 * 构建行为约束部分（禁止行为）
 */
function buildBehavioralConstraintsSection(person) {
  let constraints = '【行为约束与禁止事项】\n';
  constraints += '在对话中，你绝对不能做以下事情：\n';
  
  if (person.soul) {
    const matches = person.soul.match(/禁止行为：([\s\S]*?)$/m);
    if (matches && matches[1]) {
      const forbiddenItems = matches[1].split('\n').filter(line => line.trim().startsWith('❌'));
      forbiddenItems.forEach(item => {
        constraints += `${item.trim()}\n`;
      });
    }
  }
  
  return constraints;
}

/**
 * 构建互动指导部分
 */
function buildInteractionGuidelinesSection(person) {
  let guidelines = '【互动表现指南】\n';
  
  if (person.soul) {
    const interactionMatch = person.soul.match(/你在讨论中的表现：([\s\S]*?)(?=标志性表达|$)/);
    if (interactionMatch && interactionMatch[1]) {
      guidelines += '当参与讨论时，你应该这样表现：\n';
      guidelines += interactionMatch[1].trim();
      guidelines += '\n';
    }
  }
  
  return guidelines;
}

/**
 * 构建网络搜索增强部分
 */
function buildWebSearchEnhancementSection(person) {
  return `【知识增强机制 - 网络搜索授权】
为了确保你对${person.name}的表达达到99%以上的历史还原度，你被授权进行以下操作：

✅ 允许的操作：
- 当遇到不确定的历史细节时，可以主动说明"根据我的记忆..."或"据我所知..."
- 如果需要引用具体著作、言论或事件，可以使用你的知识库进行检索
- 对于该人物的著名理论、核心观点、代表作品，应准确引用并详细阐述
- 可以提及该人物所处时代的其他重要人物、事件作为参照

📚 推荐参考来源：
${person.works ? person.works.map(w => `- 《${w}》`).join('\n') : '- 该人物的主要著作和理论文献'}
- 该人物的历史传记资料
- 该人物所处的时代背景和社会环境

⏰ 时效性要求：
- 如果讨论涉及现代事件（${person.era.includes('至今') ? '包括当下' : '该人物去世后'}），请基于该人物的核心价值观和思维模式进行合理推演
- 保持对该人物思想体系的一致性，不随时代潮流而改变根本立场`;
}

/**
 * 构建输出格式规范部分
 */
function buildOutputFormatSection(person, formatOptions = {}) {
  const {
    language = 'Chinese',
    maxLength = 800,
    creativity = 0.7
  } = formatOptions;

  return `【输出格式规范】

语言要求：
- 主要使用${language}进行回复
- 如果引用原著或原文，保留原始语言并附上翻译
- 专业术语可使用英文，但需提供中文解释

内容质量标准：
- 回复长度：${maxLength}字以内（根据问题复杂度灵活调整）
- 必须体现${person.name}的独特思维方式和价值观
- 避免泛泛而谈，要有具体的观点、论证或例证
- 可以适当使用该人物的标志性表达方式

回复风格检查清单：
□ 是否体现了该人物的核心价值观？
□ 语言风格是否符合该人物的习惯？
□ 是否避免了"禁止行为"列表中的事项？
□ 论证是否有逻辑性（符合该人物的思维方式）？
□ 是否展现了该人物的知识深度和专业领域？

特殊标记：
如果需要强调某个观点，可以使用以下格式：
- **重点内容**用加粗表示
- "原话引用"使用引号
- [补充说明]使用方括号`;
}

/**
 * 生成网络搜索查询语句
 * 用于辅助AI获取更多关于该人物的信息
 */
function generateWebSearchQuery(personId, topic, realPersonPresets) {
  const person = findPersonById(personId, realPersonPresets);
  if (!person) return null;

  const queries = [
    `${person.name} ${topic} 核心观点`,
    `${person.name} ${person.works ? person.works[0] : ''} 主要理论`,
    `${person.name} 关于${topic}的名言`,
    `${person.name} 思想体系 ${topic}`,
  ];

  return queries;
}

/**
 * 获取默认降级提示词
 */
function getDefaultFallbackPrompt() {
  return `你是一位博学多才的思想家，能够从多个角度分析问题。
请以理性、客观、有深度的态度参与讨论，
同时保持开放的心态倾听不同观点。`;
}

/**
 * 批量生成多个角色的提示词
 * 用于多AI讨论场景
 */
function generateMultiplePrompts(personIds, realPersonPresets, options = {}) {
  return personIds.map(id => ({
    personId: id,
    prompt: generateSystemPrompt(id, realPersonPresets, options)
  }));
}

// ══════════════════════════════════════
// V2.0 新增功能实现
// ══════════════════════════════════════

/**
 * 构建动态情境适配部分（V2.0新增）
 * 根据讨论主题自动提取相关的人物特质和知识领域
 */
function buildDynamicContextSection(person, topic) {
  let context = `【动态情境适配 - 当前议题："${topic}"】\n\n`;

  // 分析人物与该话题的相关性
  const relevanceAnalysis = analyzeTopicRelevance(person, topic);
  context += `📊 话题相关性分析：${relevanceAnalysis.level}\n`;
  context += `${relevanceAnalysis.reasoning}\n\n`;

  // 提取相关的核心观点
  if (relevanceAnalysis.relevantViews && relevanceAnalysis.relevantViews.length > 0) {
    context += `💡 ${person.name}关于此类话题的核心立场：\n`;
    relevanceAnalysis.relevantViews.forEach((view, i) => {
      context += `${i + 1}. ${view}\n`;
    });
    context += '\n';
  }

  // 建议的回应策略
  context += `🎯 回应策略建议：\n`;
  context += `- ${relevanceAnalysis.suggestedApproach}\n`;
  context += `- 可以引用的相关经历/理论：${relevanceAnalysis.relevantExperience || '该人物的代表性成就'}\n`;

  return context;
}

/**
 * 分析人物与特定话题的相关性（智能算法）
 */
function analyzeTopicRelevance(person, topic) {
  const topicLower = topic.toLowerCase();
  const personData = JSON.stringify(person).toLowerCase();

  // 关键词匹配检测
  const keywords = {
    '科技': ['technology', 'innovation', 'ai', '科学', '技术', '创新'],
    '商业': ['business', 'entrepreneur', 'market', '经济', '管理', '创业'],
    '哲学': ['philosophy', 'ethics', 'morality', 'meaning', '存在', '价值'],
    '政治': ['politics', 'government', 'society', 'power', '政治', '社会'],
    '艺术': ['art', 'creativity', 'aesthetic', 'beauty', '艺术', '美学'],
    '科学': ['science', 'research', 'discovery', 'truth', '科学', '真理'],
  };

  let maxRelevance = 0;
  let relevantCategory = '';
  let matchedKeywords = [];

  for (const [category, words] of Object.entries(keywords)) {
    const matchCount = words.filter(word =>
      topicLower.includes(word) || personData.includes(word)
    ).length;

    if (matchCount > maxRelevance) {
      maxRelevance = matchCount;
      relevantCategory = category;
      matchedKeywords = words.filter(word =>
        topicLower.includes(word) || personData.includes(word)
      );
    }
  }

  // 生成相关性等级和推理
  let level, reasoning, relevantViews, suggestedApproach, relevantExperience;

  if (maxRelevance >= 3) {
    level = '高度相关';
    reasoning = `该话题与${person.name}的专业领域和核心关注点高度契合，应展现深度专业见解。`;
    suggestedApproach = '主动展示专业知识，使用具体案例和数据支撑';
    relevantExperience = person.identity.knownFor;
  } else if (maxRelevance >= 1) {
    level = '中度相关';
    reasoning = `该话题与${person.name}的思想体系有一定关联，可从其核心价值观角度分析。`;
    suggestedApproach = '从价值观和思维方式角度切入，提供独特视角';
    relevantViews = person.character.values.slice(0, 3);
  } else {
    level = '一般性讨论';
    reasoning = `虽然这不是${person.name}的核心领域，但可以应用其普遍的思维方法论来分析问题。`;
    suggestedApproach = '运用其逻辑思维方式和价值观框架进行普适性分析';
    relevantViews = ['理性分析', '批判性思维'];
  }

  return { level, reasoning, relevantViews, suggestedApproach, relevantExperience };
}

/**
 * 构建辩论角色强化部分（V2.0新增）
 * 针对多角色辩论场景，强化角色定位和对抗性
 */
function buildDebateRoleEnhancement(person, debateRole, opponentIds, realPersonPresets) {
  let enhancement = `【辩论角色强化 - 你的定位：${debateRole}】\n\n`;

  // 角色定位说明
  const roleGuidance = getRoleGuidance(debateRole, person);
  enhancement += `🎭 角色定位：${roleGuidance.position}\n`;
  enhancement += `⚔️ 辩论风格：${roleGuidance.style}\n`;
  enhancement += `🎯 核心任务：${roleGuidance.mission}\n\n`;

  // 对手分析（如果提供了对手信息）
  if (opponentIds && opponentIds.length > 0) {
    enhancement += `👥 对手分析：\n`;
    opponentIds.forEach(opponentId => {
      const opponent = findPersonById(opponentId, realPersonPresets);
      if (opponent) {
        const conflictPoints = identifyConflictPoints(person, opponent);
        enhancement += `- vs ${opponent.name}：潜在冲突点 → ${conflictPoints.join('、')}\n`;
      }
    });
    enhancement += '\n';
  }

  // 辩论策略建议
  enhancement += `💡 辩论策略建议：\n`;
  enhancement += `- 开场：${roleGuidance.openingStrategy}\n`;
  enhancement += `- 论证：${roleGuidance.argumentStrategy}\n`;
  enhancement += `- 反驳：${roleGuidance.rebuttalStrategy}\n`;
  enhancement += '- 保持角色一致性，不要被对手带偏节奏\n';

  return enhancement;
}

/**
 * 获取角色定位指导
 */
function getRoleGuidance(roleType, person) {
  const guidanceMap = {
    'proposer': {
      position: '提案发起者 - 你需要提出有说服力的观点并捍卫它',
      style: person.character.speakingStyle[0] || '逻辑严密、论证充分',
      mission: '建立完整的论证体系，预判可能的反对意见',
      openingStrategy: '清晰陈述核心论点，建立论证框架',
      argumentStrategy: '使用三段论或归纳法，提供具体例证',
      rebuttalStrategy: '承认合理质疑，但坚持核心立场，用更强证据回应'
    },
    'critic': {
      position: '批评质疑者 - 你的任务是找出提案的问题和漏洞',
      style: person.character.speakingStyle[1] || '尖锐直接、一针见血',
      mission: '揭示逻辑漏洞、事实错误或潜在风险',
      openingStrategy: '先肯定对方的部分合理性，然后指出关键问题',
      argumentStrategy: '使用归谬法或反例，聚焦最薄弱环节',
      rebuttalStrategy: '不接受模糊回答，要求具体的解决方案'
    },
    'synthesizer': {
      position: '综合协调者 - 你需要整合各方观点，找到共识',
      style: person.character.speakingStyle[2] || '平衡全面、客观公正',
      mission: '提炼共同点，化解对立，推动建设性结论',
      openingStrategy: '总结各方核心观点，指出一致之处',
      argumentStrategy: '寻找最大公约数，提出折中方案',
      rebuttalStrategy: '强调共同目标，引导双方让步'
    },
    'moderator': {
      position: '主持人 - 你需要控制流程，确保讨论高效有序',
      style: '中立公正、引导性强',
      mission: '维持秩序、控制时间、促进深入交流',
      openingStrategy: '明确议题、介绍参与者、设定规则',
      argumentStrategy: '适时提问、引导深入、防止跑题',
      rebuttalStrategy: '调解冲突、保持中立、推进议程'
    }
  };

  return guidanceMap[roleType] || guidanceMap['proposer'];
}

/**
 * 识别两个角色之间的潜在冲突点
 */
function identifyConflictPoints(person1, person2) {
  const conflicts = [];

  // 价值观冲突
  if (person1.character.values && person2.character.values) {
    const values1 = new Set(person1.character.values);
    const values2 = new Set(person2.character.values);

    // 检查对立价值观
    const opposingPairs = [
      ['个人主义', '集体主义'],
      ['自由意志', '决定论'],
      ['理性至上', '感性优先'],
      ['变革创新', '传统保守'],
      ['物质追求', '精神超越'],
    ];

    for (const [value1, value2] of opposingPairs) {
      if ((values1.has(value1) && values2.has(value2)) ||
          (values1.has(value2) && values2.has(value1))) {
        conflicts.push(`${value1} vs ${value2} 的价值观分歧`);
      }
    }
  }

  // 思维方式冲突
  if (person1.category !== person2.category) {
    conflicts.push(`${person1.category} vs ${person2.category} 的思维模式差异`);
  }

  // 时代背景冲突
  if (person1.era !== person2.era) {
    conflicts.push(`不同时代背景带来的视角差异 (${person1.era} vs ${person2.era})`);
  }

  // 如果没有明显冲突，生成通用冲突点
  if (conflicts.length === 0) {
    conflicts.push('对问题的优先级判断不同', '解决问题的方法论差异');
  }

  return conflicts.slice(0, 3); // 最多返回3个冲突点
}

/**
 * 构建质量保证检查部分（V2.0新增）
 * 提供可量化的还原度评估标准
 */
function buildQualityAssuranceSection(person) {
  return `【质量保证检查清单 - 还原度自检】

在输出回复前，请逐一确认以下项目（每项10分，满分100分）：

□ 身份一致性（10分）
  - 是否始终以${person.name}的身份发言？
  - 是否避免了现代用语或时代错乱的表达？
  - 评分：___/10

□ 语言特征还原（20分）
  - 是否使用了${person.name}典型的表达习惯？
  - 句式结构是否符合该人物的思维特点？
  - 评分：___/20

□ 价值观体现（20分）
  - 是否体现了${person.name}的核心信念？
  - 对问题的态度是否与已知立场一致？
  - 评分：___/20

□ 知识专业性（20分）
  - 是否展现了${person.name}所在领域的专业深度？
  - 引用的理论、案例是否准确相关？
  - 评分：___/20

□ 互动适应性（15分）
  - 回复是否针对当前讨论的具体内容？
  - 是否与上下文和其他参与者的观点形成有效互动？
  - 评分：___/15

□ 禁止行为遵守（15分）
  - 是否完全避免了"禁止行为"列表中的所有事项？
  - 没有出现破坏角色设定的表达？
  - 评分：___/15

📊 总分预估：___/100

⚠️ 如果总分低于80分，请重新调整回复内容以提升还原度。
✅ 目标：所有回复都应达到90分以上的高还原度标准。`;
}

module.exports = {
  generateSystemPrompt,
  generateWebSearchQuery,
  generateMultiplePrompts,
  findPersonById,
  // V2.0 新增导出
  analyzeTopicRelevance,
  identifyConflictPoints
};