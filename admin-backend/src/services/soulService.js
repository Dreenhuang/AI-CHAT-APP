/**
 * Soul角色管理服务层 (Soul Service)
 *
 * 功能说明：
 * 实现辩论AI角色的全生命周期管理，包括：
 * - S001: Soul角色列表查询（分页、筛选、排序）
 * - S002: Soul角色详情查看（含完整配置和历史统计）
 * - S003: 创建/编辑Soul角色
 * - S004: 修改角色状态（激活/停用）
 * - S005: 调整AI参数配置
 *
 * 技术架构：
 * - 服务层模式：封装所有业务逻辑，控制器只负责请求/响应
 * - 模拟数据存储：开发阶段使用内存数据，生产环境替换为数据库
 * - 审计日志：所有写操作自动记录变更历史
 * - AI参数校验：严格的范围验证确保参数安全
 *
 * 数据来源：
 * 开发阶段使用内存模拟数据（mockSouls数组），包含预设的哲学家、企业家、科学家等角色
 */

import { randomUUID } from 'crypto';

// ============================================
// 类型定义 (JSDoc Type Definitions)
// ============================================

/**
 * Soul角色状态枚举
 * - active: 已激活（可选列表中可见）
 * - inactive: 已停用（隐藏但保留数据和配置）
 */
export const SOUL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

/**
 * 支持的AI模型枚举
 */
export const AI_MODELS = {
  MINIMAX: 'minimax',
  DEEPSEEK: 'deepseek',
  GPT: 'gpt',
  CLAUDE: 'claude'
};

/**
 * Soul角色分类枚举
 */
export const SOUL_CATEGORIES = {
  PHILOSOPHER: '哲学家',
  ENTREPRENEUR: '企业家',
  SCIENTIST: '科学家',
  ARTIST: '艺术家',
  HISTORIAN: '历史学家',
  POLITICIAN: '政治家',
  TEACHER: '教育家',
  WRITER: '作家',
  CUSTOM: '自定义角色'
};

/**
 * @typedef {Object} SoulItem
 * @property {string} id - UUID主键
 * @property {string} name - 角色名称（如"苏格拉底"、"乔布斯"）
 * @property {string} [avatar] - 角色头像URL
 * @property {string} category - 分类（哲学家/企业家/科学家等）
 * @property {string} description - 角色简介
 * @property {'active'|'inactive'} status - 激活状态
 * @property {Object} aiConfig - AI配置对象
 * @property {string} aiConfig.model - 使用的AI模型
 * @property {string} aiConfig.systemPrompt - 系统提示词（人设）
 * @property {number} aiConfig.temperature - 温度参数 0-1
 * @property {number} aiConfig.maxTokens - 最大生成长度
 * @property {string} aiConfig.personality - 性格特征描述
 * @property {Object} usageStats - 使用统计
 * @property {number} usageStats.totalDebates - 参与辩论总数
 * @property {number} usageStats.avgRating - 平均评分 1-5
 * @property {number} usageStats.favoriteCount - 被收藏次数
 * @property {boolean} isPreset - 是否为系统预设角色
 * @property {string} [createdBy] - 创建者ID
 * @property {string} [createdByName] - 创建者名称
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} SoulListParams
 * @property {number} page - 页码
 * @property {number} pageSize - 每页条数
 * @property {string} [status] - 状态筛选: active/inactive/all
 * @property {string} [category] - 分类筛选
 * @property {string} [search] - 搜索关键词（名称/描述）
 * @property {string} [sortBy] - 排序字段: name/createdAt/totalDebates/avgRating
 * @property {string} [order] - 排序方向: asc/desc
 */

/**
 * @typedef {Object} SoulListResponse
 * @property {SoulItem[]} souls - 角色数组
 * @property {Object} summary - 统计摘要
 * @property {PaginationInfo} pagination - 分页信息
 */

/**
 * @typedef {Object} PaginationInfo
 * @property {number} page - 当前页码
 * @property {number} pageSize - 每页条数
 * @property {number} totalItems - 总条目数
 * @property {number} totalPages - 总页数
 * @property {boolean} hasNextPage - 是否有下一页
 * @property {boolean} hasPrevPage - 是否有上一页
 */

/**
 * @typedef {Object} SoulDetailResponse
 * @extends SoulItem
 * @property {Array} debateHistory - 历史辩论表现记录
 * @property {Array} feedbackSummary - 用户反馈摘要
 * @property {Array} configChangeHistory - 配置变更历史
 */

// ============================================
// 模拟数据存储 (开发环境使用)
// ============================================

/**
 * 模拟Soul角色数据
 * 生产环境中应从数据库读取，这里仅作演示和测试用
 *
 * 设计说明：
 * - 包含多种类型的知名人物角色，覆盖不同领域
 * - 每个角色都有完整的AI配置和使用统计
 * - 包含预设角色(isPreset=true)和自定义角色(isPreset=false)
 * - 数据量足够验证分页、筛选、排序等功能
 */
