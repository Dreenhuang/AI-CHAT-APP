/**
 * 审计日志服务层 (Audit Log Service)
 *
 * 功能说明：
 * 封装审计日志的所有业务逻辑，作为控制器和数据库之间的中间层
 * 使用 Prisma ORM 操作 PostgreSQL 数据库
 *
 * 核心职责：
 * 1. 日志记录（创建审计日志条目）
 * 2. 日志查询（多条件筛选、分页、排序）
 * 3. 统计分析（操作趋势、活跃度、失败率等）
 * 4. 数据脱敏（过滤密码、Token等敏感信息）
 * 5. 辅助推断（从HTTP方法/URL自动识别操作类型）
 */

import prisma from '../lib/prisma.js';

// ============================================
// 常量定义
// ============================================

export const ActionType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  CONFIG_CHANGE: 'CONFIG_CHANGE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  BATCH_OP: 'BATCH_OP'
};

export const TargetType = {
  USER: 'USER',
  TOPIC: 'TOPIC',
  SOUL: 'SOUL',
  DEBATE: 'DEBATE',
  GROUP: 'GROUP',
  MESSAGE: 'MESSAGE',
  CONFIG: 'CONFIG',
  ADMIN: 'ADMIN',
  AUDIT_LOG: 'AUDIT_LOG',
  SYSTEM: 'SYSTEM'
};

export const LogResult = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  PARTIAL: 'PARTIAL'
};

const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'password_hash',
  'token', 'accessToken', 'access_token',
  'refreshToken', 'refresh_token',
  'secret', 'apiKey', 'api_key', 'apiKeySecret',
  'authorizationCode', 'creditCard', 'credit_card',
  'ssn', 'idNumber'
];

// ============================================
// 核心功能函数
// ============================================

/**
 * 创建审计日志
 *
 * @param {Object} params - 日志参数
 * @returns {Promise<Object>} 创建的日志对象
 */
export async function createAuditLog(params = {}) {
  try {
    const logEntry = {
      adminId: params.adminId || 'anonymous',
      action: params.action || 'UNKNOWN',
      targetType: params.targetType || 'SYSTEM',
      targetId: params.targetId || null,
      oldData: params.oldData ? filterSensitiveData(params.oldData) : null,
      newData: params.newData ? filterSensitiveData(params.newData) : null,
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || '',
      result: params.result || LogResult.SUCCESS,
      errorMessage: params.errorMessage || null,
      requestId: params.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      details: params.details || null,
      durationMs: params.durationMs || 0
    };

    const created = await prisma.auditLog.create({ data: logEntry });

    console.log(
      `[AuditService] 日志已记录 | ID: ${created.id} | ` +
      `操作: ${created.action} | 目标: ${created.targetType}/${created.targetId || '-'} | ` +
      `结果: ${created.result}`
    );

    return created;

  } catch (error) {
    console.error('[AuditService] 创建审计日志异常:', error.message);
    return null;
  }
}

/**
 * 查询审计日志列表（多条件筛选+分页）
 *
 * @param {Object} query - 查询参数
 * @returns {Promise<Object>} { success, data: { logs, pagination, summary } }
 */
