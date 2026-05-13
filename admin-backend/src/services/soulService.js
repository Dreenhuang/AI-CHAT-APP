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
 * - 使用 Prisma ORM 操作 PostgreSQL 数据库
 * - aiConfig 和 usageStats 存储为 JSON 字段
 * - 所有写操作使用 await 确保完成
 */

import prisma from '../lib/prisma.js';

// ============================================
// 常量定义
// ============================================

export const SOUL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

export const AI_MODELS = {
  MINIMAX: 'minimax',
  DEEPSEEK: 'deepseek',
  GPT: 'gpt',
  CLAUDE: 'claude'
};

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

// ============================================
// 辅助工具函数
// ============================================

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

function validateCategory(category) {
  const validCategories = Object.values(SOUL_CATEGORIES);
  if (!category || typeof category !== 'string') {
    return { valid: false, message: '分类为必填字段' };
  }
  if (!validCategories.includes(category)) {
    return { valid: false, message: `无效的分类值，必须是以下之一: ${validCategories.join(', ')}` };
  }
  return { valid: true, message: '分类值有效' };
}

function validateSoulStatus(status) {
  const validStatuses = [SOUL_STATUS.ACTIVE, SOUL_STATUS.INACTIVE];
  if (!validStatuses.includes(status)) {
    return { valid: false, message: `无效的状态值，必须是以下之一: ${validStatuses.join(', ')}` };
  }
  return { valid: true, message: '状态值有效' };
}

function validateModel(model) {
  const validModels = Object.values(AI_MODELS);
  if (!validModels.includes(model)) {
    return { valid: false, message: `无效的AI模型，必须是以下之一: ${validModels.join(', ')}` };
  }
  return { valid: true, message: '模型值有效' };
}

function validateTemperature(temperature) {
  if (typeof temperature !== 'number' || isNaN(temperature)) {
    return { valid: false, message: '温度参数必须是数字' };
  }
  if (temperature < 0 || temperature > 1) {
    return { valid: false, message: '温度参数必须在0-1之间' };
  }
  return { valid: true, message: '温度参数有效' };
}

function validateMaxTokens(maxTokens) {
  if (typeof maxTokens !== 'number' || isNaN(maxTokens)) {
    return { valid: false, message: '最大Token数必须是数字' };
  }
  if (maxTokens < 100 || maxTokens > 4000) {
    return { valid: false, message: '最大Token数必须在100-4000之间' };
  }
  return { valid: true, message: '最大Token数有效' };
}

