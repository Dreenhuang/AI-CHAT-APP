/**
 * Soul角色管理控制器 (Soul Controller)
 *
 * 功能说明：
 * 处理所有与Soul角色管理相关的HTTP请求，包括：
 * - S001: 获取Soul角色列表（分页、筛选、排序）
 * - S002: 获取Soul角色详情（含完整配置和历史统计）
 * - S003: 创建新Soul角色
 * - S003(续): 编辑现有Soul角色
 * - S004: 修改角色状态（激活/停用）
 * - S005: 调整AI参数配置
 *
 * 控制器职责：
 * 1. 从请求对象中提取参数（query/body/params）
 * 2. 提取操作人信息（从request.user，由auth中间件注入）
 * 3. 调用服务层函数执行业务逻辑
 * 4. 将服务层返回的数据包装成标准HTTP响应
 * 5. 统一错误处理和日志记录
 *
 * 设计原则：
 * - 控制器保持"薄"：只做参数提取和响应组装，不包含复杂业务逻辑
 * - 错误处理标准化：统一使用 { success, code, message, errorType } 格式
 * - 日志记录完整：每个操作都有清晰的入口和出口日志
 */

import soulService from '../services/soulService.js';

// ============================================
// 辅助工具函数
// ============================================

/**
 * 提取客户端IP地址
 *
 * @param {Object} request - Fastify请求对象
 * @returns {string} IP地址字符串
 */
function getClientIP(request) {
  return request.ip ||
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.headers['x-real-ip'] ||
    'unknown';
}

/**
 * 构建操作人信息对象
 *
 * 从request.user中提取操作人相关信息，
 * 用于审计日志记录和权限检查
 *
 * @param {Object} request - Fastify请求对象
 * @returns {Object} 操作人信息
 */
function getOperatorInfo(request) {
  return {
    admin_id: request.user?.admin_id,
    username: request.user?.username,
    role: request.user?.role,
    permissions: request.user?.permissions,
    ip: getClientIP(request),
    userAgent: request.headers['user-agent']
  };
}

// ============================================
// S001: Soul角色列表控制器
// ============================================

/**
 * 获取Soul角色列表 (GET /souls)
 *
 * API端点: GET /api/admin/v1/souls
 *
 * 查询参数 (Query Parameters):
 *   - page:        页码（默认1）
 *   - pageSize:    每页条数（默认20，最大100）
 *   - status:      状态筛选 active/inactive/all（默认all）
 *   - category:    分类筛选（哲学家/企业家/科学家等）
 *   - search:      关键词搜索（名称/描述）
 *   - sortBy:      排序字段 name/createdAt/totalDebates/avgRating（默认createdAt）
 *   - order:       排序方向 asc/desc（默认desc）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "data": {
 *     "souls": [...],           // 当前页的角色数组
 *     "summary": { ... },        // 统计摘要
 *     "pagination": { ... }      // 分页信息
 *   }
 * }
 *
 * 使用示例:
 *   GET /api/admin/v1/souls?status=active&sortBy=avgRating&order=desc&page=1&pageSize=10
 */
export async function getSoulsList(request, reply) {
  try {
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[SoulController] 获取Soul角色列表 | 操作人: ${operatorInfo.username || 'anonymous'}`
    );

    // ========== 从query中提取查询参数 ==========
    const queryParams = {
      page: parseInt(request.query.page) || 1,
      pageSize: parseInt(request.query.pageSize) || 20,
      status: request.query.status,
      category: request.query.category,
      search: request.query.search,
      sortBy: request.query.sortBy,
      order: request.query.order
    };

    // ========== 调用服务层获取数据 ==========
    const result = await soulService.getSouls(queryParams);

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '获取Soul角色列表成功',
      data: result
    });

  } catch (error) {
    console.error('[SoulController] 获取Soul角色列表异常:', error);
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '获取Soul角色列表失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// S002: Soul角色详情控制器
// ============================================

/**
 * 获取Soul角色详情 (GET /souls/:id)
 *
 * API端点: GET /api/admin/v1/souls/:id
 *
 * 路径参数:
 *   - id: 角色ID（必填）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "...",
 *     "name": "...",
 *     ...基本字段,
 *     "aiConfig": { ... },          // 完整AI配置
 *     "usageStats": { ... },        // 使用统计
 *     "debateHistory": [...],       // 历史辩论表现
 *     "feedbackSummary": {...},     // 用户反馈摘要
 *     "configChangeHistory": [...]  // 配置变更历史
 *   }
 * }
 *
 * 错误响应 (404):
 * { "success": false, "message": "Soul角色不存在" }
 */
export async function getSoulDetail(request, reply) {
  try {
    const { id } = request.params;
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[SoulController] 获取Soul角色详情 | ID: ${id} | ` +
      `操作人: ${operatorInfo.username || 'anonymous'}`
    );

    // ========== 参数校验 ==========
    if (!id || id.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '角色ID不能为空',
        errorType: 'MISSING_PARAMETER'
      });
    }

    // ========== 调用服务层获取详情 ==========
    const soulDetail = await soulService.getSoulById(id.trim());

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '获取Soul角色详情成功',
      data: soulDetail
    });

  } catch (error) {
    console.error('[SoulController] 获取Soul角色详情异常:', error);

    // 处理特定错误类型
    if (error.name === 'NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || 'Soul角色不存在',
        errorType: 'SOUL_NOT_FOUND'
      });
    }

    // 默认服务器错误
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '获取Soul角色详情失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// S003: 创建Soul角色控制器
// ============================================