export async function getAuditLogs(query = {}) {
  try {
    const {
      page = 1,
      pageSize = 20,
      adminId = '',
      action = '',
      targetType = '',
      targetId = '',
      result = '',
      startDate = '',
      endDate = '',
      ipAddress = ''
    } = query;

    const validPage = Math.max(1, parseInt(page) || 1);
    const validPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));

    console.log(
      `[AuditService] 查询审计日志 | 页码: ${validPage} | 每页: ${validPageSize}`
    );

    // ========== 构建查询条件 ==========
    const where = {};

    if (adminId && adminId.trim()) {
      where.adminId = adminId.trim();
    }

    if (action && action.trim()) {
      where.action = action.trim();
    }

    if (targetType && targetType.trim()) {
      where.targetType = targetType.trim();
    }

    if (targetId && targetId.trim()) {
      where.targetId = targetId.trim();
    }

    if (result && result.trim()) {
      where.result = result.trim();
    }

    if (ipAddress && ipAddress.trim()) {
      where.ipAddress = { contains: ipAddress.trim() };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // ========== 并行查询：列表 + 总数 ==========
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (validPage - 1) * validPageSize,
        take: validPageSize,
        include: {
          admin: {
            select: { username: true, realName: true }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(total / validPageSize);

    // 转换日志格式，添加adminName字段
    const formattedLogs = logs.map(log => ({
      id: log.id,
      adminId: log.adminId,
      adminName: log.admin?.username || log.admin?.realName || log.adminId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      oldData: log.oldData,
      newData: log.newData,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      result: log.result,
      errorMessage: log.errorMessage,
      requestId: log.requestId,
      details: log.details,
      durationMs: log.durationMs,
      createdAt: log.createdAt
    }));

    // ========== 生成统计摘要 ==========
    const summary = await generateSummaryStats(where);

    console.log(`[AuditService] 查询完成 | 总数: ${total} | 当前页: ${logs.length}条`);

    return {
      success: true,
      data: {
        logs: formattedLogs,
        pagination: { total, page: validPage, pageSize: validPageSize, totalPages },
        summary
      }
    };

  } catch (error) {
    console.error('[AuditService] 查询审计日志异常:', error.message);
    throw {
      code: 500,
      errorType: 'AUDIT_LOG_QUERY_ERROR',
      message: '查询审计日志失败，请稍后重试',
      details: error.message
    };
  }
}

/**
 * 获取单条审计日志详情
 *
 * @param {string} logId - 日志ID
 * @returns {Promise<Object>} 日志详情
 */
export async function getAuditLogById(logId) {
  try {
    console.log(`[AuditService] 获取日志详情 | ID: ${logId}`);

    const log = await prisma.auditLog.findUnique({
      where: { id: logId },
      include: {
        admin: { select: { username: true, realName: true } }
      }
    });

    if (!log) {
      throw {
        code: 404,
        errorType: 'AUDIT_LOG_NOT_FOUND',
        message: '指定的审计日志不存在',
        details: { logId }
      };
    }

    // 查找关联的操作链
    let relatedLogs = [];
    if (log.targetId) {
      relatedLogs = await prisma.auditLog.findMany({
        where: {
          targetId: log.targetId,
          targetType: log.targetType,
          id: { not: log.id }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          result: true,
          adminId: true,
          createdAt: true
        }
      });
    }

    const detail = {
      id: log.id,
      adminId: log.adminId,
      adminName: log.admin?.username || log.admin?.realName || log.adminId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      oldData: log.oldData,
      newData: log.newData,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      result: log.result,
      errorMessage: log.errorMessage,
      requestId: log.requestId,
      details: log.details,
      durationMs: log.durationMs,
      createdAt: log.createdAt,
      _meta: {
        retrievedAt: new Date().toISOString(),
        hasRelatedLogs: relatedLogs.length > 0,
        relatedLogsCount: relatedLogs.length
      },
      relatedOperations: relatedLogs.map(r => ({
        id: r.id,
        action: r.action,
        result: r.result,
        adminName: r.adminId,
        createdAt: r.createdAt
      }))
    };

    console.log(`[AuditService] 日志详情获取成功 | ID: ${logId}`);

    return { success: true, data: detail };

  } catch (error) {
    console.error('[AuditService] 获取日志详情异常:', error.message);
    if (error.code) throw error;
    throw {
      code: 500,
      errorType: 'AUDIT_LOG_DETAIL_ERROR',
      message: '获取日志详情失败',
      details: error.message
    };
  }
}

/**
 * 获取审计统计数据
 *
 * @param {Object} params - 统计参数
 * @returns {Promise<Object>} 统计数据
 */
export async function getAuditStatistics(params = {}) {
  try {
    console.log('[AuditService] 生成审计统计数据');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ========== 时间维度统计 ==========
    const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.auditLog.count()
    ]);

    const timeSummary = {
      today: { count: todayCount, date: todayStart.toISOString().split('T')[0] },
      thisWeek: { count: weekCount, startDate: weekStart.toISOString().split('T')[0], endDate: todayStart.toISOString().split('T')[0] },
      thisMonth: { count: monthCount, startDate: monthStart.toISOString().split('T')[0] },
      total: totalCount
    };

    // ========== 操作类型分布 ==========
    const actionGroups = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { id: true }
    });

    const actionDistribution = {};
    const actionDistributionPercent = {};
    actionGroups.forEach(group => {
      const action = group.action;
      const count = group._count.id;
      actionDistribution[action] = count;
      actionDistributionPercent[action] = {
        count,
        percentage: totalCount > 0 ? parseFloat(((count / totalCount) * 100).toFixed(1)) : 0
      };
    });

    // ========== 失败率统计 ==========
    const [failureCount, partialCount] = await Promise.all([
      prisma.auditLog.count({ where: { result: LogResult.FAILURE } }),
      prisma.auditLog.count({ where: { result: LogResult.PARTIAL } })
    ]);

    const overallFailureRate = totalCount > 0
      ? parseFloat(((failureCount / totalCount) * 100).toFixed(2))
      : 0;

    // 近7天失败率趋势
    const failureTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayStart);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTotal = await prisma.auditLog.count({
        where: { createdAt: { gte: date, lt: nextDate } }
      });
      const dayFailures = await prisma.auditLog.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
          result: LogResult.FAILURE
        }
      });

      failureTrend.push({
        date: date.toISOString().split('T')[0],
        total: dayTotal,
        failures: dayFailures,
        failureRate: dayTotal > 0 ? parseFloat(((dayFailures / dayTotal) * 100).toFixed(1)) : 0
      });
    }

    // ========== 管理员活跃度排名 ==========
    const adminGroups = await prisma.auditLog.groupBy({
      by: ['adminId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const topAdmins = await Promise.all(
      adminGroups.map(async (group, index) => {
        const adminInfo = await prisma.admin.findUnique({
          where: { id: group.adminId },
          select: { username: true, realName: true }
        }).catch(() => null);

        const adminSuccessCount = await prisma.auditLog.count({
          where: { adminId: group.adminId, result: LogResult.SUCCESS }
        });
        const adminFailureCount = await prisma.auditLog.count({
          where: { adminId: group.adminId, result: LogResult.FAILURE }
        });
        const lastActive = await prisma.auditLog.findFirst({
          where: { adminId: group.adminId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        const totalOps = group._count.id;
        return {
          rank: index + 1,
          adminId: group.adminId,
          adminName: adminInfo?.username || adminInfo?.realName || group.adminId,
          totalCount: totalOps,
          successCount: adminSuccessCount,
          failureCount: adminFailureCount,
          successRate: totalOps > 0 ? parseFloat(((adminSuccessCount / totalOps) * 100).toFixed(1)) : 0,
          lastActiveAt: lastActive?.createdAt?.toISOString() || null
        };
      })
    );

    // ========== 安全告警 ==========
    const sensitiveActions = [ActionType.DELETE, ActionType.BATCH_OP, ActionType.CONFIG_CHANGE];
    const sensitiveLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: sensitiveActions },
        createdAt: { gte: weekStart }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        admin: { select: { username: true, realName: true } }
      }
    });

    const alerts = sensitiveLogs.map(log => ({
      id: log.id,
      level: log.result === LogResult.FAILURE ? 'high' : 'medium',
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      adminName: log.admin?.username || log.admin?.realName || log.adminId,
      result: log.result,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
      message: generateAlertMessage(log)
    }));

    const highAlerts = alerts.filter(a => a.level === 'high').length;
    const mediumAlerts = alerts.filter(a => a.level === 'medium').length;

    // 获取最新日志用于dataFreshness
    const latestLog = await prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    const statistics = {
      timeSummary,
      actionDistribution: actionDistributionPercent,
      topAdmins,
      failureAnalysis: {
        overallFailureRate,
        totalFailures: failureCount,
        partialFailures: partialCount,
        trend: failureTrend
      },
      securityAlerts: {
        count: alerts.length,
        recentAlerts: alerts.slice(0, 20),
        alertLevels: { high: highAlerts, medium: mediumAlerts }
      },
      _meta: {
        generatedAt: new Date().toISOString(),
        dataSource: 'audit_logs表',
        dataFreshness: latestLog
          ? `最新日志: ${latestLog.createdAt.toLocaleString('zh-CN')}`
          : '暂无数据'
      }
    };

    console.log(
      `[AuditService] 统计完成 | 总日志: ${totalCount} | ` +
      `今日: ${todayCount} | 本周: ${weekCount} | 告警: ${alerts.length}`
    );

    return { success: true, data: statistics };

  } catch (error) {
    console.error('[AuditService] 生成审计统计异常:', error.message);
    throw {
      code: 500,
      errorType: 'AUDIT_STATISTICS_ERROR',
      message: '生成审计统计失败',
      details: error.message
    };
  }
}

