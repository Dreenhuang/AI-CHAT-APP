/**
 * 议题管理服务层 (Topic Service)
 *
 * 功能说明：
 * 实现辩论议题的全生命周期管理，包括：
 * - T001: 议题列表查询（分页、筛选、排序）
 * - T002: 议题详情查看（含关联数据）
 * - T003: 创建/编辑议题
 * - T004: 上架/下架议题
 * - T005: 调整议题热度
 *
 * 技术架构：
 * - 服务层模式：封装所有业务逻辑，控制器只负责请求/响应
 * - 乐观锁机制：使用version字段防止并发冲突
 * - 审计日志：所有写操作自动记录审计日志
 *
 * 数据来源：
 * 开发阶段使用内存模拟数据，生产环境替换为 Prisma/Supabase 查询
 */

import { randomUUID } from 'crypto';

// ============================================
// 类型定义 (JSDoc Type Definitions)
// ============================================

/**
 * 议题状态枚举
 * - published: 已发布（前端可见）
 * - draft: 草稿（隐藏但保留数据）
 * - archived: 已归档（前端不可见，保留历史记录）
 */
export const TOPIC_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  ARCHIVED: 'archived'
};

/**
 * 排序字段枚举
 */
export const SORT_FIELDS = {
  HOTNESS: 'hotness',
  CREATED_AT: 'createdAt',
  DEBATE_COUNT: 'debateCount'
};

/**
 * @typedef {Object} TopicItem
 * @property {string} id - UUID主键
 * @property {string} title - 标题（必填，5-100字符）
 * @property {string} [description] - 描述（可选，0-500字符）
 * @property {string} [slug] - URL友好标识符（自动生成）
 * @property {string} [category] - 分类ID或名称
 * @property {string} [coverImage] - 封面图片URL
 * @property {'published'|'draft'|'archived'} status - 发布状态
 * @property {number} hotness - 热度值（0-100）
 * @property {number} debateCount - 关联辩论数
 * @property {number} participantCount - 参与人数
 * @property {number} viewCount - 浏览量
 * @property {number} version - 乐观锁版本号
 * @property {string} [createdBy] - 创建者ID
 * @property {string} [createdByName] - 创建者名称
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} page - 页码
 * @property {number} pageSize - 每页条数
 */

/**
 * @typedef {Object} TopicListParams
 * @property {number} page - 页码
 * @property {number} pageSize - 每页条数
 * @property {string} [status] - 状态筛选: published/draft/archived/all
 * @property {string} [category] - 分类筛选
 * @property {number} [hotnessMin] - 最低热度
 * @property {string} [search] - 搜索关键词（标题/描述）
 * @property {string} [sortBy] - 排序字段: hotness/createdAt/debateCount
 * @property {string} [order] - 排序方向: asc/desc
 */

/**
 * @typedef {Object} TopicListResponse
 * @property {TopicItem[]} topics - 议题数组
 * @property {TopicSummary} summary - 统计摘要
 * @property {PaginationInfo} pagination - 分页信息
 */

/**
 * @typedef {Object} TopicSummary
 * @property {number} totalPublished - 已发布数量
 * @property {number} totalDraft - 草稿数量
 * @property {number} totalArchived - 归档数量
 * @property {number} avgHotness - 平均热度
 * @property {Object|null} topTopic - 最高热度议题
 * @property {string} topTopic.id - 议题ID
 * @property {string} topTopic.title - 议题标题
 * @property {number} topTopic.hotness - 热度值
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
 * @typedef {Object} TopicDetailResponse
 * @extends TopicItem
 * @property {Array} recentDebates - 最新辩论列表
 * @property {Object} participantStats - 参与用户统计
 * @property {Array} [hotnessTrend] - 热度趋势数据
 * @property {Array} editHistory - 编辑历史记录
 */

// ============================================
// 模拟数据存储 (开发环境使用)
// ============================================

/**
 * 模拟议题数据
 * 生产环境中应从数据库读取，这里仅作演示和测试用
 *
 * 设计说明：
 * - 使用真实场景的数据示例，便于前端开发和测试
 * - 覆盖各种状态组合，确保边界情况可测
 * - 包含足够的数据量来验证分页功能
 */
