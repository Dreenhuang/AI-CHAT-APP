/**
 * 系统配置管理控制器 (Config Controller)
 *
 * 功能说明：
 * 处理所有与系统配置相关的HTTP请求，包括：
 * - C001: 获取配置项列表（分页、筛选、搜索）
 * - C002: 获取单个配置详情（支持脱敏/明文显示）
 * - C003: 更新单个配置值（权限控制、审计日志）
 * - C004: 批量更新配置（原子操作）
 * - C005: 重置配置为默认值
 * - 获取配置变更历史
 *
 * 技术实现：
 * - 控制器层模式：只负责请求解析和响应组装，业务逻辑委托给Service层
 * - 统一错误处理：捕获Service层异常并转换为标准HTTP响应
 * - 权限信息传递：从JWT token中提取角色信息传递给Service
 *
 * 请求流程：
 * HTTP Request → Route (参数验证) → Controller (请求解析)
 * → Service (业务逻辑) → Controller (响应组装) → HTTP Response
 */

import configService from '../services/configService.js';

// ============================================
// 辅助函数：构建操作人信息对象
// ============================================

/**
 * 从Fastify request对象中提取操作人信息
 *
 * @param {Object} request - Fastify请求对象
 * @returns {Object} 操作人信息
 */
function extractOperatorInfo(request) {
  return {
    username: request.user?.username || 'unknown',
    admin_id: request.user?.admin_id || null,
    role: request.user?.role || 'unknown',
    ip: request.ip || request.headers['x-forwarded-for'] || 'unknown'
  };
}

// ============================================
// C001: 获取配置项列表
// ============================================

/**
 * 获取配置项列表
 *
 * GET /api/admin/v1/configs
 *
 * 需要认证：✅ 是（所有已登录角色均可访问）
 *
 * 查询参数 (Query):
 * - type: 配置类型筛选（all/api_key/feature_flag/ai_param/rate_limit/system/third_party/security/notification）
 * - search: 搜索关键词（匹配键名和描述）
 * - isSensitive: 敏感性过滤（true/false/all）
 * - page: 页码（默认1）
 * - pageSize: 每页条数（默认20，最大100）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "获取配置列表成功",
 *   "data": {
 *     "configs": [...],           // 配置数组
 *     "typeStats": {...},         // 各类型统计
 *     "pagination": {...}         // 分页信息
 *   }
 * }
 *
 * 使用示例：
 * ```bash
 * # 获取所有API Key配置
 * curl http://localhost:9450/api/admin/v1/configs?type=api_key \
 *   -H "Authorization: Bearer <token>"
 *
 * # 搜索包含"minimax"的配置
 * curl "http://localhost:9450/api/admin/v1/configs?search=minimax" \
 *   -H "Authorization: Bearer <token>"
 * ```
 */
export async function getConfigsList(request, reply) {
  try {
    // ========== 提取查询参数 ==========
    const params = {
      type: request.query.type,
      search: request.query.search,
      isSensitive: request.query.isSensitive,
      page: parseInt(request.query.page) || undefined,
      pageSize: parseInt(request.query.pageSize) || undefined
    };

    console.log(
      `[ConfigController] 收到配置列表请求 | ` +
      `用户: ${request.user?.username} | 角色: ${request.user?.role}`
    );

    // ========== 调用服务层 ==========
    const result = await configService.getConfigs(params);

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '获取配置列表成功',
      data: result
    });

  } catch (error) {
    console.error('[ConfigController] 获取配置列表异常:', error);

    // 根据错误类型返回不同的HTTP状态码
    if (error.name === 'VALIDATION_ERROR') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'VALIDATION_ERROR'
      });
    }

    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// C002: 获取单个配置详情
// ============================================

/**
 * 获取单个配置详情
 *
 * GET /api/admin/v1/configs/:key
 *
 * 需要认证：✅ 是（所有已登录角色均可访问）
 *
 * 路径参数 (Params):
 * - key: 配置键名（如 "ai.minimax.api_key"）
 *
 * 查询参数 (Query):
 * - reveal: 是否显示敏感值的明文（true/false，默认false，需要super_admin权限）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "获取配置详情成功",
 *   "data": {
 *     "id": "...",
 *     "configKey": "ai.minimax.api_key",
 *     "configValue": "sk-xxxx...",       // 原始值（敏感时需谨慎展示）
 *     "maskedValue": "sk-****xxxx",      // 脱敏后的值（推荐前端使用此字段）
 *     "configType": "AI_API_KEY",
 *     "description": "MiniMax API密钥...",
 *     "isSensitive": true,
 *     ...
 *   }
 * }
 *
 * 安全提示：
 * - 敏感配置的configValue字段包含明文，但前端应优先使用maskedValue字段
 * - 只有super_admin通过reveal=true才能看到完整的明文值
 */