let mockSouls = [
  {
    id: 'soul_001',
    name: '苏格拉底',
    avatar: 'https://example.com/avatars/socrates.jpg',
    category: SOUL_CATEGORIES.PHILOSOPHER,
    description: '古希腊哲学家，以提问法和辩证法闻名，擅长通过追问引导对方思考问题的本质。',
    status: SOUL_STATUS.ACTIVE,
    aiConfig: {
      model: AI_MODELS.MINIMAX,
      systemPrompt: `你是一位经验丰富的古希腊哲学家苏格拉底。你的核心特征：

1. **精神助产术**：你从不直接给出答案，而是通过精心设计的问题引导对方自己发现真理。
2. **无知之知**：你承认自己的无知，认为真正的智慧始于认识到自己的无知。
3. **辩证思维**：你擅长通过对话揭示矛盾，在争论中接近真相。
4. **道德关怀**：你的所有探讨都围绕"如何过上善的生活"这一核心问题。

你的说话风格：
- 经常说："请告诉我，XX是什么？"
- 当对方给出定义时，你会追问："如果XX是这样，那YY算不算XX呢？"
- 你会温和地指出对方论证中的矛盾
- 你的语气谦逊但充满智慧
- 你喜欢用日常生活中的例子来说明哲学概念`,
      temperature: 0.7,
      maxTokens: 1500,
      personality: '智慧、谦逊、好奇、善于追问、道德导向'
    },
    usageStats: {
      totalDebates: 342,
      avgRating: 4.6,
      favoriteCount: 189
    },
    isPreset: true,
    createdBy: 'system',
    createdByName: '系统预设',
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-05-12T15:30:00.000Z'
  },
  {
    id: 'soul_002',
    name: '史蒂夫·乔布斯',
    avatar: 'https://example.com/avatars/jobs.jpg',
    category: SOUL_CATEGORIES.ENTREPRENEUR,
    description: '苹果公司联合创始人，以极致的产品追求、现实扭曲场和创新视野著称。',
    status: SOUL_STATUS.ACTIVE,
    aiConfig: {
      model: AI_MODELS.DEEPSEEK,
      systemPrompt: `你是苹果公司联合创始人史蒂夫·乔布斯。你的核心特征：

1. **极致完美主义**：你对产品细节有着近乎偏执的追求，"细节就是细节，但它能成就卓越"。
2. **现实扭曲场**：你能够用强大的说服力和愿景感染周围的人，让他们相信不可能的事情。
3. **直觉决策**：你相信直觉胜过市场调研，"消费者不知道自己想要什么，直到你展示给他们看"。
4. **跨界思维**：你将科技与人文艺术完美结合，"站在科技与人文的十字路口"。

你的说话风格：
- 直接、有时甚至尖锐，但总是充满激情
- 经常用"这太糟糕了"或"这是我最喜欢的"这样极端的表达
- 喜欢用"我们正在重新定义..."这样的表述
- 强调简洁："简单是终极的复杂"
- 会讲述改变世界的故事来激励他人`,
      temperature: 0.8,
      maxTokens: 1200,
      personality: '激情、完美主义、有远见、直接、反传统'
    },
    usageStats: {
      totalDebates: 278,
      avgRating: 4.4,
      favoriteCount: 156
    },
    isPreset: true,
    createdBy: 'system',
    createdByName: '系统预设',
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-05-11T10:20:00.000Z'
  },
  {
    id: 'soul_003',
    name: '爱因斯坦',
    avatar: 'https://example.com/avatars/einstein.jpg',
    category: SOUL_CATEGORIES.SCIENTIST,
    description: '理论物理学家，相对论创立者，以天才的想象力和深刻的科学洞察力闻名于世。',
    status: SOUL_STATUS.ACTIVE,
    aiConfig: {
      model: AI_MODELS.GPT,
      systemPrompt: `你是阿尔伯特·爱因斯坦，20世纪最伟大的物理学家之一。你的核心特征：

1. **思想实验**：你喜欢用想象的场景来探索物理定律的本质，比如"如果以光速旅行会怎样？"
2. **直觉与数学结合**：你相信直觉指引方向，数学证明结论，"想象力比知识更重要"。
3. **好奇心驱动**：你保持着孩童般的好奇心，对宇宙奥秘充满敬畏。
4. **幽默与谦逊**：尽管成就非凡，你保持幽默感和谦逊态度。

你的说话风格：
- 喜欢用简单的例子解释复杂的概念
- 经常说"让我想想..."然后进行深入思考
- 会用"想象一下..."开头来引入思想实验
- 对未知保持开放态度："上帝不掷骰子"但也承认量子力学的奇妙
- 语言生动形象，善于比喻`,
      temperature: 0.6,
      maxTokens: 1800,
      personality: '好奇、深刻、富有想象力、幽默、谦逊'
    },
    usageStats: {
      totalDebates: 256,
      avgRating: 4.7,
      favoriteCount: 203
    },
    isPreset: true,
    createdBy: 'system',
    createdByName: '系统预设',
    createdAt: '2026-04-02T09:00:00.000Z',
    updatedAt: '2026-05-13T08:45:00.000Z'
  },
  {
    id: 'soul_004',
    name: '达·芬奇',
    avatar: 'https://example.com/avatars/davinci.jpg',
    category: SOUL_CATEGORIES.ARTIST,
    description: '文艺复兴时期的博学者，画家、发明家、科学家，代表作品《蒙娜丽莎》、《最后的晚餐》。',
    status: SOUL_STATUS.ACTIVE,
    aiConfig: {
      model: AI_MODELS.CLAUDE,
      systemPrompt: `你是列奥纳多·达·芬奇，文艺复兴时期最伟大的博学者。你的核心特征：

1. **跨学科思维**：你不受学科边界限制，艺术、科学、工程在你手中融为一体。
2. **观察入微**：你对自然界有着超乎寻常的观察力，从鸟类飞行到水流漩涡。
3. **永不满足的好奇心**：你对一切未知都充满渴望，笔记本上写满了问题和草图。
4. **完美主义**：你对作品精益求精，《蒙娜丽莎》画了数年仍不断修改。

你的说话风格：
- 经常从多个角度分析问题（艺术、科学、工程视角）
- 喜欢说："让我观察一下..."然后详细描述看到的现象
- 会引用自然界的规律来解释人类创造
- 对未完成的工作充满热情和计划
- 语言优雅而富有诗意，融合理性与感性`,
      temperature: 0.75,
      maxTokens: 1600,
      personality: '博学、好奇、观察敏锐、完美主义、诗意'
    },
    usageStats: {
      totalDebates: 198,
      avgRating: 4.5,
      favoriteCount: 134
    },
    isPreset: true,
    createdBy: 'system',
    createdByName: '系统预设',
    createdAt: '2026-04-03T10:00:00.000Z',
    updatedAt: '2026-05-10T14:15:00.000Z'
  },
  {
    id: 'soul_005',
    name: '孔子',
    avatar: 'https://example.com/avatars/confucius.jpg',
    category: SOUL_CATEGORIES.TEACHER,
    description: '中国古代思想家、教育家，儒家学派创始人，强调仁、义、礼、智、信等美德。',
    status: SOUL_STATUS.ACTIVE,
    aiConfig: {
      model: AI_MODELS.MINIMAX,
      systemPrompt: `你是孔子（孔丘），中国古代最伟大的思想家和教育家。你的核心特征：

1. **仁爱为本**：你认为"仁"是人最高的道德品质，"己所不欲，勿施于人"。
2. **重视教育**：你主张"有教无类"，认为教育可以改变人、完善社会。
3. **礼制秩序**：你强调"礼"对社会和谐的重要性，但反对形式主义的虚礼。
4. **因材施教**：你根据学生的不同特点采用不同的教学方法。

你的说话风格：
- 经常引用古代经典和历史故事
- 喜欢用"君子..."和"小人..."的对比来说明道理
- 会问学生："你以为如何？"鼓励独立思考
- 语言典雅但不晦涩，善于用生活实例说明大道理
- 保持长者的威严但充满慈爱`,
      temperature: 0.65,
      maxTokens: 1400,
      personality: '仁慈、睿智、守礼、因材施教、威严而慈祥'
    },
    usageStats: {
      totalDebates: 312,
      avgRating: 4.8,
      favoriteCount: 267
    },
    isPreset: true,
    createdBy: 'system',
    createdByName: '系统预设',
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-05-12T16:00:00.000Z'
  },
  {
    id: 'soul_006',
    name: '埃隆·马斯克',
    avatar: 'https://example.com/avatars/musk.jpg',
    category: SOUL_CATEGORIES.ENTREPRENEUR,
    description: '特斯拉、SpaceX CEO，以颠覆性创新、第一性原理思考和火星殖民愿景著称。',
    status: SOUL_STATUS.ACTIVE,
    aiConfig: {
      model: AI_MODELS.DEEPSEEK,
      systemPrompt: `你是埃隆·马斯克，当代最具影响力的企业家和创新者。你的核心特征：

1. **第一性原理**：你习惯将问题分解到最基本的物理事实，然后从头推理解决方案。
2. **极限思维**：你喜欢设定看似不可能的目标，然后用工程方法去实现它们。
3. **多任务并行**：你同时管理多家公司，涉及电动车、航天、脑机接口、社交媒体等领域。
4. **风险承担**：你愿意押上全部身家去追求看似疯狂的梦想。

你的说话风格：
- 非常直接，经常在推特上发表即兴想法
- 喜欢用数字和数据说话
- 经常说"实际上..."来纠正别人的误解
- 对未来技术发展有强烈观点
- 有时会说出令人惊讶的大胆预测`,
      temperature: 0.85,
      maxTokens: 1300,
      personality: '大胆、直接、工程师思维、未来导向、不按常理出牌'
    },
    usageStats: {
      totalDebates: 234,
      avgRating: 4.3,
      favoriteCount: 178
    },
    isPreset: true,
    createdBy: 'system',
    createdByName: '系统预设',
    createdAt: '2026-04-05T11:00:00.000Z',
    updatedAt: '2026-05-11T09:30:00.000Z'
  },
  {
    id: 'soul_007',
    name: '玛丽·居里',
    avatar: 'https://example.com/avatars/curie.jpg',
    category: SOUL_CATEGORIES.SCIENTIST,
    description: '物理学家、化学家，放射性研究的先驱，唯一一位在两个不同科学领域获得诺贝尔奖的人。',
    status: SOUL_STATUS.INACTIVE,
    aiConfig: {
      model: AI_MODELS.GPT,
      systemPrompt: `你是玛丽·居里，历史上最杰出的女科学家之一。你的核心特征：

1. **坚韧不拔**：你在极其艰苦的条件下坚持研究，面对性别歧视从未放弃。
2. **严谨求实**：你的实验记录精确到每一个细节，对数据一丝不苟。
3. **无私奉献**：你将镭的提取方法公之于众，未申请专利，希望造福人类。
4. **热爱工作**：你说"我的生活中只有工作"，科学是你的生命。

你的说话风格：
- 谦逊低调，不喜欢张扬
- 用精确的语言描述实验过程和结果
- 强调科学发现的艰辛和喜悦
- 对年轻科学家充满鼓励
- 带着波兰口音的法语表达方式`,
      temperature: 0.55,
      maxTokens: 1400,
      personality: '坚韧、严谨、谦逊、无私、专注'
    },
    usageStats: {
      totalDebates: 145,
      avgRating: 4.6,
      favoriteCount: 112
    },
    isPreset: true,
    createdBy: 'system',
    createdByName: '系统预设',
    createdAt: '2026-04-06T14:00:00.000Z',
    updatedAt: '2026-05-08T11:20:00.000Z'
  },
  {
    id: 'soul_008',
    name: '鲁迅',
    avatar: 'https://example.com/avatars/luxun.jpg',
    category: SOUL_CATEGORIES.WRITER,
    description: '中国现代文学的奠基人，以犀利的杂文和深刻的社会批判著称，代表作《狂人日记》、《阿Q正传》。',
    status: SOUL_STATUS.ACTIVE,
    aiConfig: {
      model: AI_MODELS.CLAUDE,
      systemPrompt: `你是鲁迅（周树人），中国现代文学之父，思想家、革命家。你的核心特征：

1. **犀利批判**：你用笔作为武器，无情揭露社会的黑暗和国民的劣根性。
2. **忧国忧民**：你深爱着这个国家，所以才会如此痛心疾首地批评它。
3. **直面现实**：你拒绝逃避，坚持"真的猛士，敢于直面惨淡的人生"。
4. **启蒙使命**：你写作的目的在于唤醒民众，改造国民性。

你的说话风格：
- 语言犀利如匕首，一针见血
- 喜欢用反讽和黑色幽默
- 经典句式："我向来是不惮以最坏的恶意，来推测中国人的..."
- 对青年人寄予厚望，对旧势力毫不妥协
- 杂文式的跳跃思维，旁征博引`,
      temperature: 0.9,
      maxTokens: 1500,
      personality: '犀利、批判、忧愤、深刻、不屈'
    },
    usageStats: {
      totalDebates: 289,
      avgRating: 4.5,
      favoriteCount: 198
    },
    isPreset: true,
    createdBy: 'system',
    createdByName: '系统预设',
    createdAt: '2026-04-07T09:00:00.000Z',
    updatedAt: '2026-05-12T13:45:00.000Z'
  }
];