/**
 * 创建新Soul角色 (POST /souls)
 *
 * API端点: POST /api/admin/v1/souls
 *
 * 请求体 (Body):
 * {
 *   "name": "角色名称",           // 必填，2-50字符
 *   "category": "哲学家",          // 必填，分类
 *   "description": "角色简介",     // 可选，0-500字符
 *   "avatar": "头像URL",           // 可选
 *   "aiConfig": {                  // 可选，有默认值
 *     "model": "minimax",         // AI模型
 *     "temperature": 0.7,         // 温度0-1
 *     "maxTokens": 1500,          // 最大Token100-4000
 *     "systemPrompt": "提示词...", // 最长2000字符
 *     "personality": "性格描述"
 *   }
 * }
 *
 * 成功响应 (201):
 * {
 *   "success": true,
 *   "message": "Soul角色创建成功",
 *   "data": { ...创建后的完整角色对象... },
 *   "hints": {
 *     "nextStep": "可以调用 PATCH /souls/:id/ai-config 调整AI参数以优化角色表现"
 *   }
 * }
 *
 * 错误响应 (400):
 * - 名称格式不正确或重复
 * - AI参数校验失败
 *
 * 权限要求: super_admin, admin（observer无权创建）
 */
export async function createNewSoul(request, reply) {
  try {
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[SoulController] 创建新Soul角色 | 操作人: ${operatorInfo.username} | 角色: ${operatorInfo.role}`
    );

    // ========== 从body中提取数据 ==========
    const { name, category, description, avatar, aiConfig } = request.body;

    // ========== 基础参数存在性检查 ==========
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '角色名称为必填项，且不能为空',
        errorType: 'MISSING_NAME'
      });
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '分类为必填项，请选择一个有效的分类',
        errorType: 'MISSING_CATEGORY'
      });
    }

    // ========== 调用服务层创建角色 ==========
    const newSoul = await soulService.createSoul(
      { name, category, description, avatar, aiConfig },
      operatorInfo
    );

    // ========== 返回201 Created响应 ==========
    return reply.status(201).send({
      success: true,
      message: 'Soul角色创建成功（默认状态为已激活）',
      data: newSoul,
      hints: {
        nextStep: '可以调用 PATCH /souls/:id/ai-config 调整AI参数以优化角色表现',
        tip: '建议先在测试辩论中观察角色表现，再根据需要调整参数'
      }
    });

  } catch (error) {
    console.error('[SoulController] 创建Soul角色异常:', error);

    // 处理特定错误类型
    if (error.name === 'VALIDATION_ERROR') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'VALIDATION_ERROR'
      });
    }

    if (error.name === 'DUPLICATE_NAME') {
      return reply.status(409).send({
        success: false,
        code: 409,
        message: error.message,
        errorType: 'DUPLICATE_RESOURCE'
      });
    }

    // 默认服务器错误
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '创建Soul角色失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// S003 (续): 更新Soul角色控制器
// ============================================

/**
 * 更新现有Soul角色 (PUT /souls/:id)
 *
 * API端点: PUT /api/admin/v1/souls/:id
 *
 * 路径参数:
 *   - id: 角色ID（必填）
 *
 * 请求体 (Body):
 * {
 *   "name": "新名称",             // 可选，2-50字符
 *   "description": "新描述",        // 可选，0-500字符
 *   "category": "新分类",           // 可选
 *   "avatar": "新头像URL",          // 可选
 *   "aiConfig": { ... }            // 可选，完整替换AI配置
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "Soul角色更新成功",
 *   "data": { ...更新后的完整角色对象... }
 * }
 *
 * 错误响应:
 * - 400: 参数验证失败
 * - 404: 角色不存在
 * - 403: 无权修改预设角色的某些字段（仅admin受限）
 * - 409: 名称重复
 *
 * 权限要求: super_admin, admin
 * 注意: admin角色不能修改预设角色的name和category字段
 */
export async function updateExistingSoul(request, reply) {
  try {
    const { id } = request.params;
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[SoulController] 更新Soul角色 | ID: ${id} | ` +
      `操作人: ${operatorInfo.username}`
    );

    // ========== 参数校验 ==========
    if (!id || id.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '角色ID不能为空',
        errorType: 'MISSING_PARAMETER'
      });
    }

    // ========== 从body中提取更新数据 ==========
    const { name, description, category, avatar, aiConfig } = request.body;

    // 至少提供一个更新字段
    const hasUpdateField = name !== undefined ||
      description !== undefined ||
      category !== undefined ||
      avatar !== undefined ||
      aiConfig !== undefined;

    if (!hasUpdateField) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '至少需要提供一个要更新的字段',
        errorType: 'NO_UPDATE_FIELDS'
      });
    }

    // ========== 调用服务层更新角色 ==========
    const updatedSoul = await soulService.updateSoul(
      id.trim(),
      { name, description, category, avatar, aiConfig },
      operatorInfo
    );

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: 'Soul角色更新成功',
      data: updatedSoul
    });

  } catch (error) {
    console.error('[SoulController] 更新Soul角色异常:', error);

    // 处理特定错误类型
    if (error.name === 'NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || 'Soul角色不存在',
        errorType: 'SOUL_NOT_FOUND'
      });
    }

    if (error.name === 'PRESET_PROTECTED') {
      return reply.status(403).send({
        success: false,
        code: 403,
        message: error.message,
        errorType: 'PRESET_PROTECTED',
        details: {
          hint: '预设角色的核心属性受保护，只有超级管理员可以修改。您可以尝试修改description、avatar或aiConfig字段'
        }
      });
    }

    if (error.name === 'VALIDATION_ERROR') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'VALIDATION_ERROR'
      });
    }

    if (error.name === 'DUPLICATE_NAME') {
      return reply.status(409).send({
        success: false,
        code: 409,
        message: error.message,
        errorType: 'DUPLICATE_RESOURCE'
      });
    }

    // 默认服务器错误
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '更新Soul角色失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// S004: 修改角色状态控制器
// ============================================

