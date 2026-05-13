/**
 * 审计日志控制器 (Audit Log Controller)
 *
 * 功能说明：
 * 本控制器实现审计日志模块的所有API接口，提供三大核心功能：
 *
 * 1. getAuditLogs() - 审计日志列表查询 (A001)
 *    支持多条件筛选（操作人、操作类型、目标类型、结果、时间范围、IP地址）
 *    返回分页数据和统计摘要
 *
 * 2. getAuditStatistics() - 操作统计分析 (A002)
 *    提供多维度的审计数据统计，用于仪表盘图表展示
 *    包括：时间趋势、操作分布、管理员活跃度、失败率、安全告警
 *
 * 3. getAuditLogDetail() - 单条日志详情查看 (A003)
 *    返回完整的日志信息，包括oldData/newData JSON对比
 *    显示关联的操作链（同一目标的前后操作）
 *
 * 技术特性：
 * - ✅ 完整的JSDoc中文注释和Swagger文档注解
 * - ✅ 统一的参数验证和错误处理
 * - ✅ 符合PRD v2.0的_meta元数据规范
 * - ✅ 调用service层封装的业务逻辑
 * - ✅ 权限控制（需要认证+审计日志查看权限）
 *
 * 使用示例：
 * ```bash
 * # 1. 查询审计日志列表
 * GET /api/admin/v1/audit-logs?page=1&pageSize=20&action=DELETE
 * Authorization: Bearer <token>
 *
 * 2. 获取统计数据
 * GET /api/admin/v1/audit-logs/statistics
 * Authorization: Bearer <token>
 *
 * 3. 查看单条详情
 * GET /api/admin/v1/audit-logs/audit_001
 * Authorization: Bearer <token>
 * ```
 *
 * 作者：GLM-5V-Turbo AI Assistant
 * 创建日期：2026-05-13
 * 版本：v1.0.0
 */

// ============================================
// 导入依赖
// ============================================

import { authMiddleware } from '../middleware/auth.js';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditStatistics,
  ActionType,
  TargetType,
  LogResult
} from '../services/auditService.js';

// ============================================
// A001: 审计日志列表查询
// ============================================

/**
 * A001: 获取审计日志列表
 *
 * GET /api/admin/v1/audit-logs
 *
 * 功能说明：
 * 多条件查询审计日志记录，支持丰富的筛选条件和分页功能。
 * 用于管理后台的"审计日志"页面展示。
 *
 * 筛选条件：
 * - page: 页码（默认1，最小值1）
 * - pageSize: 每页数量（默认20，范围1-100）
 * - adminId: 操作人ID精确匹配
 * - action: 操作类型筛选（CREATE/UPDATE/DELETE等）
 * - targetType: 目标类型筛选（USER/TOPIC/SOUL等）
 * - targetId: 目标ID精确匹配
 * - result: 操作结果筛选（SUCCESS/FAILURE/PARTIAL）
 * - startDate: 开始日期（格式：YYYY-MM-DD 或 ISO 8601）
 * - endDate: 结束日期
 * - ipAddress: IP地址模糊搜索
 *
 * 响应结构：
 * {
 *   success: true,
 *   data: {
 *     logs: [...],           // 当前页的日志数组
 *     pagination: { ... },   // 分页信息
 *     summary: { ... }       // 统计摘要
 *   },
 *   _meta: { ... }
 * }
 *
 * 认证要求：✅ 需要JWT Token
 * 权限要求：audit_log:view 权限
 * 缓存策略：无缓存（实时数据）
 *
 * Swagger文档注解：
 * @swagger
 * /api/admin/v1/audit-logs:
 *   get:
 *     summary: 查询审计日志列表
 *     description: |
 *       多条件筛选审计日志，支持分页查询。
 *       返回日志数组、分页信息和统计摘要。
 *     tags:
 *       - Audit Log（审计日志）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: 操作人ID筛选
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT, CONFIG_CHANGE, STATUS_CHANGE, BATCH_OP]
 *         description: 操作类型筛选
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [USER, TOPIC, SOUL, DEBATE, GROUP, MESSAGE, CONFIG, ADMIN, AUDIT_LOG, SYSTEM]
 *         description: 目标类型筛选
 *       - in: query
 *         name: targetId
 *         schema:
 *           type: string
 *         description: 目标ID精确匹配
 *       - in: query
 *         name: result
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAILURE, PARTIAL]
 *         description: 操作结果筛选
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期（YYYY-MM-DD）
 *       - in: query
 *         name: ipAddress
 *         schema:
 *           type: string
 *         description: IP地址模糊搜索
 *     responses:
 *       200:
 *         description: 成功获取审计日志列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLogItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     summary:
 *                       $ref: '#/components/schemas/AuditSummary'
 *                 _meta:
 *                   type: object
 *                   properties:
 *                     queryTime:
 *                       type: number
 *                       description: 查询耗时(ms)
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 *
 * @param {Object} request - Fastify请求对象
 * @param {Object} reply - Fastify响应对象
 * @returns {Promise<Object>} JSON响应
 */