// ============================================
// 辅助工具函数
// ============================================

/**
 * 生成列表查询的统计摘要
 */
async function generateSummaryStats(where) {
  const filteredLogs = await prisma.auditLog.findMany({
    where,
    select: { id: true, result: true, adminId: true, targetId: true }
  });

  const total = filteredLogs.length;

  if (total === 0) {
    return {
      total, successCount: 0, failureCount: 0, partialCount: 0,
      successRate: 0, uniqueAdmins: 0, uniqueTargets: 0
    };
  }

  const successCount = filteredLogs.filter(l => l.result === LogResult.SUCCESS).length;
  const failureCount = filteredLogs.filter(l => l.result === LogResult.FAILURE).length;
  const partialCount = filteredLogs.filter(l => l.result === LogResult.PARTIAL).length;

  const uniqueAdmins = new Set(filteredLogs.map(l => l.adminId)).size;
  const uniqueTargets = new Set(filteredLogs.filter(l => l.targetId).map(l => l.targetId)).size;

  return {
    total, successCount, failureCount, partialCount,
    successRate: parseFloat(((successCount / total) * 100).toFixed(1)),
    uniqueAdmins, uniqueTargets
  };
}

/**
 * 生成告警消息文本
 */
function generateAlertMessage(log) {
  const messages = {
    [ActionType.DELETE]: `执行了${log.targetType}删除操作 (${log.targetId})`,
    [ActionType.BATCH_OP]: '执行了批量操作',
    [ActionType.CONFIG_CHANGE]: '修改了系统配置'
  };

  const baseMsg = messages[log.action] || `执行了敏感操作: ${log.action}`;
  return log.result === LogResult.FAILURE
    ? `[失败] ${baseMsg} - ${log.errorMessage}`
    : baseMsg;
}

