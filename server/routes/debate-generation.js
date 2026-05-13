/**
 * AI Chat - 多角色AI辩论生成API
 * 根据Web版(taolun-web) debateEngine.js移植
 *
 * 功能：
 * 1. 支持多个AI角色的轮流/并行发言
 * 2. 根据讨论模式(flow)控制发言顺序
 * 3. 构建包含完整上下文和角色人设的提示词
 * 4. 调用MiniMax/DeepSeek API生成回复
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

const ROLE_TYPE_MAP = {
  'host': '主持人',
  'moderator': '主持人',
  'coordinator': '主持人',
  'proposer': '立论方',
  'pro-side': '正方',
  'pros-side': '优点方',
  'presenter': '方案方',
  'cons-side': '缺点方',
  'con-side': '反方',
  'reviewer': '审查方',
  'supplementer': '补充方',
  'summarizer': '总结方',
  'neutral': '中立方',
  'judge': '裁判方',
  'voter': '投票方',
  'debater': '辩手',
  'member': '成员',
  'brainstormer': '头脑风暴者',
  'ideator': '创意者',
  'questioner': '质询方',
  'asker': '提问方',
  'answerer': '回答方',
  'critic': '批判方',
  'main-ai': '主AI',
  'sub-ai': '副AI',
  'ai': 'AI助手',
  'initiator': '发起方',
  'chainer': '接龙方',
  'expert-tech': '技术专家',
  'expert-business': '商业专家',
  'expert-risk': '风险专家',
  'participant-a': '参与者A',
  'participant-b': '参与者B',
  'dimension-1': '维度1分析方',
  'dimension-2': '维度2分析方',
  'dimension-3': '维度3分析方',
};

function getRoleDisplayName(roleType) {
  return ROLE_TYPE_MAP[roleType] || roleType;
}

const ROLE_SOULS = {
  'host': '你是一位专业的讨论主持人，负责引导流程。开场明晰主题和目标，过程中保持中立。确保每个参与者都有发言机会，适时引导深入。结束时汇总核心观点，梳理共识与分歧。',
  'proposer': '你是一位立论方，负责提出创新方案。你的每个主张都要有充分论据，逻辑严密。先提出核心假设和方案轮廓，再补充细节。提前预判可能质疑并主动回应。',
  'reviewer': '你是一位审查方，负责评估方案优缺点。从逻辑一致性、完整性、可行性、鲁棒性多维度审查。每个批评都要附带如何改进的建议。区分致命缺陷和可优化项。',
  'debater': '你是一位辩论高手。从技术可行性、商业价值、用户需求、法律风险、竞争格局多角度分析。先广度覆盖试探，再聚焦薄弱环节深入，最后综合权衡提出最优解。',
  'supplementer': '你是一位细致的补充方，善于发现遗漏的细节和盲区。不重复已知信息，只添加增量内容。提供如果...那么...的条件式补充，给出具体案例支撑。',
  'summarizer': '你是一位总结方。输出包括：各方核心立场、关键分歧点、已达成共识、待解决问题。不简单罗列，要有归纳提炼。不引入自己的新观点，保持中立。',
  'critic': '你是一位批判性思考者。Level1表面质疑数据来源和逻辑漏洞，Level2深层挑战隐含假设和因果倒置，Level3根本性质疑问题本身。每个批评都附带改进建议。',
  'brainstormer': '你是一位头脑风暴专家。数量优先不评判质量，在他人想法基础上延伸，鼓励跨界思维。每个新想法必须有不同出发点。',
  'pro-side': '你是正方辩手。正面论证立场正确，反驳预设化解对方攻击，价值升华证明值得做。使用数据、案例、逻辑进行论证。',
  'con-side': '你是反方辩手。精准打击具体弱点，用即使...也...的结构让步后反击。揭示隐含假设和潜在风险。',
  'judge': '你是裁判。从论证质量、创新性、表达清晰度、回应能力、建设性五维度评分。给出公正评判和详细理由。',
  'neutral': '你是一位中立分析者。去情绪化只看事实和逻辑，多视角权衡各方合理性。先肯定合理之处，再指出盲区，最后给出平衡的综合判断。',
  'expert-tech': '你是一位技术专家。从架构设计、技术选型、性能优化、安全防护、技术趋势角度深度分析。',
  'expert-business': '你是一位商业专家。从市场分析、商业模式、竞争策略、财务规划角度提供专业洞察。',
  'expert-risk': '你是一位风险评估专家。识别各类潜在风险（技术、商业、运营、法律），评估发生概率和影响程度，提供应对策略。',
};

const DEPTH_CONFIG = {
  brief: { min: 150, max: 500, name: '简短讨论' },
  normal: { min: 500, max: 1000, name: '深入讨论' },
  detailed: { min: 1000, max: 2000, name: '详细研究' },
};

/**
 * 构建角色系统提示词
 */
function buildRoleSystemPrompt(roleType, roleName, topic) {
  const soul = ROLE_SOULS[roleType] || `你是一位${getRoleDisplayName(roleType)}，请积极参与讨论并贡献你的观点。`;
  const displayName = getRoleDisplayName(roleType);

  return `${soul}

【当前讨论】
主题: ${topic}
你的角色: ${displayName} (${roleName})

【核心纪律】
- 绝对不要重复之前已经表达过的观点
- 每一轮发言都要比前一轮更深入、更新颖
- 不要说"正如我之前提到的"

【发言要求】
- 保持角色一致性，不要脱离人设
- 有理有据，可以举例或引用数据
- 语言专业、有逻辑
- 不要说"我是AI"或"作为语言模型"之类的话
- 完全沉浸在角色中`;
}