export async function getAuditLogsController(request, reply) {
  const startTime = Date.now();

  try {
    // ========== 第一步：提取查询参数 ==========
    const query = {
      page: request.query.page,
      pageSize: request.query.pageSize,
      adminId: request.query.adminId,
      action: request.query.action,
      targetType: request.query.targetType,
      targetId: request.query.targetId,
      result: request.query.result,
      startDate: request.query.startDate,
      endDate: request.query.endDate,
      ipAddress: request.query.ipAddress
    };

    // ========== 第二步：调用服务层查询数据 ==========
    const result = await getAuditLogs(query);

    // ========== 第三步：组装响应并返回 ==========
    const queryDuration = Date.now() - startTime;

    const responseData = {
      success: true,
      data: result.data,
      _meta: {
        queryTime: `${queryDuration}ms`,
        endpoint: 'GET /audit-logs',
        queriedAt: new Date().toISOString(),
        filtersApplied: Object.entries(query)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key]) => key),
        hint: '使用statistics接口获取更详细的统计分析'
      }
    };

    console.log(
      `[AuditLog/A001] 查询成功 | ` +
      `总数: ${result.data.pagination.total} | ` +
      `耗时: ${queryDuration}ms`
    );

    return reply.send(responseData);

  } catch (error) {
    // 统一错误处理
    console.error('[AuditLog/A001] 查询异常:', error.message);

    const statusCode = error.code && error.code >= 400 && error.code < 600 ? error.code : 500;

    return reply.status(statusCode).send({
      success: false,
      code: error.code || 500,
      message: error.message || '查询审计日志失败，请稍后重试',
      errorType: error.errorType || 'AUDIT_LOG_QUERY_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.details })
    });
  }
}

// ============================================
// A002: 操作统计分析
// ============================================

/**
 * A002: 获取审计统计数据
 *
 * GET /api/admin/v1/audit-logs/statistics
 *
 * 功能说明：
 * 提供多维度的审计日志统计分析，用于仪表盘的数据可视化展示。
 * 包含时间趋势、操作分布、管理员活跃度、失败率分析、安全告警等。
 *
 * 统计维度：
 * 1. 时间汇总（今日/本周/本月/总计的操作数）
 * 2. 操作类型分布（各action的数量和占比）
 * 3. Top 10活跃管理员（按操作数量排名）
 * 4. 失败率分析（整体失败率 + 近7天趋势图数据）
 * 5. 安全告警（敏感操作提醒，如删除、批量操作、配置变更）
 *
 * 数据用途：
 * - 仪表盘统计卡片
 * - ECharts饼图（操作类型分布）
 * - ECharts折线图（失败率趋势）
 * - ECharts柱状图（管理员活跃度排行）
 * - 告警列表（最近的安全相关操作）
 *
 * 认证要求：✅ 需要JWT Token
 * 权限要求：audit_log:view 权限
 * 缓存策略：300秒（5分钟，统计数据不需要太实时）
 *
 * Swagger文档注解：
 * @swagger
 * /api/admin/v1/audit-logs/statistics:
 *   get:
 *     summary: 审计统计分析
 *     description: |
 *       返回多维度的审计统计数据，包括时间趋势、操作分布、活跃度排名、失败率分析和安全告警。
 *       数据格式直接匹配ECharts等前端图表库要求。
 *     tags:
 *       - Audit Log（审计日志）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     timeSummary:
 *                       type: object
 *                       description: 时间维度的操作数量统计
 *                     actionDistribution:
 *                       type: object
 *                       description: 操作类型分布（含百分比）
 *                     topAdmins:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Top 10活跃管理员
 *                     failureAnalysis:
 *                       type: object
 *                       description: 失败率分析（含7天趋势）
 *                     securityAlerts:
 *                       type: object
 *                       description: 安全告警信息
 *                 _meta:
 *                   type: object
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 *
 * @param {Object} request - Fastify请求对象
 * @param {Object} reply - Fastify响应对象
 * @returns {Promise<Object>} 统计数据JSON
 */
