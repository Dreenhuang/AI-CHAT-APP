/**
 * 议题管理控制器 (Topic Controller)
 *
 * 功能说明：
 * 处理所有与议题管理相关的HTTP请求，包括：
 * - T001: 获取议题列表（分页、筛选、排序）
 * - T002: 获取议题详情（含关联数据）
 * - T003: 创建新议题
 * - T003(续): 编辑现有议题
 * - T004: 上架/下架议题
 * - T005: 调整议题热度
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

import topicService from '../services/topicService.js';

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
// T001: 议题列表控制器
// ============================================

/**
 * 获取议题列表 (GET /topics)
 *
 * API端点: GET /api/admin/v1/topics
 *
 * 查询参数 (Query Parameters):
 *   - page:        页码（默认1）
 *   - pageSize:    每页条数（默认20，最大100）
 *   - status:      状态筛选 published/draft/archived/all（默认all）
 *   - category:    分类筛选
 *   - hotnessMin:  最低热度过滤
 *   - search:      关键词搜索（标题/描述）
 *   - sortBy:      排序字段 hotness/createdAt/debateCount（默认createdAt）
 *   - order:       排序方向 asc/desc（默认desc）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "data": {
 *     "topics": [...],           // 当前页的议题数组
 *     "summary": { ... },        // 统计摘要
 *     "pagination": { ... }      // 分页信息
 *   }
 * }
 *
 * 使用示例:
 *   GET /api/admin/v1/topics?status=published&sortBy=hotness&order=desc&page=1&pageSize=10
 */
export async function getTopicsList(request, reply) {
  try {
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[TopicController] 获取议题列表 | 操作人: ${operatorInfo.username || 'anonymous'}`
    );

    // ========== 从query中提取查询参数 ==========
    const queryParams = {
      page: parseInt(request.query.page) || 1,
      pageSize: parseInt(request.query.pageSize) || 20,
      status: request.query.status,
      category: request.query.category,
      hotnessMin: request.query.hotnessMin !== undefined ? parseFloat(request.query.hotnessMin) : undefined,
      search: request.query.search,
      sortBy: request.query.sortBy,
      order: request.query.order
    };

    // ========== 调用服务层获取数据 ==========
    const result = await topicService.getTopics(queryParams);

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '获取议题列表成功',
      data: result
    });

  } catch (error) {
    console.error('[TopicController] 获取议题列表异常:', error);
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '获取议题列表失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// T002: 议题详情控制器
// ============================================

/**
 * 获取议题详情 (GET /topics/:id)
 *
 * API端点: GET /api/admin/v1/topics/:id
 *
 * 路径参数:
 *   - id: 议题ID（必填）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "...",
 *     "title": "...",
 *     ...基本字段,
 *     "recentDebates": [...],       // 最新辩论列表
 *     "participantStats": {...},    // 参与用户统计
 *     "hotnessTrend": [...],        // 热度趋势数据
 *     "editHistory": [...]          // 编辑历史
 *   }
 * }
 *
 * 错误响应 (404):
 * { "success": false, "message": "议题不存在" }
 */
export async function getTopicDetail(request, reply) {
  try {
    const { id } = request.params;
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[TopicController] 获取议题详情 | ID: ${id} | ` +
      `操作人: ${operatorInfo.username || 'anonymous'}`
    );

    // ========== 参数校验 ==========
    if (!id || id.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '议题ID不能为空',
        errorType: 'MISSING_PARAMETER'
      });
    }

    // ========== 调用服务层获取详情 ==========
    const topicDetail = await topicService.getTopicById(id.trim());

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '获取议题详情成功',
      data: topicDetail
    });

  } catch (error) {
    console.error('[TopicController] 获取议题详情异常:', error);

    // 处理特定错误类型
    if (error.name === 'NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || '议题不存在',
        errorType: 'TOPIC_NOT_FOUND'
      });
    }

    // 默认服务器错误
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '获取议题详情失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// T003: 创建议题控制器
// ============================================

/**
 * 创建新议题 (POST /topics)
 *
 * API端点: POST /api/admin/v1/topics
 *
 * 请求体 (Body):
 * {
 *   "title": "议题标题",           // 必填，5-100字符
 *   "description": "议题描述",      // 可选，0-500字符
 *   "category": "分类名称",         // 可选
 *   "coverImage": "图片URL"         // 可选
 * }
 *
 * 成功响应 (201):
 * {
 *   "success": true,
 *   "message": "议题创建成功",
 *   "data": { ...创建后的完整议题对象... }
 * }
 *
 * 错误响应 (400):
 * - 标题格式不正确
 * - 已存在相同标题的议题
 *
 * 权限要求: super_admin, admin（observer无权创建）
 */