export async function getConfigDetail(request, reply) {
  try {
    const configKey = request.params.key;
    const reveal = request.query.reveal === 'true' || request.query.reveal === true;

    console.log(
      `[ConfigController] 收到配置详情请求 | ` +
      `配置: ${configKey} | 显示明文: ${reveal} | ` +
      `用户: ${request.user?.username} | 角色: ${request.user?.role}`
    );

    // ========== 调用服务层 ==========
    const result = await configService.getConfigByKey(configKey, {
      reveal,
      requesterRole: request.user?.role
    });

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '获取配置详情成功',
      data: result
    });

  } catch (error) {
    console.error('[ConfigController] 获取配置详情异常:', error);

    if (error.name === 'CONFIG_NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message,
        errorType: 'CONFIG_NOT_FOUND',
        hint: '请检查配置键名是否正确，可通过列表接口查看所有可用配置'
      });
    }

    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// C003: 更新单个配置值
// ============================================

/**
 * 更新单个配置值
 *
 * PUT /api/admin/v1/configs/:key
 *
 * 需要认证：✅ 是
 * 权限要求：
 *   - super_admin: 可以修改所有配置（包括敏感配置）
 *   - admin: 只能修改非敏感配置
 *   - observer: 无法修改任何配置
 *
 * 路径参数 (Params):
 * - key: 配置键名
 *
 * 请求体 (Body):
 * {
 *   "value": any,          // 新的配置值（必填）
 *   "reason": "string"     // 修改原因（可选，但建议填写，会记录到审计日志）
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "配置更新成功",
 *   "data": {
 *     "config": {...},              // 更新后的完整配置对象
 *     "changeLog": {                // 变更日志
 *       "action": "UPDATED",
 *       "oldValue": "...",
 *       "newValue": "...",
 *       "changedAt": "...",
 *       "changedBy": "admin"
 *     },
 *     "_notice": "..."             // 特殊提示（如有）
 *   }
 * }
 *
 * 错误响应:
 * - 400: 参数验证失败 / 值没有变化
 * - 403: 权限不足
 * - 404: 配置不存在
 * - 500: 服务器错误
 */
export async function updateSingleConfig(request, reply) {
  try {
    const configKey = request.params.key;
    const { value, reason } = request.body;
    const operatorInfo = extractOperatorInfo(request);

    console.log(
      `[ConfigController] 收到配置更新请求 | ` +
      `配置: ${configKey} | 用户: ${operatorInfo.username} | 角色: ${operatorInfo.role}`
    );

    // ========== 参数基本验证 ==========
    if (value === undefined || value === null) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '缺少必要参数: value（配置值不能为空）',
        errorType: 'MISSING_PARAMETER',
        hint: '请求体必须包含 value 字段'
      });
    }

    // ========== 调用服务层执行更新 ==========
    const result = await configService.updateConfig(configKey, { value, reason }, operatorInfo);

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '配置更新成功',
      data: result
    });

  } catch (error) {
    console.error('[ConfigController] 更新配置异常:', error);

    // 根据不同的错误类型返回相应的HTTP状态码和提示信息
    if (error.name === 'CONFIG_NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message,
        errorType: 'CONFIG_NOT_FOUND'
      });
    }

    if (error.name === 'INSUFFICIENT_PERMISSION') {
      return reply.status(403).send({
        success: false,
        code: 403,
        message: error.message,
        errorType: 'INSUFFICIENT_PERMISSION',
        details: error.details
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

    if (error.name === 'NO_CHANGE') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'NO_CHANGE',
        hint: '配置值与当前值相同，无需重复修改'
      });
    }

    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// C004: 批量更新配置
// ============================================

