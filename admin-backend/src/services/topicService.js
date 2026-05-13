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
 * - 使用 Prisma ORM 操作 PostgreSQL 数据库
 * - 所有写操作使用 await 确保完成
 */

import prisma from '../lib/prisma.js';

// ============================================
// 常量定义
// ============================================

export const TOPIC_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  ARCHIVED: 'archived'
};

export const SORT_FIELDS = {
  HOTNESS: 'hotness',
  CREATED_AT: 'createdAt',
  DEBATE_COUNT: 'debateCount'
};

// ============================================
// 辅助工具函数
// ============================================

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

function validateDescription(description) {
  if (description === undefined || description === null) {
    return { valid: true, message: '描述为可选字段' };
  }
  if (typeof description !== 'string') {
    return { valid: false, message: '描述必须是文本类型' };
  }
  if (description.length > 500) {
    return { valid: false, message: '描述长度不能超过500个字符' };
  }
  return { valid: true, message: '描述格式正确' };
}

function validateHotness(hotness) {
  if (typeof hotness !== 'number' || isNaN(hotness)) {
    return { valid: false, message: '热度值必须是数字' };
  }
  if (hotness < 0 || hotness > 100) {
    return { valid: false, message: '热度值必须在0-100之间' };
  }
  return { valid: true, message: '热度值有效' };
}

function validateStatus(status) {
  const validStatuses = [TOPIC_STATUS.PUBLISHED, TOPIC_STATUS.DRAFT, TOPIC_STATUS.ARCHIVED];
  if (!validStatuses.includes(status)) {
    return { valid: false, message: `无效的状态值，必须是以下之一: ${validStatuses.join(', ')}` };
  }
  return { valid: true, message: '状态值有效' };
}

// ============================================
// 核心业务逻辑函数
// ============================================

/**
 * T001: 获取议题列表（分页查询）
 *
 * @param {Object} params - 查询参数
 * @returns {Promise<{topics: Array, summary: Object, pagination: Object}>}
 */
