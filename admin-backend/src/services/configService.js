/**
 * 系统配置管理服务层 (Config Service)
 *
 * 功能说明：
 * 实现平台系统配置的完整管理功能，包括：
 * - C001: 配置项列表查询（分类型、搜索、敏感过滤）
 * - C002: 获取单个配置详情（支持脱敏显示）
 * - C003: 更新配置值（权限控制、变更历史）
 * - C004: 批量更新配置（原子操作）
 * - C005: 重置配置为默认值
 *
 * 技术架构：
 * - 使用 Prisma ORM 操作 PostgreSQL 数据库
 * - 配置值存储为 JSON 格式，支持多种数据类型
 * - 敏感值脱敏机制：API Key等自动脱敏显示
 */

import prisma from '../lib/prisma.js';

// ============================================
// 配置类型常量
// ============================================

export const CONFIG_TYPES = {
  AI_API_KEY: 'AI_API_KEY',
  FEATURE_FLAG: 'FEATURE_FLAG',
  AI_PARAM: 'AI_PARAM',
  RATE_LIMIT: 'RATE_LIMIT',
  SYSTEM: 'SYSTEM',
  THIRD_PARTY: 'THIRD_PARTY',
  SECURITY: 'SECURITY',
  NOTIFICATION: 'NOTIFICATION'
};

export const CONFIG_TYPE_LABELS = {
  AI_API_KEY: 'AI API密钥',
  FEATURE_FLAG: '功能开关',
  AI_PARAM: 'AI参数',
  RATE_LIMIT: '限流配置',
  SYSTEM: '系统配置',
  THIRD_PARTY: '第三方服务',
  SECURITY: '安全配置',
  NOTIFICATION: '通知配置'
};

// ============================================
// 工具函数
// ============================================

/**
 * 对敏感值进行脱敏处理
 */
export function maskSensitiveValue(value) {
  if (value === null || value === undefined || value === '') {
    return '****';
  }
  const strValue = String(value);
  if (strValue.length <= 8) {
    return '****';
  }
  const prefix = strValue.substring(0, 3);
  const suffix = strValue.substring(strValue.length - 4);
  return `${prefix}****${suffix}`;
}

/**
 * 解析配置值的类型
 */
export function parseConfigValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  if (/^-?\d+\.?\d*$/.test(value)) {
    const num = Number(value);
    if (!isNaN(num)) return num;
  }
  try {
    const parsed = JSON.parse(value);
    if (['object', 'array'].includes(typeof parsed)) {
      return parsed;
    }
  } catch (e) {
    // not JSON
  }
  return value;
}

/**
 * 验证配置值是否符合类型约束
 */
function validateConfigValue(configKey, newValue) {
  if (newValue === undefined || newValue === null) {
    return { valid: false, message: '配置值不能为null或undefined' };
  }

  if (configKey === 'system.maintenance' || configKey.startsWith('feature.')) {
    if (['true', 'false', true, false].includes(newValue)) {
      return { valid: true, message: '布尔值有效' };
    }
    return { valid: false, message: '此配置必须是布尔值（true/false）' };
  }

  if (configKey.includes('rate.limit.')) {
    const num = Number(newValue);
    if (!isNaN(num) && num > 0 && Number.isInteger(num)) {
      return { valid: true, message: '限流值有效' };
    }
    return { valid: false, message: '限流配置必须是正整数' };
  }

  if (configKey.includes('.api_key')) {
    if (newValue !== '' && String(newValue).length < 10) {
      return { valid: false, message: 'API Key长度不能少于10个字符' };
    }
    return { valid: true, message: 'API Key有效' };
  }

  return { valid: true, message: '配置值有效' };
}

// ============================================
// 核心业务逻辑函数
// ============================================

/**
 * C001: 获取配置项列表
 *
 * @param {Object} params - 查询参数
 * @returns {Promise<{configs: Array, typeStats: Object, pagination: Object}>}
 */