// ============================================
// 审计日志存储
// ============================================

const soulAuditLogs = [];

/**
 * 记录Soul操作审计日志
 *
 * @param {Object} logInfo - 日志信息
 * @param {string} logInfo.action - 操作类型
 * @param {string} logInfo.operator - 操作人
 * @param {string} logInfo.targetId - 目标对象ID
 * @param {Object} logInfo.oldData - 操作前数据
 * @param {Object} logInfo.newData - 操作后数据
 * @param {string} logInfo.ip - 操作IP
 * @param {string} logInfo.reason - 操作原因
 */
function recordSoulAuditLog(logInfo) {
  const logEntry = {
    ...logInfo,
    timestamp: new Date().toISOString(),
    logId: `soul_audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  soulAuditLogs.push(logEntry);

  // 只保留最近2000条日志
  if (soulAuditLogs.length > 2000) {
    soulAuditLogs.shift();
  }

  console.log(
    `[SoulAudit] ${logEntry.action} | ` +
    `操作人: ${logEntry.operator} | ` +
    `目标: ${logEntry.targetId} | ` +
    (logEntry.reason ? `原因: ${logEntry.reason}` : '')
  );
}

// ============================================
// 辅助工具函数
// ============================================

/**
 * 验证角色名称格式
 *
 * @param {string} name - 待验证的名称
 * @returns {{ valid: boolean, message: string }}
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: '角色名称不能为空' };
  }

  if (name.trim().length < 2) {
    return { valid: false, message: '角色名称长度不能少于2个字符' };
  }

  if (name.trim().length > 50) {
    return { valid: false, message: '角色名称长度不能超过50个字符' };
  }

  return { valid: true, message: '角色名称格式正确' };
}

/**
 * 验证分类值
 *
 * @param {string} category - 分类值
 * @returns {{ valid: boolean, message: string }}
 */
function validateCategory(category) {
  const validCategories = Object.values(SOUL_CATEGORIES);

  if (!category || typeof category !== 'string') {
    return { valid: false, message: '分类为必填字段' };
  }

  if (!validCategories.includes(category)) {
    return {
      valid: false,
      message: `无效的分类值，必须是以下之一: ${validCategories.join(', ')}`
    };
  }

  return { valid: true, message: '分类值有效' };
}

/**
 * 验证状态值
 *
 * @param {string} status - 状态值
 * @returns {{ valid: boolean, message: string }}
 */
function validateStatus(status) {
  const validStatuses = [SOUL_STATUS.ACTIVE, SOUL_STATUS.INACTIVE];

  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      message: `无效的状态值，必须是以下之一: ${validStatuses.join(', ')}`
    };
  }

  return { valid: true, message: '状态值有效' };
}

/**
 * 验证AI模型值
 *
 * @param {string} model - 模型标识
 * @returns {{ valid: boolean, message: string }}
 */
function validateModel(model) {
  const validModels = Object.values(AI_MODELS);

  if (!validModels.includes(model)) {
    return {
      valid: false,
      message: `无效的AI模型，必须是以下之一: ${validModels.join(', ')}`
    };
  }

  return { valid: true, message: '模型值有效' };
}

/**
 * 验证温度参数范围
 *
 * @param {number} temperature - 温度值
 * @returns {{ valid: boolean, message: string }}
 */
function validateTemperature(temperature) {
  if (typeof temperature !== 'number' || isNaN(temperature)) {
    return { valid: false, message: '温度参数必须是数字' };
  }

  if (temperature < 0 || temperature > 1) {
    return { valid: false, message: '温度参数必须在0-1之间' };
  }

  return { valid: true, message: '温度参数有效' };
}

/**
 * 验证最大Token数范围
 *
 * @param {number} maxTokens - 最大Token数
 * @returns {{ valid: boolean, message: string }}
 */
function validateMaxTokens(maxTokens) {
  if (typeof maxTokens !== 'number' || isNaN(maxTokens)) {
    return { valid: false, message: '最大Token数必须是数字' };
  }

  if (maxTokens < 100 || maxTokens > 4000) {
    return { valid: false, message: '最大Token数必须在100-4000之间' };
  }

  return { valid: true, message: '最大Token数有效' };
}

/**
 * 验证系统提示词长度
 *
 * @param {string} systemPrompt - 系统提示词
 * @returns {{ valid: boolean, message: string }}
 */
function validateSystemPrompt(systemPrompt) {
  if (systemPrompt === undefined || systemPrompt === null) {
    return { valid: true, message: '系统提示词为可选字段' };  // 可选字段
  }

  if (typeof systemPrompt !== 'string') {
    return { valid: false, message: '系统提示词必须是文本类型' };
  }

  if (systemPrompt.length > 2000) {
    return { valid: false, message: '系统提示词长度不能超过2000个字符' };
  }

  return { valid: true, message: '系统提示词格式正确' };
}

/**
 * 验证描述文本
 *
 * @param {string} description - 描述文本
 * @returns {{ valid: boolean, message: string }}
 */
function validateDescription(description) {
  if (description === undefined || description === null) {
    return { valid: true, message: '描述为可选字段' };  // 可选字段
  }

  if (typeof description !== 'string') {
    return { valid: false, message: '描述必须是文本类型' };
  }

  if (description.length > 500) {
    return { valid: false, message: '描述长度不能超过500个字符' };
  }

  return { valid: true, message: '描述格式正确' };
}

// ============================================
// 核心业务逻辑函数
// ============================================

/**
 * S001: 获取Soul角色列表（分页查询）
 *
 * 功能说明：
 * 支持多维度筛选和排序的分页列表查询
 * 返回角色数据 + 统计摘要 + 分页信息
 *
 * @param {SoulListParams} params - 查询参数
 * @returns {Promise<SoulListResponse>} 列表响应数据
 *
 * 查询参数说明：
 * - page: 页码（默认1）
 * - pageSize: 每页条数（默认20，最大100）
 * - status: 状态筛选（active/inactive/all，默认all）
 * - category: 分类筛选
 * - search: 关键词搜索（匹配名称和描述）
 * - sortBy: 排序字段（name/createdAt/totalDebates/avgRating）
 * - order: 排序方向（asc/desc，默认desc）
 *
 * 示例调用：
 * ```javascript
 * // 获取已激活的角色，按平均评分降序排列
 * await getSouls({ status: 'active', sortBy: 'avgRating', order: 'desc' })
 *
 * // 搜索包含"哲学"的角色
 * await getSouls({ search: '哲学', page: 1, pageSize: 10 })
 * ```
 */
export async function getSouls(params) {
  try {
    // ========== 参数默认值处理 ==========
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const status = params.status || 'all';
    const sortBy = params.sortBy || 'createdAt';
    const order = params.order === 'asc' ? 'asc' : 'desc';

    console.log(
      `[SoulService] 查询Soul角色列表 | 页码: ${page} | 每页: ${pageSize} | ` +
      `状态: ${status} | 排序: ${sortBy} ${order}`
    );

    // ========== 第一步：应用筛选条件 ==========
    let filteredSouls = [...mockSouls];

    // 1. 状态筛选
    if (status !== 'all') {
      filteredSouls = filteredSouls.filter(s => s.status === status);
    }

    // 2. 分类筛选
    if (params.category) {
      filteredSouls = filteredSouls.filter(s =>
        s.category?.toLowerCase() === params.category.toLowerCase()
      );
    }

    // 3. 关键词搜索（匹配名称和描述）
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim().toLowerCase();
      filteredSouls = filteredSouls.filter(s =>
        s.name.toLowerCase().includes(searchTerm) ||
        (s.description && s.description.toLowerCase().includes(searchTerm))
      );
    }

    // ========== 第二步：排序 ==========
    filteredSouls.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'totalDebates':
          comparison = a.usageStats.totalDebates - b.usageStats.totalDebates;
          break;
        case 'avgRating':
          comparison = a.usageStats.avgRating - b.usageStats.avgRating;
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    // ========== 第三步：计算分页信息 ==========
    const totalItems = filteredSouls.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSouls = filteredSouls.slice(startIndex, endIndex);

    // ========== 第四步：计算统计摘要 ==========
    const allActive = mockSouls.filter(s => s.status === SOUL_STATUS.ACTIVE);
    const allInactive = mockSouls.filter(s => s.status === SOUL_STATUS.INACTIVE);
    const allPreset = mockSouls.filter(s => s.isPreset === true);
    const allCustom = mockSouls.filter(s => s.isPreset === false);

    // 平均评分（仅计算已激活的角色）
    const avgRating = allActive.length > 0
      ? allActive.reduce((sum, s) => sum + s.usageStats.avgRating, 0) / allActive.length
      : 0;

    // 总辩论次数
    const totalDebatesAll = mockSouls.reduce((sum, s) => sum + s.usageStats.totalDebates, 0);

    // 找出最受欢迎的角色（收藏数最多）
    const mostPopular = allActive.length > 0
      ? allActive.reduce((max, s) => s.usageStats.favoriteCount > max.usageStats.favoriteCount ? s : max)
      : null;

    const summary = {
      totalActive: allActive.length,
      totalInactive: allInactive.length,
      totalPreset: allPreset.length,
      totalCustom: allCustom.length,
      avgRating: Math.round(avgRating * 10) / 10,  // 保留一位小数
      totalDebates: totalDebatesAll,
      mostPopular: mostPopular ? {
        id: mostPopular.id,
        name: mostPopular.name,
        favoriteCount: mostPopular.usageStats.favoriteCount
      } : null
    };

    // ========== 第五步：组装返回结果 ==========
    const result = {
      souls: paginatedSouls,
      summary,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    console.log(
      `[SoulService] 查询完成 | 返回 ${paginatedSouls.length} 条 | 共 ${totalItems} 条`
    );

    return result;

  } catch (error) {
    console.error('[SoulService] 查询Soul角色列表异常:', error);
    throw error;
  }
}

/**
 * S002: 获取Soul角色详情
 *
 * 功能说明：
 * 返回角色的完整信息，包括：
 * - 基本信息和AI配置
 * - 历史辩论表现统计
 * - 用户反馈摘要
 * - 配置变更历史
 *
 * @param {string} soulId - 角色ID
 * @returns {Promise<SoulDetailResponse>} 角色详情
 */
export async function getSoulById(soulId) {
  try {
    console.log(`[SoulService] 查询Soul角色详情 | ID: ${soulId}`);

    // ========== 第一步：查找角色 ==========
    const soul = mockSouls.find(s => s.id === soulId);

    if (!soul) {
      const error = new Error('Soul角色不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    // ========== 第二步：生成历史辩论表现记录（模拟数据）==========
    const debateHistory = generateMockDebateHistory(soulId, 10);

    // ========== 第三步：生成用户反馈摘要 ==========
    const feedbackSummary = generateMockFeedbackSummary(soul);

    // ========== 第四步：获取配置变更历史 ==========
    const configChangeHistory = soulAuditLogs
      .filter(log => log.targetId === soulId && ['CREATE', 'UPDATE', 'STATUS_CHANGE', 'AI_CONFIG_CHANGE'].includes(log.action))
      .slice(-15)  // 最近15条
      .map(log => ({
        action: log.action,
        operator: log.operator,
        timestamp: log.timestamp,
        changes: {
          ...(log.oldData && { before: log.oldData }),
          ...(log.newData && { after: log.newData }),
          reason: log.reason
        }
      }));

    // ========== 第五步：组装详情响应 ==========
    const detailResponse = {
      ...soul,
      debateHistory,
      feedbackSummary,
      configChangeHistory
    };

    console.log(`[SoulService] Soul角色详情查询成功 | 名称: ${soul.name}`);

    return detailResponse;

  } catch (error) {
    console.error('[SoulService] 查询Soul角色详情异常:', error);
    throw error;
  }
}

/**
 * S003: 创建新Soul角色
 *
 * 功能说明：
 * 创建一个新的AI辩论角色，自动设置初始状态和默认AI配置
 *
 * @param {Object} data - 角色数据
 * @param {string} data.name - 角色名称（必填，2-50字符）
 * @param {string} data.category - 分类（必填）
 * @param {string} [data.description] - 描述（可选，0-500字符）
 * @param {string} [data.avatar] - 头像URL
 * @param {Object} [data.aiConfig] - AI配置（可选，有默认值）
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 创建后的完整角色对象
 */
export async function createSoul(data, operatorInfo) {
  try {
    const { name, category, description, avatar, aiConfig } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorId = operatorInfo?.admin_id || 'system';

    console.log(`[SoulService] 创建Soul角色 | 操作人: ${operatorName} | 名称: ${name}`);

    // ========== 第一步：参数校验 ==========

    // 1.1 名称验证
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      const error = new Error(nameValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // 1.2 分类验证
    const categoryValidation = validateCategory(category);
    if (!categoryValidation.valid) {
      const error = new Error(categoryValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // 1.3 描述验证
    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      const error = new Error(descValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // 1.4 名称去重检查
    const existingSoul = mockSouls.find(s =>
      s.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (existingSoul) {
      const error = new Error('已存在相同名称的角色');
      error.name = 'DUPLICATE_NAME';
      throw error;
    }

    // 1.5 AI配置校验（如果提供的话）
    if (aiConfig) {
      if (aiConfig.model) {
        const modelValidation = validateModel(aiConfig.model);
        if (!modelValidation.valid) {
          const error = new Error(modelValidation.message);
          error.name = 'VALIDATION_ERROR';
          throw error;
        }
      }

      if (aiConfig.temperature !== undefined) {
        const tempValidation = validateTemperature(aiConfig.temperature);
        if (!tempValidation.valid) {
          const error = new Error(tempValidation.message);
          error.name = 'VALIDATION_ERROR';
          throw error;
        }
      }

      if (aiConfig.maxTokens !== undefined) {
        const tokensValidation = validateMaxTokens(aiConfig.maxTokens);
        if (!tokensValidation.valid) {
          const error = new Error(tokensValidation.message);
          error.name = 'VALIDATION_ERROR';
          throw error;
        }
      }

      if (aiConfig.systemPrompt !== undefined) {
        const promptValidation = validateSystemPrompt(aiConfig.systemPrompt);
        if (!promptValidation.valid) {
          const error = new Error(promptValidation.message);
          error.name = 'VALIDATION_ERROR';
          throw error;
        }
      }
    }

    // ========== 第二步：创建角色对象 ==========
    const now = new Date().toISOString();
    const newSoul = {
      id: `soul_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      avatar: avatar?.trim() || undefined,
      category,
      description: description?.trim() || undefined,
      status: SOUL_STATUS.ACTIVE,  // 新建角色默认为激活状态
      aiConfig: {
        model: aiConfig?.model || AI_MODELS.MINIMAX,
        systemPrompt: aiConfig?.systemPrompt || `你是一个名为"${name}"的AI辩论角色。请根据你的性格特点参与讨论，展现独特的观点和思维方式。`,
        temperature: aiConfig?.temperature ?? 0.7,
        maxTokens: aiConfig?.maxTokens ?? 1500,
        personality: aiConfig?.personality || '待补充性格特征'
      },
      usageStats: {
        totalDebates: 0,
        avgRating: 0,
        favoriteCount: 0
      },
      isPreset: false,  // 手动创建的角色不是预设角色
      createdBy: String(operatorId),
      createdByName: operatorName,
      createdAt: now,
      updatedAt: now
    };

    // ========== 第三步：保存到存储 ==========
    mockSouls.unshift(newSoul);  // 新建角色放在最前面

    // ========== 第四步：记录审计日志 ==========
    recordSoulAuditLog({
      action: 'CREATE',
      operator: operatorName,
      targetId: newSoul.id,
      oldData: null,
      newData: {
        id: newSoul.id,
        name: newSoul.name,
        category: newSoul.category,
        status: newSoul.status
      },
      ip: operatorInfo?.ip || 'unknown',
      reason: '创建新Soul角色'
    });

    console.log(`[SoulService] Soul角色创建成功 | ID: ${newSoul.id} | 名称: ${newSoul.name}`);

    return newSoul;

  } catch (error) {
    console.error('[SoulService] 创建Soul角色异常:', error);
    throw error;
  }
}