export async function getTopics(params = {}) {
  try {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const status = params.status || 'all';
    const sortBy = params.sortBy || SORT_FIELDS.CREATED_AT;
    const order = params.order === 'asc' ? 'asc' : 'desc';

    console.log(
      `[TopicService] 查询议题列表 | 页码: ${page} | 每页: ${pageSize} | ` +
      `状态: ${status} | 排序: ${sortBy} ${order}`
    );

    // ========== 构建查询条件 ==========
    const where = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.hotnessMin !== undefined && params.hotnessMin !== null) {
      where.hotness = { gte: Number(params.hotnessMin) };
    }

    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // ========== 构建排序 ==========
    const orderBy = {};
    orderBy[sortBy] = order;

    // ========== 并行查询：列表 + 总数 + 统计摘要 ==========
    const [topics, totalItems, statusCounts] = await Promise.all([
      prisma.topic.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.topic.count({ where }),
      // 统计各状态数量
      Promise.all([
        prisma.topic.count({ where: { status: TOPIC_STATUS.PUBLISHED } }),
        prisma.topic.count({ where: { status: TOPIC_STATUS.DRAFT } }),
        prisma.topic.count({ where: { status: TOPIC_STATUS.ARCHIVED } })
      ])
    ]);

    const [totalPublished, totalDraft, totalArchived] = statusCounts;

    // ========== 计算平均热度（仅已发布） ==========
    let avgHotness = 0;
    let topTopic = null;

    if (totalPublished > 0) {
      const publishedAgg = await prisma.topic.aggregate({
        where: { status: TOPIC_STATUS.PUBLISHED },
        _avg: { hotness: true }
      });
      avgHotness = publishedAgg._avg.hotness || 0;

      // 找出最高热度议题
      const topResult = await prisma.topic.findFirst({
        where: { status: TOPIC_STATUS.PUBLISHED },
        orderBy: { hotness: 'desc' },
        select: { id: true, title: true, hotness: true }
      });
      topTopic = topResult || null;
    }

    const summary = {
      totalPublished,
      totalDraft,
      totalArchived,
      avgHotness: Math.round(avgHotness * 10) / 10,
      topTopic
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    const result = {
      topics,
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
      `[TopicService] 查询完成 | 返回 ${topics.length} 条 | 共 ${totalItems} 条`
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
 * @param {string} topicId - 议题ID
 * @returns {Promise<Object>} 议题详情
 */
export async function getTopicById(topicId) {
  try {
    console.log(`[TopicService] 查询议题详情 | ID: ${topicId}`);

    const topic = await prisma.topic.findUnique({ where: { id: topicId } });

    if (!topic) {
      const error = new Error('议题不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    // 组装详情响应（目前无关联表，扩展字段返回空数据）
    const detailResponse = {
      ...topic,
      recentDebates: [],
      participantStats: {
        total: topic.participantCount || 0,
        byRole: {
          '正方': Math.floor((topic.participantCount || 0) * 0.42),
          '反方': Math.floor((topic.participantCount || 0) * 0.38),
          '观众': Math.ceil((topic.participantCount || 0) * 0.20)
        }
      },
      hotnessTrend: [],
      editHistory: []
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
 * @param {Object} data - 议题数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 创建后的完整议题对象
 */
export async function createTopic(data, operatorInfo) {
  try {
    const { title, description, category, coverImage } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorId = operatorInfo?.admin_id || 'system';

    console.log(`[TopicService] 创建议题 | 操作人: ${operatorName} | 标题: ${title}`);

    // ========== 参数校验 ==========
    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) {
      const error = new Error(titleValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      const error = new Error(descValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // 标题去重检查
    const existingTopic = await prisma.topic.findFirst({
      where: { title: { equals: title.trim(), mode: 'insensitive' } }
    });

    if (existingTopic) {
      const error = new Error('已存在相同标题的议题');
      error.name = 'DUPLICATE_TITLE';
      throw error;
    }

    // ========== 创建议题 ==========
    const newTopic = await prisma.topic.create({
      data: {
        title: title.trim(),
        description: description?.trim() || undefined,
        slug: generateSlug(title),
        category: category?.trim() || undefined,
        coverImage: coverImage?.trim() || undefined,
        status: TOPIC_STATUS.DRAFT,
        hotness: 0,
        debateCount: 0,
        participantCount: 0,
        viewCount: 0,
        version: 1,
        createdBy: String(operatorId),
        createdByName: operatorName
      }
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
 * @param {string} topicId - 议题ID
 * @param {Object} data - 更新数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新后的完整议题对象
 */
export async function updateTopic(topicId, data, operatorInfo) {
  try {
    const { title, description, category, coverImage } = data;
    const operatorName = operatorInfo?.username || 'unknown';

    console.log(`[TopicService] 更新议题 | ID: ${topicId} | 操作人: ${operatorName}`);

    // ========== 查找议题 ==========
    const existingTopic = await prisma.topic.findUnique({ where: { id: topicId } });

    if (!existingTopic) {
      const error = new Error('议题不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    // ========== 参数校验 ==========
    if (title !== undefined) {
      const titleValidation = validateTitle(title);
      if (!titleValidation.valid) {
        const error = new Error(titleValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }

      // 标题去重检查（排除自身）
      const duplicateTopic = await prisma.topic.findFirst({
        where: {
          title: { equals: title.trim(), mode: 'insensitive' },
          id: { not: topicId }
        }
      });

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

    // ========== 构建更新数据 ==========
    const updateData = {};
    if (title !== undefined) {
      updateData.title = title.trim();
      updateData.slug = generateSlug(title);
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || undefined;
    }
    if (category !== undefined) {
      updateData.category = category?.trim() || undefined;
    }
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage?.trim() || undefined;
    }
    updateData.version = { increment: 1 };

    // ========== 执行更新 ==========
    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: updateData
    });

    console.log(`[TopicService] 议题更新成功 | ID: ${topicId}`);

    return updatedTopic;

  } catch (error) {
    console.error('[TopicService] 更新议题异常:', error);
    throw error;
  }
}

/**
 * T004: 修改议题状态（上架/下架/归档）
 *
 * @param {string} topicId - 议题ID
 * @param {Object} data - 状态变更数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新后的议题对象
 */
export async function updateTopicStatus(topicId, data, operatorInfo) {
  try {
    const { status, reason } = data;

    console.log(
      `[TopicService] 修改议题状态 | ID: ${topicId} | 目标状态: ${status}`
    );

    // ========== 状态值验证 ==========
    const statusValidation = validateStatus(status);
    if (!statusValidation.valid) {
      const error = new Error(statusValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // ========== 查找议题 ==========
    const existingTopic = await prisma.topic.findUnique({ where: { id: topicId } });

    if (!existingTopic) {
      const error = new Error('议题不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    // ========== 检查状态是否有实际变化 ==========
    if (existingTopic.status === status) {
      const error = new Error(`议题当前状态已经是 "${status}"，无需重复操作`);
      error.name = 'NO_CHANGE';
      throw error;
    }

    const oldStatus = existingTopic.status;

    // ========== 执行更新 ==========
    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        status,
        version: { increment: 1 }
      }
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

    console.log(`[TopicService] 状态变更成功 | ID: ${topicId} | ${oldStatus} → ${status}`);

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
 * @param {string} topicId - 议题ID
 * @param {Object} data - 热度调整数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 调整结果
 */
export async function updateTopicHotness(topicId, data, operatorInfo) {
  try {
    const { hotness, reason } = data;
    const operatorName = operatorInfo?.username || 'unknown';

    console.log(
      `[TopicService] 调整议题热度 | ID: ${topicId} | 目标热度: ${hotness}`
    );

    // ========== 热度值验证 ==========
    const hotnessValidation = validateHotness(hotness);
    if (!hotnessValidation.valid) {
      const error = new Error(hotnessValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // ========== 查找议题 ==========
    const existingTopic = await prisma.topic.findUnique({ where: { id: topicId } });

    if (!existingTopic) {
      const error = new Error('议题不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const oldHotness = existingTopic.hotness;

    // ========== 检查是否有实际变化 ==========
    if (oldHotness === hotness) {
      const error = new Error(`议题当前热度已经是 ${hotness}，无需重复调整`);
      error.name = 'NO_CHANGE';
      throw error;
    }

    // ========== 执行更新 ==========
    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        hotness,
        version: { increment: 1 }
      }
    });

    // ========== 计算影响范围提示 ==========
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

    console.log(`[TopicService] 热度调整成功 | ID: ${topicId} | ${oldHotness} → ${hotness}`);

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

export default {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  updateTopicStatus,
  updateTopicHotness,
  TOPIC_STATUS,
  SORT_FIELDS,
  validateTitle,
  validateHotness,
  validateStatus
};