export async function createNewTopic(request, reply) {
  try {
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[TopicController] 创建新议题 | 操作人: ${operatorInfo.username} | 角色: ${operatorInfo.role}`
    );

    // ========== 从body中提取数据 ==========
    const { title, description, category, coverImage } = request.body;

    // ========== 基础参数存在性检查 ==========
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '标题为必填项，且不能为空',
        errorType: 'MISSING_TITLE'
      });
    }

    // ========== 调用服务层创建议题 ==========
    const newTopic = await topicService.createTopic(
      { title, description, category, coverImage },
      operatorInfo
    );

    // ========== 返回201 Created响应 ==========
    return reply.status(201).send({
      success: true,
      message: '议题创建成功（默认状态为草稿）',
      data: newTopic,
      hints: {
        nextStep: '可以调用 PUT /topics/:id 完善详细信息，或调用 PATCH /topics/:id/status 上架发布'
      }
    });

  } catch (error) {
    console.error('[TopicController] 创建议题异常:', error);

    // 处理特定错误类型
    if (error.name === 'VALIDATION_ERROR') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'VALIDATION_ERROR'
      });
    }

    if (error.name === 'DUPLICATE_TITLE') {
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
      message: '创建议题失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// T003 (续): 更新议题控制器
// ============================================

/**
 * 更新现有议题 (PUT /topics/:id)
 *
 * API端点: PUT /api/admin/v1/topics/:id
 *
 * 路径参数:
 *   - id: 议题ID（必填）
 *
 * 请求体 (Body):
 * {
 *   "title": "新标题",             // 可选，5-100字符
 *   "description": "新描述",        // 可选，0-500字符
 *   "category": "新分类",           // 可选
 *   "coverImage": "新图片URL",      // 可选
 *   "version": 3                   // 可选但推荐，乐观锁版本号
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "议题更新成功",
 *   "data": { ...更新后的完整议题对象... }
 * }
 *
 * 错误响应:
 * - 400: 参数验证失败
 * - 404: 议题不存在
 * - 409: 版本冲突（乐观锁检测到并发修改）
 *
 * 权限要求: super_admin, admin
 */
export async function updateExistingTopic(request, reply) {
  try {
    const { id } = request.params;
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[TopicController] 更新议题 | ID: ${id} | ` +
      `操作人: ${operatorInfo.username}`
    );

    // ========== 参数校验 ==========
    if (!id || id.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '议题ID不能为空',
        errorType: 'MISSING_PARAMETER'
      });
    }

    // ========== 从body中提取更新数据 ==========
    const { title, description, category, coverImage, version } = request.body;

    // 至少提供一个更新字段
    const hasUpdateField = title !== undefined ||
      description !== undefined ||
      category !== undefined ||
      coverImage !== undefined;

    if (!hasUpdateField) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '至少需要提供一个要更新的字段',
        errorType: 'NO_UPDATE_FIELDS'
      });
    }

    // ========== 调用服务层更新议题 ==========
    const updatedTopic = await topicService.updateTopic(
      id.trim(),
      { title, description, category, coverImage, version },
      operatorInfo
    );

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '议题更新成功',
      data: updatedTopic
    });

  } catch (error) {
    console.error('[TopicController] 更新议题异常:', error);

    // 处理特定错误类型
    if (error.name === 'NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || '议题不存在',
        errorType: 'TOPIC_NOT_FOUND'
      });
    }

    if (error.name === 'VERSION_CONFLICT') {
      return reply.status(409).send({
        success: false,
        code: 409,
        message: error.message,
        errorType: 'VERSION_CONFLICT',
        details: {
          currentVersion: error.currentVersion,
          hint: '请刷新页面获取最新数据后再编辑'
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

    if (error.name === 'DUPLICATE_TITLE') {
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
      message: '更新议题失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// T004: 上架/下架议题控制器
// ============================================

/**
 * 修改议题发布状态 (PATCH /topics/:id/status)
 *
 * API端点: PATCH /api/admin/v1/topics/:id/status
 *
 * 功能说明：
 * - published → 显示在前端发现页
 * - draft → 隐藏但保留数据
 * - archived → 归档（前端不可见，保留历史记录）
 *
 * 路径参数:
 *   - id: 议题ID（必填）
 *
 * 请求体 (Body):
 * {
 *   "status": "published",     // 必填: published/draft/archived
 *   "reason": "上架原因"       // 可选: 变更原因说明
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "议题已上架，将在前端发现页显示",
 *   "data": { ...更新后的议题对象... },
 *   "_previousStatus": "draft"
 * }
 *
 * 权限要求: super_admin, admin（observer无权操作）
 */
export async function changeTopicStatus(request, reply) {
  try {
    const { id } = request.params;
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[TopicController] 修改议题状态 | ID: ${id} | ` +
      `操作人: ${operatorInfo.username}`
    );

    // ========== 参数校验 ==========
    if (!id || id.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '议题ID不能为空',
        errorType: 'MISSING_PARAMETER'
      });
    }

    const { status, reason } = request.body;

    if (!status) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: 'status为必填字段，必须指定目标状态',
        errorType: 'MISSING_STATUS'
      });
    }

    // ========== 调用服务层修改状态 ==========
    const result = await topicService.updateTopicStatus(
      id.trim(),
      { status, reason },
      operatorInfo
    );

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: result._message || `议题状态已变更为 "${status}"`,
      data: result,
      _meta: {
        previousStatus: result._previousStatus,
        newStatus: result.status,
        changedAt: result.updatedAt,
        operator: operatorInfo.username
      }
    });

  } catch (error) {
    console.error('[TopicController] 修改议题状态异常:', error);

    // 处理特定错误类型
    if (error.name === 'NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || '议题不存在',
        errorType: 'TOPIC_NOT_FOUND'
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
      message: '修改议题状态失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// T005: 调整热度控制器
// ============================================

/**
 * 手动调整议题热度 (PATCH /topics/:id/hotness)
 *
 * API端点: PATCH /api/admin/v1/topics/:id/hotness
 *
 * 功能说明：
 * - 手动设置议题的热度值（0-100）
 * - 影响前端排序和推荐算法
 * - 只有超级管理员(super_admin)有权限操作
 * - 记录完整的调整历史（旧值→新值）
 *
 * 路径参数:
 *   - id: 议题ID（必填）
 *
 * 请求体 (Body):
 * {
 *   "hotness": 85,              // 必填: 目标热度值（0-100）
 *   "reason": "该话题当前热度较高"  // 可选: 调整原因说明
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "热度调整成功",
 *   "data": { ...议题对象... },
 *   "_adjustmentInfo": {
 *     "oldValue": 65,
 *     "newValue": 85,
 *     "change": 20,
 *     "impactHint": "适度提升...",
 *     "adjustedAt": "2026-05-13T...",
 *     "adjustedBy": "admin"
 *   }
 * }
 *
 * 权限要求: 仅 super_admin（admin和observer无权操作）
 */
export async function adjustTopicHotness(request, reply) {
  try {
    const { id } = request.params;
    const operatorInfo = getOperatorInfo(request);

    console.log(
      `[TopicController] 调整议题热度 | ID: ${id} | ` +
      `操作人: ${operatorInfo.username} | 角色: ${operatorInfo.role}`
    );

    // ========== 参数校验 ==========
    if (!id || id.trim() === '') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '议题ID不能为空',
        errorType: 'MISSING_PARAMETER'
      });
    }

    const { hotness, reason } = request.body;

    if (hotness === undefined || hotness === null) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: 'hotness为必填字段，必须指定目标热度值（0-100）',
        errorType: 'MISSING_HOTNESS'
      });
    }

    // ========== 调用服务层调整热度 ==========
    const result = await topicService.updateTopicHotness(
      id.trim(),
      { hotness, reason },
      operatorInfo
    );

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: `热度调整成功 (${result._adjustmentInfo.oldValue} → ${result._adjustmentInfo.newValue})`,
      data: result,
      _adjustmentInfo: result._adjustmentInfo
    });

  } catch (error) {
    console.error('[TopicController] 调整议题热度异常:', error);

    // 处理特定错误类型
    if (error.name === 'NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || '议题不存在',
        errorType: 'TOPIC_NOT_FOUND'
      });
    }

    if (error.name === 'NO_CHANGE') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'NO_HOTNESS_CHANGE',
        hint: '当前热度已是目标值，无需重复调整'
      });
    }

    if (error.name === 'VALIDATION_ERROR') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'VALIDATION_ERROR',
        hint: '热度值必须在0-100之间'
      });
    }

    // 默认服务器错误
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '调整热度失败，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// 默认导出所有控制器函数
// ============================================

export default {
  // 列表和详情
  getTopicsList,        // T001: GET /topics
  getTopicDetail,       // T002: GET /topics/:id

  // 创建和编辑
  createNewTopic,       // T003: POST /topics
  updateExistingTopic,  // T003: PUT /topics/:id

  // 状态管理
  changeTopicStatus,    // T004: PATCH /topics/:id/status

  // 热度管理
  adjustTopicHotness    // T005: PATCH /topics/:id/hotness
};