/**
 * 从HTTP方法推断操作类型
 */
export function inferActionFromMethod(method, url = '') {
  const methodActionMap = {
    'POST': ActionType.CREATE,
    'PUT': ActionType.UPDATE,
    'PATCH': ActionType.STATUS_CHANGE,
    'DELETE': ActionType.DELETE
  };

  const specialUrlPatterns = [
    { pattern: '/auth/login', action: ActionType.LOGIN },
    { pattern: '/auth/logout', action: ActionType.LOGOUT },
    { pattern: '/export', action: ActionType.EXPORT },
    { pattern: '/import', action: ActionType.IMPORT },
    { pattern: '/configs', action: ActionType.CONFIG_CHANGE },
    { pattern: '/batch', action: ActionType.BATCH_OP }
  ];

  for (const { pattern, action } of specialUrlPatterns) {
    if (url.toLowerCase().includes(pattern)) {
      return action;
    }
  }

  return methodActionMap[method.toUpperCase()] || 'UNKNOWN';
}

/**
 * 从URL路径推断目标类型
 */
export function inferTargetTypeFromUrl(url = '') {
  const urlLower = url.toLowerCase();

  const urlTargetMap = [
    { patterns: ['/users'], type: TargetType.USER },
    { patterns: ['/topics'], type: TargetType.TOPIC },
    { patterns: ['/souls'], type: TargetType.SOUL },
    { patterns: ['/debates'], type: TargetType.DEBATE },
    { patterns: ['/groups'], type: TargetType.GROUP },
    { patterns: ['/messages'], type: TargetType.MESSAGE },
    { patterns: ['/configs', '/config'], type: TargetType.CONFIG },
    { patterns: ['/admins', '/admin'], type: TargetType.ADMIN },
    { patterns: ['/audit', '/audit-logs'], type: TargetType.AUDIT_LOG }
  ];

  for (const { patterns, type } of urlTargetMap) {
    if (patterns.some(pattern => urlLower.includes(pattern))) {
      return type;
    }
  }

  return TargetType.SYSTEM;
}

/**
 * 过滤敏感数据
 */
export function filterSensitiveData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item));
  }

  const filtered = {};
  for (const key of Object.keys(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      filtered[key] = filterSensitiveData(data[key]);
    } else {
      filtered[key] = data[key];
    }
  }
  return filtered;
}

export default {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  getAuditStatistics,
  inferActionFromMethod,
  inferTargetTypeFromUrl,
  filterSensitiveData
};