let mockTopics = [
  {
    id: 'topic_001',
    title: 'AI能否取代白领？',
    description: '随着ChatGPT等大语言模型的爆发式发展，AI正在重塑职场格局。本议题探讨AI对白领工作的替代可能性及其社会影响。',
    slug: 'ai-replace-white-collar',
    category: '科技',
    coverImage: 'https://example.com/images/ai-topic.jpg',
    status: 'published',
    hotness: 98,
    debateCount: 256,
    participantCount: 1280,
    viewCount: 15680,
    version: 5,
    createdBy: 'admin',
    createdByName: '内容运营',
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-13T10:30:00.000Z'
  },
  {
    id: 'topic_002',
    title: '远程办公是否应该成为常态？',
    description: '疫情改变了工作方式，但回归办公室的呼声也在增加。远程办公的利弊究竟如何平衡？',
    slug: 'remote-work-normal',
    category: '职场',
    status: 'published',
    hotness: 87,
    debateCount: 189,
    participantCount: 956,
    viewCount: 12340,
    version: 3,
    createdBy: 'admin',
    createdByName: '内容运营',
    createdAt: '2026-05-03T10:00:00.000Z',
    updatedAt: '2026-05-12T15:20:00.000Z'
  },
  {
    id: 'topic_003',
    title: '年轻人该不该提前还房贷？',
    description: '房贷压力与投资收益之间的权衡，是许多年轻人面临的现实选择。',
    slug: 'early-mortgage-payment',
    category: '财经',
    status: 'published',
    hotness: 92,
    debateCount: 312,
    participantCount: 1580,
    viewCount: 18900,
    version: 7,
    createdBy: 'admin',
    createdByName: '内容运营',
    createdAt: '2026-04-28T09:00:00.000Z',
    updatedAt: '2026-05-13T08:45:00.000Z'
  },
  {
    id: 'topic_004',
    title: '短视频是否在毁掉年轻人的专注力？',
    description: '抖音、快手等短视频平台占据了大量时间，这是否导致了深度思考能力的退化？',
    slug: 'short-video-attention',
    category: '社会',
    status: 'published',
    hotness: 76,
    debateCount: 145,
    participantCount: 720,
    viewCount: 9800,
    version: 2,
    createdBy: 'admin',
    createdByName: '内容运营',
    createdAt: '2026-05-05T14:00:00.000Z',
    updatedAt: '2026-05-11T11:00:00.000Z'
  },
  {
    id: 'topic_005',
    title: '考研还是就业？毕业生的两难选择',
    description: '学历贬值与就业压力并存，考研是否仍是提升竞争力的最佳途径？',
    slug: 'postgrad-vs-job',
    category: '教育',
    status: 'published',
    hotness: 85,
    debateCount: 203,
    participantCount: 1100,
    viewCount: 14200,
    version: 4,
    createdBy: 'admin',
    createdByName: '内容运营',
    createdAt: '2026-04-25T16:00:00.000Z',
    updatedAt: '2026-05-10T09:30:00.000Z'
  },
  {
    id: 'topic_006',
    title: '新能源汽车能否完全取代燃油车？',
    description: '技术进步与基础设施建设的博弈，新能源车的未来在哪里？',
    slug: 'ev-vs-fuel-car',
    category: '汽车',
    status: 'draft',
    hotness: 65,
    debateCount: 78,
    participantCount: 390,
    viewCount: 5200,
    version: 1,
    createdBy: 'operator',
    createdByName: '运营专员A',
    createdAt: '2026-05-10T11:00:00.000Z',
    updatedAt: '2026-05-10T11:00:00.000Z'
  },
  {
    id: 'topic_007',
    title: '元宇宙是未来还是泡沫？',
    description: 'Meta等巨头押注元宇宙，但用户接受度并不高。这项技术的实际价值何在？',
    slug: 'metaverse-future-or-bubble',
    category: '科技',
    status: 'draft',
    hotness: 45,
    debateCount: 32,
    participantCount: 160,
    viewCount: 2100,
    version: 1,
    createdBy: 'operator',
    createdByName: '运营专员B',
    createdAt: '2026-05-12T09:00:00.000Z',
    updatedAt: '2026-05-12T09:00:00.000Z'
  },
  {
    id: 'topic_008',
    title: '预制菜是否应该进入校园？',
    description: '食品安全与成本控制的矛盾，学生餐该如何保障？',
    slug: 'premade-food-school',
    category: '生活',
    status: 'archived',
    hotness: 30,
    debateCount: 56,
    participantCount: 280,
    viewCount: 3600,
    version: 3,
    createdBy: 'admin',
    createdByName: '内容运营',
    createdAt: '2026-04-15T08:00:00.000Z',
    updatedAt: '2026-05-08T16:00:00.000Z'
  }
];