function validateSystemPrompt(systemPrompt) {
  if (systemPrompt === undefined || systemPrompt === null) {
    return { valid: true, message: '系统提示词为可选字段' };
  }
  if (typeof systemPrompt !== 'string') {
    return { valid: false, message: '系统提示词必须是文本类型' };
  }
  if (systemPrompt.length > 2000) {
    return { valid: false, message: '系统提示词长度不能超过2000个字符' };
  }
  return { valid: true, message: '系统提示词格式正确' };
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

// ============================================
// 核心业务逻辑函数
// ============================================

/**
 * S001: 获取Soul角色列表（分页查询）
 *
 * @param {Object} params - 查询参数
 * @returns {Promise<{souls: Array, summary: Object, pagination: Object}>}
 */
export async function getSouls(params = {}) {
  try {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const status = params.status || 'all';
    const sortBy = params.sortBy || 'createdAt';
    const order = params.order === 'asc' ? 'asc' : 'desc';

    console.log(
      `[SoulService] 查询Soul角色列表 | 页码: ${page} | 每页: ${pageSize} | ` +
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

    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // ========== 构建排序 ==========
    const orderBy = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = order;
        break;
      case 'createdAt':
      default:
        orderBy.createdAt = order;
        break;
    }

    // ========== 并行查询：列表 + 总数 ==========
    const [souls, totalItems] = await Promise.all([
      prisma.soul.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.soul.count({ where })
    ]);

    // ========== 计算统计摘要 ==========
    const [totalActive, totalInactive, totalPreset, totalCustom] = await Promise.all([
      prisma.soul.count({ where: { status: SOUL_STATUS.ACTIVE } }),
      prisma.soul.count({ where: { status: SOUL_STATUS.INACTIVE } }),
      prisma.soul.count({ where: { isPreset: true } }),
      prisma.soul.count({ where: { isPreset: false } })
    ]);

    // 平均评分和总辩论数（从usageStats JSON字段计算）
    let avgRating = 0;
    let totalDebatesAll = 0;
    let mostPopular = null;

    const allActiveSouls = await prisma.soul.findMany({
      where: { status: SOUL_STATUS.ACTIVE },
      select: { id: true, name: true, usageStats: true }
    });

    if (allActiveSouls.length > 0) {
      let ratingSum = 0;
      let ratingCount = 0;
      let maxFavorite = -1;
      let mostPopularSoul = null;

      for (const s of allActiveSouls) {
        const usage = s.usageStats || {};
        if (usage.avgRating) {
          ratingSum += usage.avgRating;
          ratingCount++;
        }
        totalDebatesAll += usage.totalDebates || 0;

        const favCount = usage.favoriteCount || 0;
        if (favCount > maxFavorite) {
          maxFavorite = favCount;
          mostPopularSoul = { id: s.id, name: s.name, favoriteCount: favCount };
        }
      }

      avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
      mostPopular = mostPopularSoul;
    }

    const summary = {
      totalActive,
      totalInactive,
      totalPreset,
      totalCustom,
      avgRating: Math.round(avgRating * 10) / 10,
      totalDebates: totalDebatesAll,
      mostPopular
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    const result = {
      souls,
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

    console.log(`[SoulService] 查询完成 | 返回 ${souls.length} 条 | 共 ${totalItems} 条`);

    return result;

  } catch (error) {
    console.error('[SoulService] 查询Soul角色列表异常:', error);
    throw error;
  }
}

/**
 * S002: 获取Soul角色详情
 *
 * @param {string} soulId - 角色ID
 * @returns {Promise<Object>} 角色详情
 */
export async function getSoulById(soulId) {
  try {
    console.log(`[SoulService] 查询Soul角色详情 | ID: ${soulId}`);

    const soul = await prisma.soul.findUnique({ where: { id: soulId } });

    if (!soul) {
      const error = new Error('Soul角色不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    // 组装详情响应（关联数据暂无对应表，返回空值）
    const detailResponse = {
      ...soul,
      debateHistory: [],
      feedbackSummary: {
        totalFeedbacks: 0,
        positiveRate: 0,
        topPositiveComments: [],
        topNegativeComments: [],
        topSuggestions: [],
        lastFeedbackAt: null
      },
      configChangeHistory: []
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
 * @param {Object} data - 角色数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 创建后的完整角色对象
 */
export async function createSoul(data, operatorInfo) {
  try {
    const { name, category, description, avatar, aiConfig } = data;
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorId = operatorInfo?.admin_id || 'system';

    console.log(`[SoulService] 创建Soul角色 | 操作人: ${operatorName} | 名称: ${name}`);

    // ========== 参数校验 ==========
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      const error = new Error(nameValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    const categoryValidation = validateCategory(category);
    if (!categoryValidation.valid) {
      const error = new Error(categoryValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      const error = new Error(descValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // 名称去重检查
    const existingSoul = await prisma.soul.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    });

    if (existingSoul) {
      const error = new Error('已存在相同名称的角色');
      error.name = 'DUPLICATE_NAME';
      throw error;
    }

    // AI配置校验
    if (aiConfig) {
      if (aiConfig.model) {
        const modelValidation = validateModel(aiConfig.model);
        if (!modelValidation.valid) {
          const e = new Error(modelValidation.message);
          e.name = 'VALIDATION_ERROR';
          throw e;
        }
      }
      if (aiConfig.temperature !== undefined) {
        const tempValidation = validateTemperature(aiConfig.temperature);
        if (!tempValidation.valid) {
          const e = new Error(tempValidation.message);
          e.name = 'VALIDATION_ERROR';
          throw e;
        }
      }
      if (aiConfig.maxTokens !== undefined) {
        const tokensValidation = validateMaxTokens(aiConfig.maxTokens);
        if (!tokensValidation.valid) {
          const e = new Error(tokensValidation.message);
          e.name = 'VALIDATION_ERROR';
          throw e;
        }
      }
      if (aiConfig.systemPrompt !== undefined) {
        const promptValidation = validateSystemPrompt(aiConfig.systemPrompt);
        if (!promptValidation.valid) {
          const e = new Error(promptValidation.message);
          e.name = 'VALIDATION_ERROR';
          throw e;
        }
      }
    }

    // ========== 创建角色 ==========
    const newSoul = await prisma.soul.create({
      data: {
        name: name.trim(),
        avatar: avatar?.trim() || undefined,
        category,
        description: description?.trim() || undefined,
        status: SOUL_STATUS.ACTIVE,
        isPreset: false,
        createdBy: String(operatorId),
        createdByName: operatorName,
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
        }
      }
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
 * @param {string} soulId - 角色ID
 * @param {Object} data - 更新数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新后的完整角色对象
 */
export async function updateSoul(soulId, data, operatorInfo) {
  try {
    const { name, description, category, avatar, aiConfig } = data;
    const operatorName = operatorInfo?.username || 'unknown';

    console.log(`[SoulService] 更新Soul角色 | ID: ${soulId} | 操作人: ${operatorName}`);

    // ========== 查找角色 ==========
    const existingSoul = await prisma.soul.findUnique({ where: { id: soulId } });

    if (!existingSoul) {
      const error = new Error('Soul角色不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    // ========== 参数校验 ==========
    if (name !== undefined) {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        const error = new Error(nameValidation.message);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }

      const duplicateSoul = await prisma.soul.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: soulId }
        }
      });
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

    if (aiConfig) {
      if (aiConfig.model) {
        const modelValidation = validateModel(aiConfig.model);
        if (!modelValidation.valid) {
          const e = new Error(modelValidation.message);
          e.name = 'VALIDATION_ERROR';
          throw e;
        }
      }
      if (aiConfig.temperature !== undefined) {
        const tempValidation = validateTemperature(aiConfig.temperature);
        if (!tempValidation.valid) {
          const e = new Error(tempValidation.message);
          e.name = 'VALIDATION_ERROR';
          throw e;
        }
      }
      if (aiConfig.maxTokens !== undefined) {
        const tokensValidation = validateMaxTokens(aiConfig.maxTokens);
        if (!tokensValidation.valid) {
          const e = new Error(tokensValidation.message);
          e.name = 'VALIDATION_ERROR';
          throw e;
        }
      }
      if (aiConfig.systemPrompt !== undefined) {
        const promptValidation = validateSystemPrompt(aiConfig.systemPrompt);
        if (!promptValidation.valid) {
          const e = new Error(promptValidation.message);
          e.name = 'VALIDATION_ERROR';
          throw e;
        }
      }
    }

    // ========== 构建更新数据 ==========
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || undefined;
    if (category !== undefined) updateData.category = category;
    if (avatar !== undefined) updateData.avatar = avatar?.trim() || undefined;

    if (aiConfig) {
      // 合并AI配置：保留现有配置中未被更新的字段
      const currentAiConfig = existingSoul.aiConfig || {};
      updateData.aiConfig = { ...currentAiConfig, ...aiConfig };
    }

    // ========== 执行更新 ==========
    const updatedSoul = await prisma.soul.update({
      where: { id: soulId },
      data: updateData
    });

    console.log(`[SoulService] Soul角色更新成功 | ID: ${soulId} | 名称: ${updatedSoul.name}`);

    return updatedSoul;

  } catch (error) {
    console.error('[SoulService] 更新Soul角色异常:', error);
    throw error;
  }
}

/**
 * S004: 修改Soul角色状态（激活/停用）
 *
 * @param {string} soulId - 角色ID
 * @param {Object} data - 状态变更数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新后的角色对象
 */
export async function updateSoulStatus(soulId, data, operatorInfo) {
  try {
    const { status, reason } = data;

    console.log(
      `[SoulService] 修改Soul角色状态 | ID: ${soulId} | 目标状态: ${status}`
    );

    // ========== 状态值验证 ==========
    const statusValidation = validateSoulStatus(status);
    if (!statusValidation.valid) {
      const error = new Error(statusValidation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // ========== 查找角色 ==========
    const existingSoul = await prisma.soul.findUnique({ where: { id: soulId } });

    if (!existingSoul) {
      const error = new Error('Soul角色不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    // ========== 检查是否有实际变化 ==========
    if (existingSoul.status === status) {
      const error = new Error(`Soul角色当前状态已经是 "${status}"，无需重复操作`);
      error.name = 'NO_CHANGE';
      throw error;
    }

    const oldStatus = existingSoul.status;

    // ========== 执行更新 ==========
    const updatedSoul = await prisma.soul.update({
      where: { id: soulId },
      data: { status }
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

    console.log(`[SoulService] 状态变更成功 | ID: ${soulId} | ${oldStatus} → ${status}`);

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
 * @param {string} soulId - 角色ID
 * @param {Object} data - AI配置变更数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 调整结果
 */
export async function updateSoulAIConfig(soulId, data, operatorInfo) {
  try {
    const { temperature, maxTokens, systemPrompt, personality, model } = data;
    const operatorName = operatorInfo?.username || 'unknown';

    console.log(`[SoulService] 调整Soul角色AI配置 | ID: ${soulId} | 操作人: ${operatorName}`);

    // ========== 检查参数 ==========
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

    // ========== 参数校验 ==========
    if (temperature !== undefined) {
      const tempValidation = validateTemperature(temperature);
      if (!tempValidation.valid) {
        const e = new Error(tempValidation.message);
        e.name = 'VALIDATION_ERROR';
        throw e;
      }
    }

    if (maxTokens !== undefined) {
      const tokensValidation = validateMaxTokens(maxTokens);
      if (!tokensValidation.valid) {
        const e = new Error(tokensValidation.message);
        e.name = 'VALIDATION_ERROR';
        throw e;
      }
    }

    if (systemPrompt !== undefined) {
      const promptValidation = validateSystemPrompt(systemPrompt);
      if (!promptValidation.valid) {
        const e = new Error(promptValidation.message);
        e.name = 'VALIDATION_ERROR';
        throw e;
      }
    }

    if (model !== undefined) {
      const modelValidation = validateModel(model);
      if (!modelValidation.valid) {
        const e = new Error(modelValidation.message);
        e.name = 'VALIDATION_ERROR';
        throw e;
      }
    }

    // ========== 查找角色 ==========
    const existingSoul = await prisma.soul.findUnique({ where: { id: soulId } });

    if (!existingSoul) {
      const error = new Error('Soul角色不存在');
      error.name = 'NOT_FOUND';
      throw error;
    }

    const oldAiConfig = existingSoul.aiConfig || {};

    // ========== 构建新的AI配置 ==========
    const newAiConfig = {
      ...oldAiConfig,
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(personality !== undefined && { personality }),
      ...(model !== undefined && { model })
    };

    // ========== 执行更新 ==========
    const updatedSoul = await prisma.soul.update({
      where: { id: soulId },
      data: { aiConfig: newAiConfig }
    });

    // ========== 构建变更对比信息 ==========
    const changeDetails = {};

    if (temperature !== undefined && oldAiConfig.temperature !== temperature) {
      const hint = temperature <= 0.3
        ? '低温度：角色回答会更加确定和一致'
        : temperature <= 0.7
          ? '中等温度：角色会在确定性和创造性之间取得平衡'
          : '高温度：角色回答会更加多样化和有创意';
      changeDetails.temperature = { oldValue: oldAiConfig.temperature, newValue: temperature, impactHint: hint };
    }

    if (maxTokens !== undefined && oldAiConfig.maxTokens !== maxTokens) {
      const hint = maxTokens <= 500
        ? '短回复：角色会生成简短的回答'
        : maxTokens <= 1500
          ? '中等长度：角色可以给出较详细的解释'
          : '长回复：角色可以进行深入的论述和分析';
      changeDetails.maxTokens = { oldValue: oldAiConfig.maxTokens, newValue: maxTokens, impactHint: hint };
    }

    if (model !== undefined && oldAiConfig.model !== model) {
      changeDetails.model = { oldValue: oldAiConfig.model, newValue: model, impactHint: `已切换至${model}模型` };
    }

    if (systemPrompt !== undefined) {
      changeDetails.systemPrompt = { changed: true, impactHint: '系统提示词已更新，角色的行为模式将发生变化' };
    }

    if (personality !== undefined) {
      changeDetails.personality = { oldValue: oldAiConfig.personality, newValue: personality, impactHint: '性格特征描述已更新' };
    }

    console.log(`[SoulService] AI配置调整成功 | ID: ${soulId} | 变更参数: ${Object.keys(changeDetails).join(', ')}`);

    return {
      ...updatedSoul,
      _configChangeInfo: {
        changedParams: Object.keys(changeDetails),
        changes: changeDetails,
        changedAt: new Date().toISOString(),
        changedBy: operatorName,
        effectiveImmediately: true
      }
    };

  } catch (error) {
    console.error('[SoulService] 调整Soul角色AI配置异常:', error);
    throw error;
  }
}

export default {
  getSouls,
  getSoulById,
  createSoul,
  updateSoul,
  updateSoulStatus,
  updateSoulAIConfig,
  SOUL_STATUS,
  AI_MODELS,
  SOUL_CATEGORIES,
  validateName,
  validateTemperature,
  validateMaxTokens,
  validateSystemPrompt,
  validateSoulStatus
};