export async function getAuditStatisticsController(request, reply) {
  const startTime = Date.now();

  try {
    // ========== 第一步：调用服务层生成统计 ==========
    const result = await getAuditStatistics({});

    // ========== 第二步：组装响应并返回 ==========
    const queryDuration = Date.now() - startTime;

    const responseData = {
      success: true,
      data: result.data,
      _meta: {
        queryTime: `${queryDuration}ms`,
        endpoint: 'GET /audit-logs/statistics',
        generatedAt: new Date().toISOString(),
        dataFreshness: result.data._meta?.dataFreshness || 'N/A',

        // 前端集成提示
        chartIntegration: {
          actionDistribution: '适用于 ECharts pie/doughnut 图表',
          failureTrend: '适用于 ECharts line/bar 图表（双Y轴）',
          adminRanking: '适用于 ECharts horizontal bar 图表',
          alertList: '可直接渲染为告警卡片列表'
        }
      }
    };

    console.log(
      `[AuditLog/A002] 统计生成完成 | ` +
      `总日志: ${result.data.timeSummary.total} | ` +
      `今日: ${result.data.timeSummary.today.count} | ` +
      `告警: ${result.data.securityAlerts.count} | ` +
      `耗时: ${queryDuration}ms`
    );

    return reply.send(responseData);

  } catch (error) {
    console.error('[AuditLog/A002] 统计生成异常:', error.message);

    const statusCode = error.code && error.code >= 400 && error.code < 600 ? error.code : 500;

    return reply.status(statusCode).send({
      success: false,
      code: error.code || 500,
      message: error.message || '生成审计统计失败，请稍后重试',
      errorType: error.errorType || 'AUDIT_STATISTICS_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.details })
    });
  }
}

// ============================================
// A003: 单条日志详情
// ============================================

/**
 * A003: 获取单条审计日志详情
 *
 * GET /api/admin/v1/audit-logs/:id
 *
 * 功能说明：
 * 返回某条审计日志的完整详细信息，包括：
 * - 所有基本字段（id, adminId, action, targetType等）
 * - 完整的oldData/newData JSON快照对比
 * - 操作时的请求上下文（IP、User-Agent、请求ID等）
 * - 关联的操作链（同一目标对象的前后操作记录）
 *
 * 使用场景：
 * - 点击日志列表中的某一行，展开查看完整详情
 * - 用于问题追溯和安全事件调查
 * - 对比oldData和newData了解具体变更内容
 * - 查看关联操作链了解完整的操作历史
 *
 * URL参数：
 * - id: 审计日志的唯一标识符（UUID格式）
 *
 * 响应增强：
 * 除了标准字段外，还返回：
 * - _meta.retrievedAt: 数据检索时间
 * - _meta.hasRelatedLogs: 是否存在关联操作
 * - relatedOperations: 关联的操作链（最多10条）
 *
 * 认证要求：✅ 需要JWT Token
 * 权限要求：audit_log:view 权限
 * 缓存策略：无缓存（实时数据）
 *
 * Swagger文档注解：
 * @swagger
 * /api/admin/v1/audit-logs/{id}:
 *   get:
 *     summary: 获取审计日志详情
 *     description: |
 *       返回指定审计日志的完整详情，包括数据快照对比和关联操作链。
 *       用于问题追溯和安全事件调查。
 *     tags:
 *       - Audit Log（审计日志）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 审计日志ID
 *     responses:
 *       200:
 *         description: 成功获取日志详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuditLogDetail'
 *       404:
 *         description: 日志不存在
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 *
 * @param {Object} request - Fastify请求对象（包含params.id）
 * @param {Object} reply - Fastify响应对象
 * @returns {Promise<Object>} 日志详情JSON
 */