/**
 * 批量更新配置
 *
 * PUT /api/admin/v1/configs/batch
 *
 * 需要认证：✅ 是
 * 权限要求：仅 super_admin（因为可能涉及敏感配置）
 *
 * 请求体 (Body):
 * {
 *   "items": [                          // 要更新的配置数组（必填）
 *     {
 *       "key": "ai.minimax.model",     // 配置键名（必填）
 *       "value": "MiniMax-M2.7",        // 新值（必填）
 *       "reason": "升级模型版本"         // 修改原因（可选）
 *     },
 *     {
 *       "key": "feature.debate.enable",
 *       "value": "true",
 *       "reason": "重新启用辩论功能"
 *     }
 *   ]
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "批量更新完成",
 *   "data": {
 *     "results": [                      // 每个配置的更新结果
 *       {
 *         "success": true,
 *         "key": "ai.minimax.model",
 *         "oldValue": "...",
 *         "newValue": "..."
 *       },
 *       ...
 *     ],
 *     "summary": {                      // 汇总信息
 *       "totalRequested": 2,
 *       "successCount": 2,
 *       "failCount": 0,
 *       "atomicOperation": true,        // 表示原子操作
 *       "operatedAt": "..."
 *     }
 *   }
 * }
 *
 * 重要特性：
 * ✅ 原子性：要么全部成功，要么全部失败（自动回滚）
 * ✅ 数量限制：单次最多20个配置项
 * ✅ 完整审计：每个变更都会记录到审计日志
 *
 * 使用场景：
 * - 批量切换功能开关（如维护模式关闭多个功能）
 * - 环境迁移时批量导入配置
 * - 批量更新API Key（切换服务商时）
 */
export async function batchUpdateConfigs(request, reply) {
  try {
    const { items } = request.body;
    const operatorInfo = extractOperatorInfo(request);

    console.log(
      `[ConfigController] 收到批量更新请求 | ` +
      `数量: ${items?.length || 0} 个 | ` +
      `用户: ${operatorInfo.username} | 角色: ${operatorInfo.role}`
    );

    // ========== 参数基本验证 ==========
    if (!Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '缺少必要参数: items（更新列表不能为空）',
        errorType: 'MISSING_PARAMETER',
        hint: '请求体必须包含 items 数组，格式: { items: [{ key, value, reason }] }'
      });
    }

    // ========== 调用服务层执行批量更新 ==========
    const result = await configService.batchUpdateConfigs(items, operatorInfo);

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: `批量更新完成（${result.summary.successCount}/${result.summary.totalRequested} 成功）`,
      data: result
    });

  } catch (error) {
    console.error('[ConfigController] 批量更新异常:', error);

    if (error.name === 'INVALID_PARAMS' || error.name === 'TOO_MANY_ITEMS') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: error.name
      });
    }

    if (error.name === 'CONFIG_NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message,
        errorType: 'CONFIG_NOT_FOUND'
      });
    }

    if (error.name === 'INSUFFICIENT_PERMISSION') {
      return reply.status(403).send({
        success: false,
        code: 403,
        message: error.message,
        errorType: 'INSUFFICIENT_PERMISSION'
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

    if (error.name === 'BATCH_UPDATE_ROLLED_BACK') {
      return reply.status(409).send({  // 409 Conflict
        success: false,
        code: 409,
        message: error.message,
        errorType: 'BATCH_UPDATE_ROLLED_BACK',
        partialResults: error.partialResults,
        hint: '由于部分更新失败，已自动回滚所有更改，请检查后重试'
      });
    }

    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// C005: 重置配置为默认值
// ============================================

/**
 * 重置配置为默认值
 *
 * POST /api/admin/v1/configs/:key/reset
 *
 * 需要认证：✅ 是
 * 权限要求：仅 super_admin（重要操作！）
 *
 * 路径参数 (Params):
 * - key: 配置键名
 *
 * 请求体 (Body):
 * {
 *   "reason": "string"    // 重置原因（可选，但强烈建议填写）
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "配置已重置为默认值",
 *   "data": {
 *     "config": {...},                    // 重置后的完整配置对象
 *     "resetLog": {                       // 重置日志
 *       "action": "RESET_TO_DEFAULT",
 *       "previousValue": "...",           // 重置前的值
 *       "restoredToDefault": "...",       // 恢复到的默认值
 *       "resetAt": "...",
 *       "resetBy": "admin",
 *       "versionChange": "3 → 4"
 *     },
 *     "_notice": "配置已恢复为系统默认值。如果这是误操作，可以通过更新接口改回之前的值。"
 *   }
 * }
 *
 * ⚠️ 安全警告：
 * - 此操作不可逆（虽然可以通过更新接口手动恢复）
 * - 会影响系统运行状态（特别是功能开关类配置）
 * - 必须记录审计日志以备追溯
 * - 某些安全关键配置不允许重置
 *
 * 不允许重置的配置：
 * - security.password_min_length（密码最小长度）
 * - security.max_login_attempts（最大登录尝试次数）
 * - security.session_timeout（会话超时时间）
 */
export async function resetConfig(request, reply) {
  try {
    const configKey = request.params.key;
    const { reason } = request.body || {};
    const operatorInfo = extractOperatorInfo(request);

    console.log(
      `[ConfigController] 收到配置重置请求 | ` +
      `配置: ${configKey} | 用户: ${operatorInfo.username} | 角色: ${operatorInfo.role}` +
      (reason ? ` | 原因: ${reason}` : '')
    );

    // ========== 调用服务层执行重置 ==========
    const result = await configService.resetConfigToDefault(configKey, { reason }, operatorInfo);

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '配置已重置为默认值',
      data: result
    });

  } catch (error) {
    console.error('[ConfigController] 重置配置异常:', error);

    if (error.name === 'CONFIG_NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message,
        errorType: 'CONFIG_NOT_FOUND'
      });
    }

    if (error.name === 'INSUFFICIENT_PERMISSION') {
      return reply.status(403).send({
        success: false,
        code: 403,
        message: error.message,
        errorType: 'INSUFFICIENT_PERMISSION',
        details: error.details
      });
    }

    if (error.name === 'RESET_NOT_ALLOWED') {
      return reply.status(403).send({
        success: false,
        code: 403,
        message: error.message,
        errorType: 'RESET_NOT_ALLOWED',
        hint: error.hint
      });
    }

    if (error.name === 'ALREADY_DEFAULT') {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: error.message,
        errorType: 'ALREADY_DEFAULT',
        hint: '当前值已经是默认值，无需重置'
      });
    }

    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// 获取配置变更历史