/**
 * 构建角色上下文提示词（用于非首轮发言）
 */
function buildRoleContextPrompt(messages, currentRoleType) {
  if (!messages || messages.length === 0) return '';

  let context = '【讨论进展】\n';

  const relevantMessages = messages.slice(-8);
  relevantMessages.forEach((msg, idx) => {
    if (msg.roleName && msg.content) {
      const isCurrentRole = msg.roleType === currentRoleType;
      const prefix = isCurrentRole ? '(你的上轮发言)' : `[${msg.roleName}]`;
      const preview = msg.content.substring(0, 150);
      context += `${idx + 1}. ${prefix}: ${preview}${msg.content.length > 150 ? '...' : ''}\n`;
    }
  });

  return context;
}

/**
 * POST /api/debate/generate
 * 为指定角色生成辩论回复
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      topic,
      roleType,
      roleName,
      soul,
      action,
      actionLabel,
      actionDescription,
      messages,
      outputDepth,
      roundNumber,
    } = req.body;

    if (!topic || !roleType || !roleName) {
      return res.status(400).json({ success: false, message: '缺少必要参数(topic/roleType/roleName)' });
    }

    const depth = DEPTH_CONFIG[outputDepth] || DEPTH_CONFIG.normal;
    const roleSoul = soul || ROLE_SOULS[roleType] || `你是一位${getRoleDisplayName(roleType)}`;

    let systemPrompt = '';

    if (action) {
      systemPrompt = `═══════════════════════════════════════
【${getRoleDisplayName(roleType)}任务 - ${actionLabel || action}】
═══════════════════════════════════════

${roleSoul}

【当前讨论】
主题: ${topic}
你的角色: ${getRoleDisplayName(roleType)} (${roleName})
当前轮次: 第 ${roundNumber || 1} 轮

【当前任务】
${actionLabel ? '动作: ' + actionLabel : ''}
${actionDescription ? '描述: ' + actionDescription : ''}
${action ? '任务类型: ' + action : ''}

${buildRoleContextPrompt(messages, roleType)}

【发言要求】
- 控制字数在 ${depth.min}-${depth.max} 字以内
- 不要重复别人已经说过的观点
- 保持角色一致性
- 不要说"我是AI"之类的话

【输出前检查】
□ 字数在 ${depth.min}-${depth.max} 之间？
□ 是否完成了任务目标？
□ 是否提出了新观点而非重复？`;
    } else {
      systemPrompt = buildRoleSystemPrompt(roleType, roleName, topic);

      if (messages && messages.length > 0) {
        systemPrompt += '\n\n' + buildRoleContextPrompt(messages, roleType);
      }

      systemPrompt += `\n\n【回复要求】控制字数在 ${depth.min}-${depth.max} 字以内。`;
    }

    const userPrompt = `请作为${getRoleDisplayName(roleType)} (${roleName})，${actionDescription ? actionDescription : `就"${topic}"话题发表你的观点。`}`;

    const response = await aiService.chat(systemPrompt, {
      role: roleType,
      personality: roleSoul.substring(0, 100),
      style: '专业、有逻辑、有说服力',
      history: messages && messages.length > 0
        ? messages.slice(-6).map(m => ({
            role: 'user',
            content: `[${m.roleName || m.role}]: ${m.content.substring(0, 200)}`
          }))
        : [],
      maxTokens: depth.max,
    });

    res.json({
      success: true,
      data: {
        content: response,
        roleType,
        roleName,
        action,
        round: roundNumber,
      }
    });

  } catch (error) {
    console.error('[DebateGeneration] API调用失败:', error.message);
    res.status(500).json({
      success: false,
      message: 'AI回复生成失败: ' + error.message
    });
  }
});

/**
 * POST /api/debate/generate-batch
 * 批量生成多角色的辩论回复
 */
router.post('/generate-batch', async (req, res) => {
  try {
    const { topic, roles, messages, outputDepth } = req.body;

    if (!topic || !roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ success: false, message: '缺少必要参数(topic/roles)' });
    }

    const results = [];

    for (const role of roles) {
      const { roleType, roleName, soul, action, actionLabel, actionDescription } = role;

      const systemPrompt = `═══════════════════════════════════════
【${getRoleDisplayName(roleType)}任务 - ${actionLabel || action || '发言'}】
═══════════════════════════════════════

${soul || ROLE_SOULS[roleType] || `你是一位${getRoleDisplayName(roleType)}`}

【当前讨论】
主题: ${topic}
你的角色: ${getRoleDisplayName(roleType)} (${roleName})

${buildRoleContextPrompt(messages, roleType)}

【发言要求】
控制适当长度，保持简洁且有深度。不要重复已有观点，提出新角度。`;

      try {
        const response = await aiService.chat(systemPrompt, {
          role: roleType,
          personality: (soul || ROLE_SOULS[roleType] || '').substring(0, 100),
          style: '专业、有逻辑',
          history: messages && messages.length > 0
            ? messages.slice(-4).map(m => ({
                role: 'user',
                content: `[${m.roleName || m.role}]: ${m.content.substring(0, 100)}`
              }))
            : [],
        });

        results.push({
          roleType,
          roleName,
          content: response,
          success: true,
        });
      } catch (error) {
        results.push({
          roleType,
          roleName,
          content: `（${getRoleDisplayName(roleType)}暂时无法发言）`,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      data: { results },
    });

  } catch (error) {
    console.error('[DebateGeneration] 批量生成失败:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;