/**
 * S003 (续): 更新现有Soul角色
 *
 * 功能说明：
 * 更新角色的基本信息和AI配置
 * 注意：admin角色不能删除或修改预设角色的isPreset属性
 *
 * @param {string} soulId - 角色ID
 * @param {Object} data - 更新数据
 * @param {string} [data.name] - 新名称
 * @param {string} [data.description] - 新描述
 * @param {string} [data.category] - 新分类
 * @param {string} [data.avatar] - 新头像URL
 * @param {Object} [data.aiConfig] - 新AI配置（完整替换）
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新后的完整角色对象
 */
export async function updateSoul(soulId, data, operatorInfo) {
  try {
    const { name, description, category, avatar, aiConfig } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(`[SoulService] 更新Soul角色 | ID: ${soulId} | 操作人: ${operatorName}`);

    // ========== 第一步：查找角色 ==========
    const soulIndex = mockSouls.findIndex(s => s.id === soulId);

    if (soulIndex === -1) {
      const error = new Error('Soul角色不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const existingSoul = mockSouls[soulIndex];

    // ========== 第二步：权限检查（预设角色保护）==========
    // admin角色不能修改预设角色的某些关键属性
    if (existingSoul.isPreset && operatorInfo?.role === 'admin') {
      // 允许修改的字段
      const allowedFieldsForAdmin = ['description', 'avatar', 'aiConfig'];
      const requestedFields = Object.keys(data);
      const disallowedFields = requestedFields.filter(f => !allowedFieldsForAdmin.includes(f));

      if (disallowedFields.length > 0) {
        const error = new Error(`管理员无权修改预设角色的以下字段: ${disallowedFields.join(', ')}`);
        error.name = 'PRESET_PROTECTED';
        throw error;
      }
    }

    // ========== 第三步：参数校验 ==========
    if (name !== undefined) {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        const error = new Error(nameValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }

      // 名称去重检查（排除自身）
      const duplicateSoul = mockSouls.find(s =>
        s.id !== soulId &&
        s.name.trim().toLowerCase() === name.trim().toLowerCase()
      );

      if (duplicateSoul) {
        const error = new Error('已存在相同名称的角色');
        error.name = 'DUPLICATE_NAME';
        throw error;
      }
    }

    if (category !== undefined) {
      const categoryValidation = validateCategory(category);
      if (!categoryValidation.valid) {
        const error = new Error(categoryValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }
    }

    if (description !== undefined) {
      const descValidation = validateDescription(description);
      if (!descValidation.valid) {
        const error = new Error(descValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }
    }

    // 如果提供了完整的aiConfig对象，进行全面校验
    if (aiConfig) {
      if (aiConfig.model) {
        const modelValidation = validateModel(aiConfig.model);
        if (!modelValidation.valid) {
          const error = new Error(modelValidation.message);
          error.name = 'VALIDATION_ERROR';
          throw error;
        }
      }

      if (aiConfig.temperature !== undefined) {
        const tempValidation = validateTemperature(aiConfig.temperature);
        if (!tempValidation.valid) {
          const error = new Error(tempValidation.message);
          error.name = 'VALIDATION_ERROR';
          throw error;
        }
      }

      if (aiConfig.maxTokens !== undefined) {
        const tokensValidation = validateMaxTokens(aiConfig.maxTokens);
        if (!tokensValidation.valid) {
          const error = new Error(tokensValidation.message);
          error.name = 'VALIDATION_ERROR';
          throw error;
        }
      }

      if (aiConfig.systemPrompt !== undefined) {
        const promptValidation = validateSystemPrompt(aiConfig.systemPrompt);
        if (!promptValidation.valid) {
          const error = new Error(promptValidation.message);
          error.name = 'VALIDATION_ERROR';
          throw error;
        }
      }
    }

    // ========== 第四步：保存旧数据快照（用于审计日志）==========
    const oldDataSnapshot = { ...existingSoul };

    // ========== 第五步：更新角色数据 ==========
    const updatedSoul = {
      ...existingSoul,
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || undefined }),
      ...(category !== undefined && { category }),
      ...(avatar !== undefined && { avatar: avatar?.trim() || undefined }),
      ...(aiConfig && { aiConfig: { ...existingSoul.aiConfig, ...aiConfig } }),  // 合并AI配置
      updatedAt: new Date().toISOString()
    };

    // 更新存储
    mockSouls[soulIndex] = updatedSoul;

    // ========== 第六步：记录审计日志 ==========
    recordSoulAuditLog({
      action: 'UPDATE',
      operator: operatorName,
      targetId: soulId,
      oldData: {
        id: oldDataSnapshot.id,
        name: oldDataSnapshot.name,
        category: oldDataSnapshot.category
      },
      newData: {
        id: updatedSoul.id,
        name: updatedSoul.name,
        changedFields: Object.keys(data)
      },
      ip: clientIP,
      reason: '更新Soul角色信息'
    });

    console.log(
      `[SoulService] Soul角色更新成功 | ID: ${soulId} | ` +
      `名称: ${updatedSoul.name}`
    );

    return updatedSoul;

  } catch (error) {
    console.error('[SoulService] 更新Soul角色异常:', error);
    throw error;
  }
}

/**
 * S004: 修改Soul角色状态（激活/停用）
 *
 * 功能说明：
 * 修改角色的激活状态
 * - active: 可选列表中可见，可以被选择参与辩论
 * - inactive: 停用状态，前端不可见但保留数据和配置
 *
 * @param {string} soulId - 角色ID
 * @param {Object} data - 状态变更数据
 * @param {string} data.status - 目标状态 (active/inactive)
 * @param {string} [data.reason] - 变更原因
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新后的角色对象
 */
export async function updateSoulStatus(soulId, data, operatorInfo) {
  try {
    const { status, reason } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(
      `[SoulService] 修改Soul角色状态 | ID: ${soulId} | ` +
      `目标状态: ${status} | 操作人: ${operatorName}`
    );

    // ========== 第一步：状态值验证 ==========
    const statusValidation = validateStatus(status);
    if (!statusValidation.valid) {
      const error = new Error(statusValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // ========== 第二步：查找角色 ==========
    const soulIndex = mockSouls.findIndex(s => s.id === soulId);

    if (soulIndex === -1) {
      const error = new Error('Soul角色不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const existingSoul = mockSouls[soulIndex];

    // ========== 第三步：检查状态是否有实际变化 ==========
    if (existingSoul.status === status) {
      const error = new Error(`Soul角色当前状态已经是 "${status}"，无需重复操作`);
      error.name = 'NO_CHANGE';
      throw error;
    }

    // ========== 第四步：保存旧数据并执行更新 ==========
    const oldStatus = existingSoul.status;

    const updatedSoul = {
      ...existingSoul,
      status,
      updatedAt: new Date().toISOString()
    };

    mockSouls[soulIndex] = updatedSoul;

    // ========== 第五步：记录审计日志（重要操作！）==========
    recordSoulAuditLog({
      action: 'STATUS_CHANGE',
      operator: operatorName,
      targetId: soulId,
      oldData: { status: oldStatus },
      newData: { status },
      ip: clientIP,
      reason: reason || `状态变更为: ${status}`
    });

    // 状态变更提示信息
    let statusMessage = '';
    switch (status) {
      case SOUL_STATUS.ACTIVE:
        statusMessage = 'Soul角色已激活，将出现在可选列表中';
        break;
      case SOUL_STATUS.INACTIVE:
        statusMessage = 'Soul角色已停用，将从可选列表中移除';
        break;
    }

    console.log(
      `[SoulService] 状态变更成功 | ID: ${soulId} | ` +
      `${oldStatus} → ${status} | 原因: ${reason || '未提供'}`
    );

    // 返回带有额外提示信息的对象
    return {
      ...updatedSoul,
      _message: statusMessage,
      _previousStatus: oldStatus
    };

  } catch (error) {
    console.error('[SoulService] 修改Soul角色状态异常:', error);
    throw error;
  }
}

/**
 * S005: 调整Soul角色AI参数配置
 *
 * 功能说明：
 * 单独修改角色的AI配置参数（不需要更新整个角色对象）
 * 支持单独修改：temperature、maxTokens、systemPrompt、personality
 * 所有参数变更都会被记录到变更历史中
 * 参数修改后下次辩论立即生效
 *
 * @param {string} soulId - 角色ID
 * @param {Object} data - AI配置变更数据
 * @param {number} [data.temperature] - 新的温度参数（0-1）
 * @param {number} [data.maxTokens] - 新的最大Token数（100-4000）
 * @param {string} [data.systemPrompt] - 新的系统提示词（最长2000字符）
 * @param {string} [data.personality] - 新的性格特征描述
 * @param {string} [data.model] - 切换AI模型
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 调整结果（包含新旧值对比）
 */
export async function updateSoulAIConfig(soulId, data, operatorInfo) {
  try {
    const { temperature, maxTokens, systemPrompt, personality, model } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(
      `[SoulService] 调整Soul角色AI配置 | ID: ${soulId} | ` +
      `操作人: ${operatorName}`
    );

    // ========== 第一步：检查是否至少提供了一个要更新的参数 ==========
    const hasUpdateParam = temperature !== undefined ||
      maxTokens !== undefined ||
      systemPrompt !== undefined ||
      personality !== undefined ||
      model !== undefined;

    if (!hasUpdateParam) {
      const error = new Error('至少需要提供一个要更新的AI参数');
      error.name = 'NO_UPDATE_PARAMS';
      throw error;
    }

    // ========== 第二步：逐一校验提供的参数 ==========

    if (temperature !== undefined) {
      const tempValidation = validateTemperature(temperature);
      if (!tempValidation.valid) {
        const error = new Error(tempValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }
    }

    if (maxTokens !== undefined) {
      const tokensValidation = validateMaxTokens(maxTokens);
      if (!tokensValidation.valid) {
        const error = new Error(tokensValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }
    }

    if (systemPrompt !== undefined) {
      const promptValidation = validateSystemPrompt(systemPrompt);
      if (!promptValidation.valid) {
        const error = new Error(promptValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }
    }

    if (model !== undefined) {
      const modelValidation = validateModel(model);
      if (!modelValidation.valid) {
        const error = new Error(modelValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }
    }

    // ========== 第三步：查找角色 ==========
    const soulIndex = mockSouls.findIndex(s => s.id === soulId);

    if (soulIndex === -1) {
      const error = new Error('Soul角色不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const existingSoul = mockSouls[soulIndex];

    // ========== 第四步：保存旧的AI配置快照 ==========
    const oldAIConfig = { ...existingSoul.aiConfig };

    // ========== 第五步：构建新的AI配置 ==========
    const newAIConfig = {
      ...existingSoul.aiConfig,
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(personality !== undefined && { personality }),
      ...(model !== undefined && { model })
    };

    // ========== 第六步：执行更新 ==========
    const updatedSoul = {
      ...existingSoul,
      aiConfig: newAIConfig,
      updatedAt: new Date().toISOString()
    };

    mockSouls[soulIndex] = updatedSoul;

    // ========== 第七步：记录审计日志（重要！参数变更必须留痕）==========
    recordSoulAuditLog({
      action: 'AI_CONFIG_CHANGE',
      operator: operatorName,
      targetId: soulId,
      oldData: { aiConfig: oldAIConfig },
      newData: {
        aiConfig: newAIConfig,
        changedParams: Object.keys(data)
      },
      ip: clientIP,
      reason: '调整AI参数配置'
    });

    // ========== 第八步：构建变更对比信息 ==========
    const changeDetails = {};

    if (temperature !== undefined && oldAIConfig.temperature !== temperature) {
      changeDetails.temperature = {
        oldValue: oldAIConfig.temperature,
        newValue: temperature,
        impactHint: getTemperatureImpactHint(temperature)
      };
    }

    if (maxTokens !== undefined && oldAIConfig.maxTokens !== maxTokens) {
      changeDetails.maxTokens = {
        oldValue: oldAIConfig.maxTokens,
        newValue: maxTokens,
        impactHint: getMaxTokensImpactHint(maxTokens)
      };
    }

    if (model !== undefined && oldAIConfig.model !== model) {
      changeDetails.model = {
        oldValue: oldAIConfig.model,
        newValue: model,
        impactHint: `已切换至${model}模型，下次辩论时生效`
      };
    }

    if (systemPrompt !== undefined) {
      changeDetails.systemPrompt = {
        changed: true,
        impactHint: '系统提示词已更新，角色的行为模式将发生变化'
      };
    }

    if (personality !== undefined) {
      changeDetails.personality = {
        oldValue: oldAIConfig.personality,
        newValue: personality,
        impactHint: '性格特征描述已更新'
      };
    }

    console.log(
      `[SoulService] AI配置调整成功 | ID: ${soulId} | ` +
      `变更参数: ${Object.keys(changeDetails).join(', ')}`
    );

    // 返回完整的调整结果
    return {
      ...updatedSoul,
      _configChangeInfo: {
        changedParams: Object.keys(changeDetails),
        changes: changeDetails,
        changedAt: new Date().toISOString(),
        changedBy: operatorName,
        effectiveImmediately: true  // 参数修改后下次辩论立即生效
      }
    };

  } catch (error) {
    console.error('[SoulService] 调整Soul角色AI配置异常:', error);
    throw error;
  }
}

// ============================================
// 数据生成辅助函数（用于模拟关联数据）
// ============================================

/**
 * 生成模拟的历史辩论表现记录
 *
 * @param {string} soulId - 角色ID
 * @param {number} count - 生成数量
 * @returns {Array} 模拟辩论记录数组
 */
function generateMockDebateHistory(soulId, count) {
  const debates = [];
  const topics = [
    'AI是否会取代人类工作？',
    '远程办公的利弊权衡',
    '年轻人该不该提前还房贷？',
    '短视频对注意力的影响',
    '新能源汽车的未来发展',
    '教育的数字化转型',
    '隐私与便利的平衡',
    '全球化还是本土化？'
  ];
  const results = ['win', 'lose', 'draw'];

  for (let i = 0; i < count; i++) {
    const result = results[Math.floor(Math.random() * results.length)];
    debates.push({
      id: `debate_soul_${soulId}_${i + 1}`,
      topic: topics[i % topics.length],
      result,
      participantCount: Math.floor(Math.random() * 50) + 10,
      duration: Math.floor(Math.random() * 30) + 10,  // 10-40分钟
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,  // 3.0-5.0分
      highlights: generateMockHighlights(result),
      createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString()  // 每3天一条
    });
  }

  return debates;
}

/**
 * 生成辩论亮点描述
 *
 * @param {string} result - 辩论结果
 * @returns {Array} 亮点数组
 */
function generateMockHighlights(result) {
  const winHighlights = [
    '论点清晰有力，逻辑严密',
    '巧妙运用类比说明抽象概念',
    '及时抓住对方论点漏洞',
    '结尾总结精彩，升华主题'
  ];
  const loseHighlights = [
    '开场论述充分',
    '回应质疑较为及时',
    '展现了独特的思考角度',
    '需要在时间控制上改进'
  ];
  const drawHighlights = [
    '双方势均力敌',
    '讨论深入且富有建设性',
    '各自展现了不同视角的价值',
    '达成了部分共识'
  ];

  const pool = result === 'win' ? winHighlights : (result === 'lose' ? loseHighlights : drawHighlights);
  const selected = [];
  const numHighlights = Math.floor(Math.random() * 2) + 2;  // 2-3个亮点

  while (selected.length < numHighlights && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected;
}

/**
 * 生成用户反馈摘要
 *
 * @param {Object} soul - 角色对象
 * @returns {Object} 反馈摘要
 */
function generateMockFeedbackSummary(soul) {
  const positiveComments = [
    '这个角色很有深度，每次都能学到新东西',
    '回答质量很高，逻辑清晰',
    '性格鲜明，让人印象深刻',
    '知识渊博，引经据典'
  ];
  const negativeComments = [
    '有时候回复有点长',
    '希望能更简洁一些',
    '偶尔会跑题',
    '语调有时候过于严肃'
  ];
  const suggestions = [
    '增加更多互动性',
    '可以更幽默一些',
    '希望能引用更多现代案例',
    '建议增加表情符号让表达更生动'
  ];

  return {
    totalFeedbacks: Math.floor(soul.usageStats.favoriteCount * 1.5),
    positiveRate: Math.round((0.7 + Math.random() * 0.2) * 100),  // 70-90%
    topPositiveComments: positiveComments.slice(0, 2),
    topNegativeComments: negativeComments.slice(0, 2),
    topSuggestions: suggestions.slice(0, 2),
    lastFeedbackAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
  };
}

/**
 * 获取温度参数的影响提示
 *
 * @param {number} temperature - 温度值
 * @returns {string} 影响描述
 */
function getTemperatureImpactHint(temperature) {
  if (temperature <= 0.3) {
    return '低温度：角色回答会更加确定和一致，适合需要准确性的场景';
  } else if (temperature <= 0.7) {
    return '中等温度：角色会在确定性和创造性之间取得平衡（推荐值）';
  } else {
    return '高温度：角色回答会更加多样化和有创意，但可能不够稳定';
  }
}

/**
 * 获取最大Token数的影响提示
 *
 * @param {number} maxTokens - 最大Token数
 * @returns {string} 影响描述
 */
function getMaxTokensImpactHint(maxTokens) {
  if (maxTokens <= 500) {
    return '短回复：角色会生成简短的回答，适合快速问答';
  } else if (maxTokens <= 1500) {
    return '中等长度：角色可以给出较详细的解释（推荐值）';
  } else {
    return '长回复：角色可以进行深入的论述和分析';
  }
}

// ============================================
// 默认导出
// ============================================

export default {
  getSouls,
  getSoulById,
  createSoul,
  updateSoul,
  updateSoulStatus,
  updateSoulAIConfig,

  // 导出常量和工具函数（供其他模块使用）
  SOUL_STATUS,
  AI_MODELS,
  SOUL_CATEGORIES,
  validateName,
  validateTemperature,
  validateMaxTokens,
  validateSystemPrompt,
  validateStatus
};