// ============================================
// 审计日志存储
// ============================================

const topicAuditLogs = [];

/**
 * 记录议题操作审计日志
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
function recordTopicAuditLog(logInfo) {
  const logEntry = {
    ...logInfo,
    timestamp: new Date().toISOString(),
    logId: `topic_audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  topicAuditLogs.push(logEntry);

  // 只保留最近2000条日志
  if (topicAuditLogs.length > 2000) {
    topicAuditLogs.shift();
  }

  console.log(
    `[TopicAudit] ${logEntry.action} | ` +
    `操作人: ${logEntry.operator} | ` +
    `目标: ${logEntry.targetId} | ` +
    (logEntry.reason ? `原因: ${logEntry.reason}` : '')
  );
}

// ============================================
// 辅助工具函数
// ============================================

/**
 * 生成URL友好的slug
 *
 * 将中文标题转换为URL安全的标识符
 * 例如："AI能否取代白领？" → "ai能否取代白领"
 *
 * @param {string} title - 议题标题
 * @returns {string} URL安全标识符
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')  // 替换非字母数字中文为-
    .replace(/^-+|-+$/g, '');                  // 去除首尾-
}

/**
 * 验证议题标题格式
 *
 * @param {string} title - 待验证的标题
 * @returns {{ valid: boolean, message: string }}
 */
function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, message: '标题不能为空' };
  }

  if (title.trim().length < 5) {
    return { valid: false, message: '标题长度不能少于5个字符' };
  }

  if (title.trim().length > 100) {
    return { valid: false, message: '标题长度不能超过100个字符' };
  }

  return { valid: true, message: '标题格式正确' };
}

/**
 * 验证描述格式
 *
 * @param {string} description - 待验证的描述
 * @returns {{ valid: boolean, message: string }}
 */
function validateDescription(description) {
  if (description === undefined || description === null) {
    return { valid: true, message: '描述为可选字段' };  // 描述是可选的
  }

  if (typeof description !== 'string') {
    return { valid: false, message: '描述必须是文本类型' };
  }

  if (description.length > 500) {
    return { valid: false, message: '描述长度不能超过500个字符' };
  }

  return { valid: true, message: '描述格式正确' };
}

/**
 * 验证热度值范围
 *
 * @param {number} hotness - 热度值
 * @returns {{ valid: boolean, message: string }}
 */
function validateHotness(hotness) {
  if (typeof hotness !== 'number' || isNaN(hotness)) {
    return { valid: false, message: '热度值必须是数字' };
  }

  if (hotness < 0 || hotness > 100) {
    return { valid: false, message: '热度值必须在0-100之间' };
  }

  return { valid: true, message: '热度值有效' };
}

/**
 * 验证状态值
 *
 * @param {string} status - 状态值
 * @returns {{ valid: boolean, message: string }}
 */
function validateStatus(status) {
  const validStatuses = [TOPIC_STATUS.PUBLISHED, TOPIC_STATUS.DRAFT, TOPIC_STATUS.ARCHIVED];

  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      message: `无效的状态值，必须是以下之一: ${validStatuses.join(', ')}`
    };
  }

  return { valid: true, message: '状态值有效' };
}

// ============================================
// 核心业务逻辑函数
// ============================================