/**
 * 修改Soul角色发布状态 (PATCH /souls/:id/status)
 *
 * API端点: PATCH /api/admin/v1/souls/:id/status
 *
 * 功能说明：
 * - active: 激活状态（可选列表中可见，可被选择参与辩论）
 * - inactive: 停用状态（前端不可见但保留数据和配置）
 *
 * 路径参数:
 *   - id: 角色ID（必填）
 *
 * 请求体 (Body):
 * {
 *   "status": "active",     // 必填: active/inactive
 *   "reason": "停用原因"   // 可选: 变更原因说明
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "Soul角色已激活，将出现在可选列表中",
 *   "data": { ...更新后的角色对象... },
 *   "_meta": {
 *     "previousStatus": "inactive",
 *     "newStatus": "active",
 *     "changedAt": "2026-05-13T...",
 *     "operator": "admin"
 *   }
 * }
 *
 * 权限要求: super_admin, admin（observer无权操作）
 */
export async function changeSoulStatus(request, reply) {
  try {
    const { id } = request.params;
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[SoulController] 修改Soul角色状态 | ID: ${id} | ` +
      `操作人: ${operatorInfo.username}`
    );

    // ========== 参数校验 ==========
    if (!id || id.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '角色ID不能为空',
        errorType: 'MISSING_PARAMETER'
      });
    }

    const { status, reason } = request.body;

    if (!status) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: 'status为必填字段，必须指定目标状态（active/inactive）',
        errorType: 'MISSING_STATUS'
      });
    }

    // ========== 调用服务层修改状态 ==========
    const result = await soulService.updateSoulStatus(
      id.trim(),
      { status, reason },
      operatorInfo
    );

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: result._message || `Soul角色状态已变更为 "${status}"`,
      data: result,
      _meta: {
        previousStatus: result._previousStatus,
        newStatus: result.status,
        changedAt: result.updatedAt,
        operator: operatorInfo.username
      }
    });

  } catch (error) {
    console.error('[SoulController] 修改Soul角色状态异常:', error);

    // 处理特定错误类型
    if (error.name === 'NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || 'Soul角色不存在',
        errorType: 'SOUL_NOT_FOUND'
      });
    }

    if (error.name === 'NO_CHANGE') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'NO_STATUS_CHANGE',
        hint: '当前状态已是目标状态，无需重复操作'
      });
    }

    if (error.name === 'VALIDATION_ERROR') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'VALIDATION_ERROR'
      });
    }

    // 默认服务器错误
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '修改Soul角色状态失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// S005: 调整AI参数配置控制器
// ============================================

/**
 * 调整Soul角色AI参数 (PATCH /souls/:id/ai-config)
 *
 * API端点: PATCH /api/admin/v1/souls/:id/ai-config
 *
 * 功能说明：
 * - 单独修改AI配置参数，不需要更新整个角色对象
 * - 支持修改：temperature、maxTokens、systemPrompt、personality、model
 * - 所有参数变更都会被记录到审计日志
 * - 参数修改后下次辩论立即生效
 *
 * 路径参数:
 *   - id: 角色ID（必填）
 *
 * 请求体 (Body):
 * {
 *   "temperature": 0.8,              // 可选: 新温度值（0-1）
 *   "maxTokens": 1500,               // 可选: 新最大Token数（100-4000）
 *   "systemPrompt": "新提示词...",   // 可选: 新系统提示词（最长2000字符）
 *   "personality": "新性格描述",     // 可选: 新性格特征
 *   "model": "deepseek"             // 可选: 切换AI模型
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "AI配置调整成功",
 *   "data": { ...角色对象... },
 *   "_configChangeInfo": {
 *     "changedParams": ["temperature", "maxTokens"],
 *     "changes": {
 *       "temperature": {
 *         "oldValue": 0.7,
 *         "newValue": 0.8,
 *         "impactHint": "中等温度..."
 *       },
 *       "maxTokens": { ... }
 *     },
 *     "changedAt": "2026-05-13T...",
 *     "changedBy": "admin",
 *     "effectiveImmediately": true
 *   }
 * }
 *
 * 权限要求: super_admin, admin（observer无权操作）
 */
export async function adjustSoulAIConfig(request, reply) {
  try {
    const { id } = request.params;
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[SoulController] 调整Soul角色AI配置 | ID: ${id} | ` +
      `操作人: ${operatorInfo.username} | 角色: ${operatorInfo.role}`
    );

    // ========== 参数校验 ==========
    if (!id || id.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '角色ID不能为空',
        errorType: 'MISSING_PARAMETER'
      });
    }

    // ========== 从body中提取AI配置变更数据 ==========
    const { temperature, maxTokens, systemPrompt, personality, model } = request.body;

    // ========== 调用服务层调整AI配置 ==========
    const result = await soulService.updateSoulAIConfig(
      id.trim(),
      { temperature, maxTokens, systemPrompt, personality, model },
      operatorInfo
    );

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: `AI配置调整成功 (${result._configChangeInfo.changedParams.join(', ')})`,
      data: result,
      _configChangeInfo: result._configChangeInfo
    });

  } catch (error) {
    console.error('[SoulController] 调整Soul角色AI配置异常:', error);

    // 处理特定错误类型
    if (error.name === 'NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || 'Soul角色不存在',
        errorType: 'SOUL_NOT_FOUND'
      });
    }

    if (error.name === 'NO_UPDATE_PARAMS') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'NO_UPDATE_PARAMS',
        hint: '至少需要提供一个要更新的AI参数（temperature/maxTokens/systemPrompt/personality/model）'
      });
    }

    if (error.name === 'VALIDATION_ERROR') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'VALIDATION_ERROR',
        hint: '请检查参数范围：temperature(0-1), maxTokens(100-4000), systemPrompt(≤2000字符)'
      });
    }

    // 默认服务器错误
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '调整AI配置失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// 默认导出所有控制器函数
// ============================================

export default {
  // 列表和详情
  getSoulsList,        // S001: GET /souls
  getSoulDetail,       // S002: GET /souls/:id

  // 创建和编辑
  createNewSoul,       // S003: POST /souls
  updateExistingSoul,  // S003: PUT /souls/:id

  // 状态管理
  changeSoulStatus,    // S004: PATCH /souls/:id/status

  // AI配置管理
  adjustSoulAIConfig   // S005: PATCH /souls/:id/ai-config
};