// ============================================

/**
 * 获取配置变更历史
 *
 * GET /api/admin/v1/configs/history
 *
 * 需要认证：✅ 是（super_admin 和 admin 可访问）
 *
 * 查询参数 (Query):
 * - configKey: 配置键名（可选，不传则返回所有配置的历史）
 * - limit: 返回条数（默认50，最大200）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "获取配置历史成功",
 *   "data": [
 *     {
 *       "logId": "...",
 *       "action": "UPDATE",
 *       "operator": "admin",
 *       "configKey": "ai.minimax.model",
 *       "oldValue": "...",
 *       "newValue": "...",
 *       "ip": "192.168.1.100",
 *       "reason": "升级模型版本",
 *       "timestamp": "2026-05-13T10:30:00.000Z"
 *     },
 *     ...
 *   ]
 * }
 *
 * 使用场景：
 * - 安全审计：查看谁在什么时候修改了什么配置
 * - 问题排查：定位某个配置是何时被修改的
 * - 合规要求：满足运维操作的审计追踪需求
 */
export async function getConfigHistory(request, reply) {
  try {
    const params = {
      configKey: request.query.configKey,
      limit: parseInt(request.query.limit) || undefined
    };

    console.log(
      `[ConfigController] 收到配置历史请求 | ` +
      `配置: ${params.configKey || '全部'} | ` +
      `用户: ${request.user?.username}`
    );

    // ========== 调用服务层 ==========
    const result = await configService.getConfigHistory(params);

    // ========== 返回成功响应 ==========
    return reply.send({
      success: true,
      message: '获取配置历史成功',
      data: result
    });

  } catch (error) {
    console.error('[ConfigController] 获取配置历史异常:', error);

    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// 默认导出所有控制器函数
// ============================================

export default {
  getConfigsList,           // C001: 配置项列表
  getConfigDetail,          // C002: 单个配置详情
  updateSingleConfig,       // C003: 更新配置
  batchUpdateConfigs,       // C004: 批量更新配置
  resetConfig,              // C005: 重置配置为默认值
  getConfigHistory          // 配置变更历史
};