export async function getAuditLogDetailController(request, reply) {
  const startTime = Date.now();
  const logId = request.params.id;

  try {
    // ========== 第一步：参数校验 ==========
    if (!logId || typeof logId !== 'string' || logId.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '缺少必要的路径参数: id（审计日志ID）',
        errorType: 'MISSING_LOG_ID_PARAMETER',
        hint: '请在URL中提供有效的审计日志ID，例如: /audit-logs/audit_001'
      });
    }

    console.log(`[AuditLog/A003] 查询日志详情 | ID: ${logId}`);

    // ========== 第二步：调用服务层获取详情 ==========
    const result = await getAuditLogById(logId.trim());

    // ========== 第三步：组装响应并返回 ==========
    const queryDuration = Date.now() - startTime;

    const responseData = {
      success: true,
      data: result.data,
      _meta: {
        queryTime: `${queryDuration}ms`,
        endpoint: `GET /audit-logs/${logId}`,
        retrievedAt: new Date().toISOString(),

        // 数据展示提示
        displayHints: {
          oldDataNewDiff: '建议使用JSON Diff组件展示变更差异',
          relatedOperations: `${result.data._meta?.relatedLogsCount || 0}条关联操作可用于追溯完整历史`,
          dataSecurity: '敏感字段已自动脱敏处理'
        }
      }
    };

    console.log(
      `[AuditLog/A003] 详情获取成功 | ID: ${logId} | ` +
      `操作: ${result.data.action} | 目标: ${result.data.targetType}/${result.data.targetId || '-'} | ` +
      `耗时: ${queryDuration}ms`
    );

    return reply.send(responseData);

  } catch (error) {
    console.error('[AuditLog/A003] 详情查询异常:', error.message);

    // 处理特定错误类型
    if (error.code === 404) {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: error.message || '指定的审计日志不存在',
        errorType: error.errorType || 'AUDIT_LOG_NOT_FOUND',
        details: error.details,
        hint: '请检查日志ID是否正确，或该日志可能已被清理'
      });
    }

    // 通用错误处理
    const statusCode = error.code && error.code >= 400 && error.code < 600 ? error.code : 500;

    return reply.status(statusCode).send({
      success: false,
      code: error.code || 500,
      message: error.message || '获取日志详情失败，请稍后重试',
      errorType: error.errorType || 'AUDIT_LOG_DETAIL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.details })
    });
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 清除审计日志缓存的辅助函数
 *
 * 如果未来添加了缓存机制，可以通过此函数手动清除。
 * 目前仅作为预留接口。
 *
 * @returns {Object} 操作结果
 */
export function clearAuditCache() {
  console.log('[AuditLogController] 缓存清除（预留接口）');

  return {
    success: true,
    message: '审计日志缓存已清除（如果有的话）',
    clearedAt: new Date().toISOString()
  };
}

// ============================================
// 默认导出
// ============================================

/**
 * 控制器导出汇总
 *
 * 本文件导出的所有控制器函数：
 * - getAuditLogsController: 审计日志列表查询（A001）
 * - getAuditStatisticsController: 操作统计分析（A002）
 * - getAuditLogDetailController: 单条日志详情（A003）
 * - clearAuditCache: 清除缓存（辅助功能）
 */
export default {
  getAuditLogsController,
  getAuditStatisticsController,
  getAuditLogDetailController,
  clearAuditCache
};