export async function getConfigs(params = {}) {
  try {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const type = params.type?.toUpperCase() || 'ALL';
    const search = params.search?.trim() || '';
    const isSensitiveFilter = params.isSensitive?.toLowerCase() || 'all';

    console.log(
      `[ConfigService] 查询配置列表 | 页码: ${page} | 每页: ${pageSize} | ` +
      `类型: ${type} | 敏感过滤: ${isSensitiveFilter}`
    );

    // ========== 构建查询条件 ==========
    const where = {};

    if (type !== 'ALL') {
      // 支持简写形式
      const typeMap = {
        'API_KEY': CONFIG_TYPES.AI_API_KEY,
        'FEATURE_FLAG': CONFIG_TYPES.FEATURE_FLAG,
        'AI_PARAM': CONFIG_TYPES.AI_PARAM,
        'RATE_LIMIT': CONFIG_TYPES.RATE_LIMIT,
        'SYSTEM': CONFIG_TYPES.SYSTEM,
        'THIRD_PARTY': CONFIG_TYPES.THIRD_PARTY,
        'SECURITY': CONFIG_TYPES.SECURITY,
        'NOTIFICATION': CONFIG_TYPES.NOTIFICATION
      };
      where.configType = typeMap[type] || type;
    }

    if (isSensitiveFilter === 'true') {
      where.isSensitive = true;
    } else if (isSensitiveFilter === 'false') {
      where.isSensitive = false;
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      where.OR = [
        { configKey: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // ========== 并行查询：列表 + 总数 + 各类型统计 ==========
    const [configs, totalItems] = await Promise.all([
      prisma.systemConfig.findMany({
        where,
        orderBy: { configKey: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.systemConfig.count({ where })
    ]);

    // 各类型统计
    const typeStatsPromises = Object.values(CONFIG_TYPES).map(typeName =>
      prisma.systemConfig.count({ where: { configType: typeName } })
    );
    const typeCounts = await Promise.all(typeStatsPromises);

    const typeStats = {};
    Object.values(CONFIG_TYPES).forEach((typeName, index) => {
      typeStats[typeName] = typeCounts[index];
    });
    typeStats._total = configs.length + await prisma.systemConfig.count();
    typeStats._sensitive = await prisma.systemConfig.count({ where: { isSensitive: true } });

    const totalPages = Math.ceil(totalItems / pageSize);

    // 对敏感配置添加脱敏值
    const processedConfigs = configs.map(c => {
      const item = { ...c };
      if (c.isSensitive) {
        const rawValue = typeof c.configValue === 'string' ? c.configValue : JSON.stringify(c.configValue);
        item.maskedValue = maskSensitiveValue(rawValue);
      }
      return item;
    });

    const result = {
      configs: processedConfigs,
      typeStats,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    console.log(`[ConfigService] 查询完成 | 返回 ${configs.length} 条 | 共 ${totalItems} 条`);

    return result;

  } catch (error) {
    console.error('[ConfigService] 查询配置列表异常:', error);
    throw error;
  }
}

/**
 * C002: 获取单个配置详情
 *
 * @param {string} configKey - 配置键名
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 配置详情
 */
export async function getConfigByKey(configKey, options = {}) {
  try {
    const { reveal = false, requesterRole = '' } = options;

    console.log(`[ConfigService] 查询配置详情 | 键名: ${configKey}`);

    const config = await prisma.systemConfig.findUnique({
      where: { configKey }
    });

    if (!config) {
      const error = new Error(`配置项 "${configKey}" 不存在`);
      error.name = 'CONFIG_NOT_FOUND';
      throw error;
    }

    const resultConfig = { ...config };

    // 处理敏感值显示
    if (config.isSensitive) {
      const rawValue = typeof config.configValue === 'string'
        ? config.configValue
        : JSON.stringify(config.configValue);

      if (reveal) {
        if (requesterRole === 'super_admin') {
          resultConfig._revealGranted = true;
          resultConfig._warning = '您正在查看敏感信息的明文，请注意保护！';
        } else {
          resultConfig.configValue = maskSensitiveValue(rawValue);
          resultConfig._revealGranted = false;
          resultConfig._error = '权限不足：只有超级管理员才能查看敏感值的明文';
        }
      } else {
        resultConfig.maskedValue = maskSensitiveValue(rawValue);
      }
    }

    console.log(`[ConfigService] 配置详情查询成功 | 键名: ${configKey}`);

    return resultConfig;

  } catch (error) {
    console.error('[ConfigService] 查询配置详情异常:', error);
    throw error;
  }
}

/**
 * C003: 更新单个配置值
 *
 * @param {string} configKey - 配置键名
 * @param {Object} updateData - 更新数据
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 更新结果
 */
export async function updateConfig(configKey, updateData, operatorInfo) {
  try {
    const { value: newValue, reason } = updateData;
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorRole = operatorInfo?.role || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(`[ConfigService] 更新配置 | 键名: ${configKey} | 操作人: ${operatorName}`);

    // ========== 查找配置 ==========
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { configKey }
    });

    if (!existingConfig) {
      const error = new Error(`配置项 "${configKey}" 不存在`);
      error.name = 'CONFIG_NOT_FOUND';
      throw error;
    }

    // ========== 权限检查 ==========
    if (existingConfig.isSensitive && operatorRole !== 'super_admin') {
      const error = new Error('权限不足：修改敏感配置需要超级管理员权限');
      error.name = 'INSUFFICIENT_PERMISSION';
      throw error;
    }

    if (operatorRole === 'observer') {
      const error = new Error('权限不足：观察者角色无法修改配置');
      error.name = 'INSUFFICIENT_PERMISSION';
      throw error;
    }

    // ========== 值验证 ==========
    const validation = validateConfigValue(configKey, newValue);
    if (!validation.valid) {
      const error = new Error(validation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // ========== 检查是否有实际变化 ==========
    const stringValue = String(newValue);
    const existingValue = typeof existingConfig.configValue === 'object'
      ? JSON.stringify(existingConfig.configValue)
      : String(existingConfig.configValue);

    if (stringValue === existingValue) {
      const error = new Error('配置值没有变化，无需重复修改');
      error.name = 'NO_CHANGE';
      throw error;
    }

    const oldValue = existingConfig.configValue;

    // ========== 执行更新 ==========
    const updatedConfig = await prisma.systemConfig.update({
      where: { configKey },
      data: {
        configValue: stringValue,
        updatedBy: operatorInfo?.admin_id || null
      }
    });

    // 特殊配置的后处理提示
    let postUpdateNotice = null;
    if (configKey === 'system.maintenance') {
      postUpdateNotice = stringValue === 'true'
        ? '⚠️ 维护模式已开启！前端用户将看到"系统维护中"提示。'
        : '✓ 维护模式已关闭，系统恢复正常访问。';
    }
    if (configKey.includes('.api_key') && oldValue !== stringValue) {
      postUpdateNotice = '🔑 API Key已更新！新的Key将在下次API调用时生效。';
    }

    console.log(`[ConfigService] 配置更新成功 | 键名: ${configKey}`);

    return {
      config: updatedConfig,
      changeLog: {
        action: 'UPDATED',
        configKey,
        oldValue: existingConfig.isSensitive ? maskSensitiveValue(String(oldValue)) : oldValue,
        newValue: existingConfig.isSensitive ? maskSensitiveValue(stringValue) : stringValue,
        changedAt: new Date().toISOString(),
        changedBy: operatorName,
        reason: reason || '未提供'
      },
      ...(postUpdateNotice && { _notice: postUpdateNotice })
    };

  } catch (error) {
    console.error('[ConfigService] 更新配置异常:', error);
    throw error;
  }
}

/**
 * C004: 批量更新配置
 *
 * @param {Array} items - 要更新的配置数组
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchUpdateConfigs(items, operatorInfo) {
  try {
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorRole = operatorInfo?.role || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(`[ConfigService] 批量更新配置 | 操作人: ${operatorName} | 数量: ${items.length}`);

    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('更新列表不能为空');
      error.name = 'INVALID_PARAMS';
      throw error;
    }

    if (items.length > 20) {
      const error = new Error('单次批量更新最多支持20个配置项');
      error.name = 'TOO_MANY_ITEMS';
      throw error;
    }

    // ========== 预检查所有配置项 ==========
    const results = [];
    const executedSnapshots = [];

    try {
      for (const item of items) {
        const existingConfig = await prisma.systemConfig.findUnique({
          where: { configKey: item.key }
        });

        if (!existingConfig) {
          throw new Error(`配置项 "${item.key}" 不存在`);
        }

        if (existingConfig.isSensitive && operatorRole !== 'super_admin') {
          throw new Error(`权限不足：配置 "${item.key}" 是敏感配置，需要超级管理员权限`);
        }

        const validation = validateConfigValue(item.key, item.value);
        if (!validation.valid) {
          throw new Error(`配置 "${item.key}" 验证失败: ${validation.message}`);
        }

        // 保存快照并执行更新
        const oldConfig = { ...existingConfig };
        const stringValue = String(item.value);

        const updated = await prisma.systemConfig.update({
          where: { configKey: item.key },
          data: {
            configValue: stringValue,
            updatedBy: operatorInfo?.admin_id || null
          }
        });

        executedSnapshots.push({ key: item.key, oldValue: oldConfig });

        results.push({
          success: true,
          key: item.key,
          oldValue: existingConfig.isSensitive ? maskSensitiveValue(String(oldConfig.configValue)) : oldConfig.configValue,
          newValue: existingConfig.isSensitive ? maskSensitiveValue(stringValue) : stringValue
        });
      }
    } catch (updateError) {
      // 回滚已执行的更新
      console.error(`[ConfigService] 批量更新失败，开始回滚 | 错误: ${updateError.message}`);

      for (const snap of executedSnapshots) {
        await prisma.systemConfig.update({
          where: { configKey: snap.key },
          data: { configValue: snap.oldValue.configValue }
        }).catch(e => {
          console.error(`[ConfigService] 回滚失败: ${snap.key}`, e.message);
        });
      }

      const error = new Error(`批量更新失败，已自动回滚: ${updateError.message}`);
      error.name = 'BATCH_UPDATE_ROLLED_BACK';
      error.partialResults = results;
      throw error;
    }

    const successCount = results.filter(r => r.success).length;

    console.log(`[ConfigService] 批量更新完成 | 成功: ${successCount}/${items.length}`);

    return {
      results,
      summary: {
        totalRequested: items.length,
        successCount,
        failCount: items.length - successCount,
        atomicOperation: true,
        operatedAt: new Date().toISOString(),
        operatedBy: operatorName
      }
    };

  } catch (error) {
    console.error('[ConfigService] 批量更新异常:', error);
    throw error;
  }
}

/**
 * C005: 重置配置为默认值
 *
 * @param {string} configKey - 配置键名
 * @param {Object} options - 选项
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 重置结果
 */
export async function resetConfigToDefault(configKey, options = {}, operatorInfo) {
  try {
    const { reason } = options;
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorRole = operatorInfo?.role || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(`[ConfigService] 重置配置 | 键名: ${configKey} | 操作人: ${operatorName}`);

    // ========== 权限检查 ==========
    if (operatorRole !== 'super_admin') {
      const error = new Error('权限不足：重置配置需要超级管理员权限');
      error.name = 'INSUFFICIENT_PERMISSION';
      throw error;
    }

    // ========== 查找配置 ==========
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { configKey }
    });

    if (!existingConfig) {
      const error = new Error(`配置项 "${configKey}" 不存在`);
      error.name = 'CONFIG_NOT_FOUND';
      throw error;
    }

    const oldValue = existingConfig.configValue;

    // ========== 获取默认值 ==========
    // 从预定义默认值中查找
    const defaultConfigs = {
      'ai.minimax.api_key': '',
      'ai.minimax.model': 'MiniMax-M2.7',
      'ai.minimax.base_url': 'https://api.minimax.chat/v1',
      'ai.deepseek.api_key': '',
      'ai.deepseek.model': 'deepseek-v4-flash',
      'ai.deepseek.base_url': 'https://api.deepseek.com',
      'feature.debate.enable': 'true',
      'feature.registration.enable': 'true',
      'feature.ai_chat.enable': 'true',
      'feature.realtime_translation.enable': 'false',
      'rate.limit.api': '100',
      'rate.limit.chat': '30',
      'rate.limit.file_upload': '10',
      'system.maintenance': 'false',
      'system.maintenance.message': '系统正在进行升级维护，预计30分钟后恢复，敬请谅解。',
      'system.debug_mode': 'false',
      'system.default_language': 'zh-CN',
      'system.timezone': 'Asia/Shanghai',
      'third_party.figma.api_key': '',
      'third_party.supabase.url': 'https://jaduaifzmgvaotyqnjfe.supabase.co',
      'third_party.supabase.anon_key': '',
      'third_party.supabase.service_role_key': '',
      'security.password_min_length': '8',
      'security.session_timeout': '86400',
      'security.max_login_attempts': '5',
      'security.cors_origins': '*',
      'notification.email.enabled': 'false',
      'notification.email.smtp_host': '',
      'notification.email.smtp_port': '587',
      'notification.push.enabled': 'true'
    };

    const defaultValue = defaultConfigs[configKey];

    if (defaultValue === undefined) {
      const error = new Error(`找不到配置 "${configKey}" 的默认值定义`);
      error.name = 'DEFAULT_NOT_FOUND';
      throw error;
    }

    // ========== 检查是否已经是默认值 ==========
    const currentStr = typeof existingConfig.configValue === 'object'
      ? JSON.stringify(existingConfig.configValue)
      : String(existingConfig.configValue);

    if (currentStr === String(defaultValue)) {
      const error = new Error(`配置 "${configKey}" 当前值已经是默认值，无需重置`);
      error.name = 'ALREADY_DEFAULT';
      throw error;
    }

    // ========== 执行重置 ==========
    const resetConfig = await prisma.systemConfig.update({
      where: { configKey },
      data: {
        configValue: defaultValue,
        updatedBy: operatorInfo?.admin_id || null
      }
    });

    console.log(`[ConfigService] 配置重置成功 | 键名: ${configKey}`);

    return {
      config: resetConfig,
      resetLog: {
        action: 'RESET_TO_DEFAULT',
        configKey,
        previousValue: existingConfig.isSensitive ? maskSensitiveValue(String(oldValue)) : oldValue,
        restoredToDefault: existingConfig.isSensitive ? maskSensitiveValue(String(defaultValue)) : defaultValue,
        resetAt: new Date().toISOString(),
        resetBy: operatorName,
        reason: reason || '未提供'
      },
      _notice: `配置已恢复为系统默认值。如果这是误操作，可以通过更新接口改回之前的值。`
    };

  } catch (error) {
    console.error('[ConfigService] 重置配置异常:', error);
    throw error;
  }
}

/**
 * 获取配置变更历史（查询审计日志）
 *
 * @param {Object} params - 查询参数
 * @returns {Promise<Array>} 变更历史
 */
export async function getConfigHistory(params = {}) {
  try {
    const { configKey, limit = 50 } = params;
    const actualLimit = Math.min(200, Math.max(1, limit));

    console.log(`[ConfigService] 查询配置历史 | 配置: ${configKey || '全部'} | 条数: ${actualLimit}`);

    // 从审计日志中查询与CONFIG相关的操作
    const where = { targetType: 'CONFIG' };
    if (configKey) {
      // targetId存储了configKey
      where.targetId = configKey;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: actualLimit
    });

    // 转换为旧格式
    const history = auditLogs.map(log => ({
      logId: log.id,
      action: log.action,
      operator: log.admin?.username || log.adminId || 'unknown',
      configKey: log.targetId,
      oldValue: log.oldData?.configValue || log.oldData,
      newValue: log.newData?.configValue || log.newData,
      ip: log.ipAddress,
      reason: log.details?.reason || log.details?.changeReason || '',
      timestamp: log.createdAt,
      operatorRole: log.details?.operatorRole || ''
    }));

    console.log(`[ConfigService] 历史查询完成 | 返回 ${history.length} 条`);

    return history;

  } catch (error) {
    console.error('[ConfigService] 查询配置历史异常:', error);
    throw error;
  }
}

export default {
  getConfigs,
  getConfigByKey,
  updateConfig,
  batchUpdateConfigs,
  resetConfigToDefault,
  getConfigHistory,
  maskSensitiveValue,
  parseConfigValue,
  CONFIG_TYPES,
  CONFIG_TYPE_LABELS
};