/**
 * T001: 获取议题列表（分页查询）
 *
 * 功能说明：
 * 支持多维度筛选和排序的分页列表查询
 * 返回议题数据 + 统计摘要 + 分页信息
 *
 * @param {TopicListParams} params - 查询参数
 * @returns {Promise<TopicListResponse>} 列表响应数据
 *
 * 查询参数说明：
 * - page: 页码（默认1）
 * - pageSize: 每页条数（默认20，最大100）
 * - status: 状态筛选（published/draft/archived/all，默认all）
 * - category: 分类筛选
 * - hotnessMin: 最低热度过滤
 * - search: 关键词搜索（匹配标题和描述）
 * - sortBy: 排序字段（hotness/createdAt/debateCount）
 * - order: 排序方向（asc/desc，默认desc）
 *
 * 示例调用：
 * ```javascript
 * // 获取已发布的议题，按热度降序排列
 * await getTopics({ status: 'published', sortBy: 'hotness', order: 'desc' })
 *
 * // 搜索包含"AI"的议题
 * await getTopics({ search: 'AI', page: 1, pageSize: 10 })
 * ```
 */
export async function getTopics(params) {
  try {
    // ========== 参数默认值处理 ==========
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const status = params.status || 'all';
    const sortBy = params.sortBy || SORT_FIELDS.CREATED_AT;
    const order = params.order === 'asc' ? 'asc' : 'desc';

    console.log(
      `[TopicService] 查询议题列表 | 页码: ${page} | 每页: ${pageSize} | ` +
      `状态: ${status} | 排序: ${sortBy} ${order}`
    );

    // ========== 第一步：应用筛选条件 ==========
    let filteredTopics = [...mockTopics];

    // 1. 状态筛选
    if (status !== 'all') {
      filteredTopics = filteredTopics.filter(t => t.status === status);
    }

    // 2. 分类筛选
    if (params.category) {
      filteredTopics = filteredTopics.filter(t =>
        t.category?.toLowerCase() === params.category.toLowerCase()
      );
    }

    // 3. 最低热度过滤
    if (params.hotnessMin !== undefined && params.hotnessMin !== null) {
      const minHotness = Number(params.hotnessMin);
      if (!isNaN(minHotness)) {
        filteredTopics = filteredTopics.filter(t => t.hotness >= minHotness);
      }
    }

    // 4. 关键词搜索（匹配标题和描述）
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim().toLowerCase();
      filteredTopics = filteredTopics.filter(t =>
        t.title.toLowerCase().includes(searchTerm) ||
        (t.description && t.description.toLowerCase().includes(searchTerm))
      );
    }

    // ========== 第二步：排序 ==========
    filteredTopics.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case SORT_FIELDS.HOTNESS:
          comparison = a.hotness - b.hotness;
          break;
        case SORT_FIELDS.DEBATE_COUNT:
          comparison = a.debateCount - b.debateCount;
          break;
        case SORT_FIELDS.CREATED_AT:
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    // ========== 第三步：计算分页信息 ==========
    const totalItems = filteredTopics.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTopics = filteredTopics.slice(startIndex, endIndex);

    // ========== 第四步：计算统计摘要 ==========
    const allPublished = mockTopics.filter(t => t.status === TOPIC_STATUS.PUBLISHED);
    const allDraft = mockTopics.filter(t => t.status === TOPIC_STATUS.DRAFT);
    const allArchived = mockTopics.filter(t => t.status === TOPIC_STATUS.ARCHIVED);

    // 平均热度（仅计算已发布的）
    const avgHotness = allPublished.length > 0
      ? allPublished.reduce((sum, t) => sum + t.hotness, 0) / allPublished.length
      : 0;

    // 找出最高热度的议题
    const topTopic = allPublished.length > 0
      ? allPublished.reduce((max, t) => t.hotness > max.hotness ? t : max)
      : null;

    const summary = {
      totalPublished: allPublished.length,
      totalDraft: allDraft.length,
      totalArchived: allArchived.length,
      avgHotness: Math.round(avgHotness * 10) / 10,  // 保留一位小数
      topTopic: topTopic ? { id: topTopic.id, title: topTopic.title, hotness: topTopic.hotness } : null
    };

    // ========== 第五步：组装返回结果 ==========
    const result = {
      topics: paginatedTopics,
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
      `[TopicService] 查询完成 | 返回 ${paginatedTopics.length} 条 | 共 ${totalItems} 条`
    );

    return result;

  } catch (error) {
    console.error('[TopicService] 查询议题列表异常:', error);
    throw error;
  }
}

/**
 * T002: 获取议题详情
 *
 * 功能说明：
 * 返回议题的完整信息，包括：
 * - 基本信息
 * - 关联的最新辩论列表（最多10条）
 * - 参与用户统计（按角色分布）
 * - 热度趋势图数据（近7天）
 * - 编辑历史记录
 *
 * @param {string} topicId - 议题ID
 * @returns {Promise<TopicDetailResponse>} 议题详情
 */
export async function getTopicById(topicId) {
  try {
    console.log(`[TopicService] 查询议题详情 | ID: ${topicId}`);

    // ========== 第一步：查找议题 ==========
    const topic = mockTopics.find(t => t.id === topicId);

    if (!topic) {
      const error = new Error('议题不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    // ========== 第二步：获取关联的辩论列表（模拟数据）==========
    const mockDebates = generateMockDebates(topicId, 10);

    // ========== 第三步：生成参与用户统计 ==========
    const participantStats = {
      total: topic.participantCount,
      byRole: {
        '正方': Math.floor(topic.participantCount * 0.42),
        '反方': Math.floor(topic.participantCount * 0.38),
        '观众': Math.ceil(topic.participantCount * 0.20)
      }
    };

    // ========== 第四步：生成热度趋势数据（近7天模拟）==========
    const hotnessTrend = generateMockHotnessTrend(topic.hotness);

    // ========== 第五步：获取编辑历史 ==========
    const editHistory = topicAuditLogs
      .filter(log => log.targetId === topicId && ['CREATE', 'UPDATE', 'STATUS_CHANGE', 'HOTNESS_CHANGE'].includes(log.action))
      .slice(-10)  // 最近10条
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

    // ========== 第六步：组装详情响应 ==========
    const detailResponse = {
      ...topic,
      recentDebates: mockDebates,
      participantStats,
      hotnessTrend,
      editHistory
    };

    console.log(`[TopicService] 议题详情查询成功 | 标题: ${topic.title}`);

    return detailResponse;

  } catch (error) {
    console.error('[TopicService] 查询议题详情异常:', error);
    throw error;
  }
}

/**
 * T003: 创建新议题
 *
 * 功能说明：
 * 创建一个新的辩论议题，自动生成slug并设置初始状态
 *
 * @param {Object} data - 议题数据
 * @param {string} data.title - 标题（必填，5-100字符）
 * @param {string} [data.description] - 描述（可选，0-500字符）
 * @param {string} [data.category] - 分类
 * @param {string} [data.coverImage] - 封面图片URL
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 创建后的完整议题对象
 */
export async function createTopic(data, operatorInfo) {
  try {
    const { title, description, category, coverImage } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorId = operatorInfo?.admin_id || 'system';

    console.log(`[TopicService] 创建议题 | 操作人: ${operatorName} | 标题: ${title}`);

    // ========== 第一步：参数校验 ==========

    // 1.1 标题验证
    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) {
      const error = new Error(titleValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // 1.2 描述验证
    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      const error = new Error(descValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // 1.3 标题去重检查（不允许完全相同的标题）
    const existingTopic = mockTopics.find(t =>
      t.title.trim().toLowerCase() === title.trim().toLowerCase()
    );

    if (existingTopic) {
      const error = new Error('已存在相同标题的议题');
      error.name = 'DUPLICATE_TITLE';
      throw error;
    }

    // ========== 第二步：创建议题对象 ==========
    const now = new Date().toISOString();
    const newTopic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      description: description?.trim() || undefined,
      slug: generateSlug(title),
      category: category?.trim() || undefined,
      coverImage: coverImage?.trim() || undefined,
      status: TOPIC_STATUS.DRAFT,  // 新建议题默认为草稿状态
      hotness: 0,                   // 初始热度为0
      debateCount: 0,
      participantCount: 0,
      viewCount: 0,
      version: 1,                   // 初始版本号
      createdBy: String(operatorId),
      createdByName: operatorName,
      createdAt: now,
      updatedAt: now
    };

    // ========== 第三步：保存到存储 ==========
    mockTopics.unshift(newTopic);  // 新建议题放在最前面

    // ========== 第四步：记录审计日志 ==========
    recordTopicAuditLog({
      action: 'CREATE',
      operator: operatorName,
      targetId: newTopic.id,
      oldData: null,
      newData: {
        id: newTopic.id,
        title: newTopic.title,
        status: newTopic.status
      },
      ip: operatorInfo?.ip || 'unknown',
      reason: '创建新议题'
    });

    console.log(`[TopicService] 议题创建成功 | ID: ${newTopic.id} | 标题: ${newTopic.title}`);

    return newTopic;

  } catch (error) {
    console.error('[TopicService] 创建议题异常:', error);
    throw error;
  }
}

/**
 * T003 (续): 更新现有议题
 *
 * 功能说明：
 * 更新议题的基本信息，使用乐观锁防止并发冲突
 *
 * @param {string} topicId - 议题ID
 * @param {Object} data - 更新数据
 * @param {number} [data.version] - 乐观锁版本号（必须提供）
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新后的完整议题对象
 */
export async function updateTopic(topicId, data, operatorInfo) {
  try {
    const { title, description, category, coverImage, version } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(`[TopicService] 更新议题 | ID: ${topicId} | 操作人: ${operatorName}`);

    // ========== 第一步：查找议题 ==========
    const topicIndex = mockTopics.findIndex(t => t.id === topicId);

    if (topicIndex === -1) {
      const error = new Error('议题不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const existingTopic = mockTopics[topicIndex];

    // ========== 第二步：乐观锁版本检查 ==========
    if (version !== undefined && existingTopic.version !== version) {
      const error = new Error(
        `数据已被其他人修改（当前版本: ${existingTopic.version}，请求版本: ${version}），请刷新后重试`
      );
      error.name = 'VERSION_CONFLICT';
      error.currentVersion = existingTopic.version;
      throw error;
    }

    // ========== 第三步：参数校验 ==========
    if (title !== undefined) {
      const titleValidation = validateTitle(title);
      if (!titleValidation.valid) {
        const error = new Error(titleValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }

      // 标题去重检查（排除自身）
      const duplicateTopic = mockTopics.find(t =>
        t.id !== topicId &&
        t.title.trim().toLowerCase() === title.trim().toLowerCase()
      );

      if (duplicateTopic) {
        const error = new Error('已存在相同标题的议题');
        error.name = 'DUPLICATE_TITLE';
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

    // ========== 第四步：保存旧数据快照（用于审计日志）==========
    const oldDataSnapshot = { ...existingTopic };

    // ========== 第五步：更新议题数据 ==========
    const updatedTopic = {
      ...existingTopic,
      ...(title !== undefined && { title: title.trim() }),
      ...(title !== undefined && { slug: generateSlug(title) }),  // 标题变化时重新生成slug
      ...(description !== undefined && { description: description?.trim() || undefined }),
      ...(category !== undefined && { category: category?.trim() || undefined }),
      ...(coverImage !== undefined && { coverImage: coverImage?.trim() || undefined }),
      version: existingTopic.version + 1,  // 版本号递增
      updatedAt: new Date().toISOString()
    };

    // 更新存储
    mockTopics[topicIndex] = updatedTopic;

    // ========== 第六步：记录审计日志 ==========
    recordTopicAuditLog({
      action: 'UPDATE',
      operator: operatorName,
      targetId: topicId,
      oldData: oldDataSnapshot,
      newData: {
        id: updatedTopic.id,
        title: updatedTopic.title,
        changedFields: Object.keys(data)
      },
      ip: clientIP,
      reason: '更新议题信息'
    });

    console.log(
      `[TopicService] 议题更新成功 | ID: ${topicId} | ` +
      `版本: v${existingTopic.version} → v${updatedTopic.version}`
    );

    return updatedTopic;

  } catch (error) {
    console.error('[TopicService] 更新议题异常:', error);
    throw error;
  }
}

/**
 * T004: 修改议题状态（上架/下架/归档）
 *
 * 功能说明：
 * 修改议题的发布状态，影响前端显示
 * - published: 显示在前端发现页
 * - draft: 隐藏但保留数据
 * - archived: 归档（前端不可见，但保留历史辩论记录）
 *
 * @param {string} topicId - 议题ID
 * @param {Object} data - 状态变更数据
 * @param {string} data.status - 目标状态 (published/draft/archived)
 * @param {string} [data.reason] - 变更原因
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新后的议题对象
 */
export async function updateTopicStatus(topicId, data, operatorInfo) {
  try {
    const { status, reason } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(
      `[TopicService] 修改议题状态 | ID: ${topicId} | ` +
      `目标状态: ${status} | 操作人: ${operatorName}`
    );

    // ========== 第一步：状态值验证 ==========
    const statusValidation = validateStatus(status);
    if (!statusValidation.valid) {
      const error = new Error(statusValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // ========== 第二步：查找议题 ==========
    const topicIndex = mockTopics.findIndex(t => t.id === topicId);

    if (topicIndex === -1) {
      const error = new Error('议题不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const existingTopic = mockTopics[topicIndex];

    // ========== 第三步：检查状态是否有实际变化 ==========
    if (existingTopic.status === status) {
      const error = new Error(`议题当前状态已经是 "${status}"，无需重复操作`);
      error.name = 'NO_CHANGE';
      throw error;
    }

    // ========== 第四步：保存旧数据并执行更新 ==========
    const oldStatus = existingTopic.status;

    const updatedTopic = {
      ...existingTopic,
      status,
      version: existingTopic.version + 1,
      updatedAt: new Date().toISOString()
    };

    mockTopics[topicIndex] = updatedTopic;

    // ========== 第五步：记录审计日志（重要操作！）==========
    recordTopicAuditLog({
      action: 'STATUS_CHANGE',
      operator: operatorName,
      targetId: topicId,
      oldData: { status: oldStatus },
      newData: { status },
      ip: clientIP,
      reason: reason || `状态变更为: ${status}`
    });

    // 状态变更提示信息
    let statusMessage = '';
    switch (status) {
      case TOPIC_STATUS.PUBLISHED:
        statusMessage = '议题已上架，将在前端发现页显示';
        break;
      case TOPIC_STATUS.DRAFT:
        statusMessage = '议题已下架为草稿，前端将不再显示';
        break;
      case TOPIC_STATUS.ARCHIVED:
        statusMessage = '议题已归档，前端不可见但保留了历史辩论记录';
        break;
    }

    console.log(
      `[TopicService] 状态变更成功 | ID: ${topicId} | ` +
      `${oldStatus} → ${status} | 原因: ${reason || '未提供'}`
    );

    // 返回带有额外提示信息的对象
    return {
      ...updatedTopic,
      _message: statusMessage,
      _previousStatus: oldStatus
    };

  } catch (error) {
    console.error('[TopicService] 修改议题状态异常:', error);
    throw error;
  }
}

/**
 * T005: 调整议题热度
 *
 * 功能说明：
 * 手动调整议题的热度值（0-100）
 * 此操作需要特殊权限（只有super_admin可以操作）
 * 会影响前端排序和推荐算法
 *
 * @param {string} topicId - 议题ID
 * @param {Object} data - 热度调整数据
 * @param {number} data.hotness - 目标热度值（0-100）
 * @param {string} [data.reason] - 调整原因
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 调整结果（包含新旧值对比）
 */
export async function updateTopicHotness(topicId, data, operatorInfo) {
  try {
    const { hotness, reason } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(
      `[TopicService] 调整议题热度 | ID: ${topicId} | ` +
      `目标热度: ${hotness} | 操作人: ${operatorName}`
    );

    // ========== 第一步：热度值范围验证 ==========
    const hotnessValidation = validateHotness(hotness);
    if (!hotnessValidation.valid) {
      const error = new Error(hotnessValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // ========== 第二步：查找议题 ==========
    const topicIndex = mockTopics.findIndex(t => t.id === topicId);

    if (topicIndex === -1) {
      const error = new Error('议题不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const existingTopic = mockTopics[topicIndex];
    const oldHotness = existingTopic.hotness;

    // ========== 第三步：检查是否有实际变化 ==========
    if (oldHotness === hotness) {
      const error = new Error(`议题当前热度已经是 ${hotness}，无需重复调整`);
      error.name = 'NO_CHANGE';
      throw error;
    }

    // ========== 第四步：执行更新 ==========
    const updatedTopic = {
      ...existingTopic,
      hotness,
      version: existingTopic.version + 1,
      updatedAt: new Date().toISOString()
    };

    mockTopics[topicIndex] = updatedTopic;

    // ========== 第五步：记录审计日志（重要操作！）==========
    recordTopicAuditLog({
      action: 'HOTNESS_CHANGE',
      operator: operatorName,
      targetId: topicId,
      oldData: { hotness: oldHotness },
      newData: { hotness },
      ip: clientIP,
      reason: reason || `手动调整热度: ${oldHotness} → ${hotness}`
    });

    // ========== 第六步：计算影响范围提示 ==========
    let impactHint = '';
    const diff = hotness - oldHotness;

    if (diff > 20) {
      impactHint = '大幅提升！该议题在前端的排名将显著上升，可能进入推荐位。';
    } else if (diff > 0) {
      impactHint = '适度提升。该议题在前端的展示权重将略有增加。';
    } else if (diff < -20) {
      impactHint = '大幅降低！该议题在前端的排名将显著下降，可能退出推荐位。';
    } else {
      impactHint = '适度降低。该议题在前端的展示权重将略有减少。';
    }

    console.log(
      `[TopicService] 热度调整成功 | ID: ${topicId} | ` +
      `${oldHotness} → ${hotness} (${diff > 0 ? '+' : ''}${diff}) | ` +
      `原因: ${reason || '未提供'}`
    );

    // 返回完整的调整结果
    return {
      ...updatedTopic,
      _adjustmentInfo: {
        oldValue: oldHotness,
        newValue: hotness,
        change: diff,
        impactHint,
        adjustedAt: new Date().toISOString(),
        adjustedBy: operatorName
      }
    };

  } catch (error) {
    console.error('[TopicService] 调整议题热度异常:', error);
    throw error;
  }
}

// ============================================
// 数据生成辅助函数（用于模拟关联数据）
// ============================================

/**
 * 生成模拟的关联辩论列表
 *
 * @param {string} topicId - 议题ID
 * @param {number} count - 生成数量
 * @returns {Array} 模拟辩论数组
 */
function generateMockDebates(topicId, count) {
  const debates = [];
  const statuses = ['ongoing', 'completed', 'paused'];
  const titles = [
    '精彩对决：正方观点犀利',
    '深度交锋：双方论点充分',
    '激烈辩论：引经据典',
    '理性讨论：各抒己见',
    '思维碰撞：火花四溅'
  ];

  for (let i = 0; i < count; i++) {
    debates.push({
      id: `debate_${topicId}_${i + 1}`,
      title: titles[i % titles.length],
      status: statuses[i % statuses.length],
      participantCount: Math.floor(Math.random() * 50) + 10,
      createdAt: new Date(Date.now() - i * 86400000).toISOString()  // 每天一条
    });
  }

  return debates;
}

/**
 * 生成模拟的热度趋势数据（近7天）
 *
 * @param {number} currentHotness - 当前热度值
 * @returns {Array} 热度趋势数组
 */
function generateMockHotnessTrend(currentHotness) {
  const trend = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // 在当前热度基础上添加随机波动（±15）
    const fluctuation = (Math.random() - 0.5) * 30;
    const value = Math.max(0, Math.min(100, currentHotness + fluctuation));

    trend.push({
      date: date.toISOString().split('T')[0],  // YYYY-MM-DD格式
      value: Math.round(value * 10) / 10
    });
  }

  return trend;
}

// ============================================
// 默认导出
// ============================================

export default {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  updateTopicStatus,
  updateTopicHotness,

  // 导出常量和工具函数（供其他模块使用）
  TOPIC_STATUS,
  SORT_FIELDS,
  validateTitle,
  validateHotness,
  validateStatus
};
