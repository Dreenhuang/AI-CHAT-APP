/**
 * 审计日志服务层 (Audit Log Service)
 *
 * 功能说明：
 * 封装审计日志的所有业务逻辑，作为控制器和数据库之间的中间层
 *
 * 核心职责：
 * 1. 日志记录（创建审计日志条目）
 * 2. 日志查询（多条件筛选、分页、排序）
 * 3. 统计分析（操作趋势、活跃度、失败率等）
 * 4. 数据脱敏（过滤密码、Token等敏感信息）
 * 5. 辅助推断（从HTTP方法/URL自动识别操作类型）
 *
 * 设计模式：
 * - 服务层模式 (Service Layer Pattern)
 * - 将业务逻辑从控制器中分离出来
 * - 便于单元测试和维护
 *
 * 数据模型对应 Prisma Schema：
 * model AuditLog {
 *   id, adminId, action, targetType, targetId,
 *   oldData, newData, ipAddress, userAgent,
 *   result, errorMessage, requestId, details,
 *   durationMs, createdAt
 * }
 *
 * 当前状态：
 * 使用模拟数据（内存数组）
 * 生产环境应替换为 Prisma ORM 查询 Supabase/PostgreSQL
 *
 * @module auditService
 */

// ============================================
// 常量定义
// ============================================

/**
 * 操作类型枚举（与Prisma Schema中的Action枚举一致）
 */
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

/**
 * 目标类型枚举（与Prisma Schema中的TargetType枚举一致）
 */
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

/**
 * 操作结果枚举（与Prisma Schema中的LogResult枚举一致）
 */
export const LogResult = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  PARTIAL: 'PARTIAL'
};

/**
 * 敏感字段列表（这些字段的值不应记录到oldData/newData中）
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'apiKey',
  'api_key',
  'apiKeySecret',
  'authorizationCode',
  'creditCard',
  'credit_card',
  'ssn',
  'idNumber'
];

// ============================================
// 模拟数据库（生产环境应替换为 Prisma 查询）
// ============================================

/**
 * 模拟的审计日志数据表
 *
 * 生产环境中应该从数据库读取：
 * const logs = await prisma.auditLog.findMany({ ... });
 */
const mockAuditLogs = [
  // ===== 示例日志1：管理员登录 =====
  {
    id: 'audit_001',
    adminId: 'admin_001',
    adminName: '系统管理员',
    action: ActionType.LOGIN,
    targetType: TargetType.SYSTEM,
    targetId: null,
    oldData: null,
    newData: { loginMethod: 'password', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    result: LogResult.SUCCESS,
    errorMessage: null,
    requestId: 'req_login_001',
    details: { loginDurationMs: 245 },
    durationMs: 245,
    createdAt: '2026-05-13T09:00:12.345Z'
  },

  // ===== 示例日志2：创建议题 =====
  {
    id: 'audit_002',
    adminId: 'admin_001',
    adminName: '系统管理员',
    action: ActionType.CREATE,
    targetType: TargetType.TOPIC,
    targetId: 'topic_123',
    oldData: null,
    newData: {
      title: '人工智能会取代人类工作吗？',
      description: '讨论AI对就业市场的影响和未来职业发展方向',
      category: 'tech',
      tags: ['AI', '就业', '未来']
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    result: LogResult.SUCCESS,
    errorMessage: null,
    requestId: 'req_create_topic_001',
    details: { autoPublish: true },
    durationMs: 156,
    createdAt: '2026-05-13T09:15:33.678Z'
  },

  // ===== 示例日志3：修改用户状态 =====
  {
    id: 'audit_003',
    adminId: 'admin_002',
    adminName: '运营专员',
    action: ActionType.STATUS_CHANGE,
    targetType: TargetType.USER,
    targetId: 'user_003',
    oldData: { status: 'ACTIVE', nickname: '违规用户' },
    newData: { status: 'DISABLED', reason: '发布不当言论，多次警告无效' },
    ipAddress: '120.234.56.78',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    result: LogResult.SUCCESS,
    errorMessage: null,
    requestId: 'req_status_change_001',
    details: {
      reason: '发布不当言论，多次警告无效',
      impact: { sessionsTerminated: 1, debatesInterrupted: 2 }
    },
    durationMs: 89,
    createdAt: '2026-05-13T10:22:45.123Z'
  },

  // ===== 示例日志4：批量删除议题（部分失败）=====
  {
    id: 'audit_004',
    adminId: 'admin_001',
    adminName: '系统管理员',
    action: ActionType.BATCH_OP,
    targetType: TargetType.TOPIC,
    targetId: null,
    oldData: null,
    newData: {
      operation: 'batch_delete',
      targetIds: ['topic_010', 'topic_011', 'topic_012', 'topic_013'],
      totalCount: 4
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    result: LogResult.PARTIAL,
    errorMessage: null,
    requestId: 'req_batch_delete_001',
    details: {
      successCount: 3,
      failureCount: 1,
      failedIds: ['topic_012'],
      failureReasons: { topic_012: '该议题存在进行中的辩论，无法删除' }
    },
    durationMs: 342,
    createdAt: '2026-05-13T11:05:18.987Z'
  },

  // ===== 示例日志5：修改系统配置 =====
  {
    id: 'audit_005',
    adminId: 'admin_001',
    adminName: '系统管理员',
    action: ActionType.CONFIG_CHANGE,
    targetType: TargetType.CONFIG,
    targetId: 'config_ai_temperature',
    oldData: { configKey: 'ai.temperature', configValue: 0.7, description: 'AI模型温度参数' },
    newData: { configKey: 'ai.temperature', configValue: 0.8, description: 'AI模型温度参数（提高创造性）' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    result: LogResult.SUCCESS,
    errorMessage: null,
    requestId: 'req_config_change_001',
    details: { changeReason: '提高AI回复的创造性和多样性' },
    durationMs: 67,
    createdAt: '2026-05-13T11:30:55.456Z'
  },

  // ===== 示例日志6：导出用户数据 =====
  {
    id: 'audit_006',
    adminId: 'admin_002',
    adminName: '运营专员',
    action: ActionType.EXPORT,
    targetType: TargetType.USER,
    targetId: null,
    oldData: null,
    newData: {
      exportType: 'user_list',
      format: 'xlsx',
      filters: { status: 'active', dateRange: '2026-01-01~2026-05-13' },
      recordCount: 12580
    },
    ipAddress: '120.234.56.78',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    result: LogResult.SUCCESS,
    errorMessage: null,
    requestId: 'req_export_001',
    details: {
      downloadUrl: '/exports/user_list_20260513.xlsx',
      fileSize: '2.3MB',
      expiresAt: '2026-05-14T11:35:00.000Z'
    },
    durationMs: 1234,
    createdAt: '2026-05-13T11:35:22.789Z'
  },

  // ===== 示例日志7：登录失败 =====
  {
    id: 'audit_007',
    adminId: 'admin_999',
    adminName: '未知用户',
    action: ActionType.LOGIN,
    targetType: TargetType.SYSTEM,
    targetId: null,
    oldData: null,
    newData: { username: 'hacker@test.com', loginMethod: 'password' },
    ipAddress: '45.67.89.123',
    userAgent: 'python-requests/2.28.0',
    result: LogResult.FAILURE,
    errorMessage: '用户名或密码错误',
    requestId: 'req_login_fail_001',
    details: { attemptCount: 3, locked: false },
    durationMs: 156,
    createdAt: '2026-05-13T12:10:33.456Z'
  },

  // ===== 示例日志8：删除Soul角色 =====
  {
    id: 'audit_008',
    adminId: 'admin_001',
    adminName: '系统管理员',
    action: ActionType.DELETE,
    targetType: TargetType.SOUL,
    targetId: 'soul_045',
    oldData: {
      id: 'soul_045',
      name: '激进辩手',
      personality: 'aggressive',
      specialty: '逻辑攻防',
      debateCount: 23,
      winRate: 65.2
    },
    newData: null,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    result: LogResult.SUCCESS,
    errorMessage: null,
    requestId: 'req_delete_soul_001',
    details: { reason: '角色设定不符合社区规范', cascadeDeleteDebates: true },
    durationMs: 178,
    createdAt: '2026-05-13T13:20:11.222Z'
  },

  // ===== 批量生成更多测试数据（总计100条）=====
  ...Array.from({ length: 92 }, (_, index) => {
    const actions = Object.values(ActionType);
    const targets = Object.values(TargetType);
    const results = [LogResult.SUCCESS, LogResult.SUCCESS, LogResult.SUCCESS, LogResult.FAILURE]; // 75%成功率

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    const randomResult = results[Math.floor(Math.random() * results.length)];

    // 生成随机时间（最近30天内）
    const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    return {
      id: `audit_${String(index + 9).padStart(3, '0')}`,
      adminId: `admin_${Math.floor(Math.random() * 3) + 1}`,
      adminName: [`系统管理员`, `运营专员`, `观察员`][Math.floor(Math.random() * 3)],
      action: randomAction,
      targetType: randomTarget,
      targetId: Math.random() > 0.3 ? `${randomTarget.toLowerCase()}_${String(Math.floor(Math.random() * 100)).padStart(3, '0')}` : null,
      oldData: Math.random() > 0.5 ? { snapshotBefore: `旧数据${index}` } : null,
      newData: Math.random() > 0.5 ? { snapshotAfter: `新数据${index}` } : null,
      ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      result: randomResult,
      errorMessage: randomResult === LogResult.FAILURE ? '操作失败原因模拟' : null,
      requestId: `req_auto_${String(index + 9).padStart(3, '0')}`,
      details: { autoGenerated: true },
      durationMs: Math.floor(Math.random() * 500) + 50,
      createdAt: randomDate.toISOString()
    };
  })
];

// ============================================
// 核心功能函数：创建审计日志
// ============================================

/**
 * 创建审计日志
 *
 * 功能说明：
 * 记录一条新的审计日志到数据库（或内存数组）。
 * 此函数会被中间件和其他服务调用，是审计系统的核心入口。
 *
 * @param {Object} params - 日志参数
 * @param {string} params.adminId - 操作人ID（必填）
 * @param {string} params.adminName - 操作人姓名（可选，用于展示）
 * @param {string} params.action - 操作类型（CREATE/UPDATE/DELETE等）
 * @param {string} params.targetType - 目标类型（USER/TOPIC/SOUL等）
 * @param {string} params.targetId - 目标ID（可选）
 * @param {Object} params.oldData - 操作前数据快照（可选）
 * @param {Object} params.newData - 操作后数据快照（可选）
 * @param {string} params.ipAddress - 操作IP地址
 * @param {string} params.userAgent - 浏览器User-Agent
 * @param {string} params.result - 操作结果（SUCCESS/FAILURE/PARTIAL）
 * @param {string} params.errorMessage - 错误信息（失败时填写）
 * @param {string} params.requestId - 关联的API请求ID
 * @param {Object} params.details - 额外详细信息
 * @param {number} params.durationMs - 操作耗时（毫秒）
 *
 * @returns {Promise<Object>} 创建的日志对象
 *
 * 使用示例：
 * await createAuditLog({
 *   adminId: request.user.admin_id,
 *   action: 'UPDATE',
 *   targetType: 'USER',
 *   targetId: 'user_123',
 *   oldData: { status: 'ACTIVE' },
 *   newData: { status: 'DISABLED' },
 *   ipAddress: request.ip,
 *   result: 'SUCCESS'
 * });
 */
export async function createAuditLog(params = {}) {
  try {
    // ========== 第一步：参数处理和默认值 ==========
    const logEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      adminId: params.adminId || 'system',
      adminName: params.adminName || '系统',
      action: params.action || 'UNKNOWN',
      targetType: params.targetType || 'SYSTEM',
      targetId: params.targetId || null,

      // 敏感数据过滤（重要安全措施）
      oldData: params.oldData ? filterSensitiveData(params.oldData) : null,
      newData: params.newData ? filterSensitiveData(params.newData) : null,

      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || '',
      result: params.result || LogResult.SUCCESS,
      errorMessage: params.errorMessage || null,
      requestId: params.requestId || generateRequestId(),
      details: params.details || null,
      durationMs: params.durationMs || 0,
      createdAt: new Date().toISOString()
    };

    // ========== 第二步：写入存储 ==========
    // TODO: 生产环境使用 Prisma 写入数据库
    // return await prisma.auditLog.create({ data: logEntry });

    // 当前写入内存数组（模拟）
    mockAuditLogs.unshift(logEntry);  // 新日志插入到数组开头

    // 限制内存数组大小（防止内存泄漏）
    if (mockAuditLogs.length > 10000) {
      mockAuditLogs.splice(10000);
    }

    // ========== 第三步：输出日志 ==========
    console.log(
      `[AuditService] 日志已记录 | ID: ${logEntry.id} | ` +
      `操作: ${logEntry.action} | 目标: ${logEntry.targetType}/${logEntry.targetId || '-'} | ` +
      `结果: ${logEntry.result} | 操作人: ${logEntry.adminName}`
    );

    return logEntry;

  } catch (error) {
    console.error('[AuditService] 创建审计日志异常:', error.message);

    // 审计日志记录失败不应阻断主流程，返回null表示失败
    return null;
  }
}

// ============================================
// 核心功能函数：查询审计日志列表（A001）
// ============================================

/**
 * 查询审计日志列表（多条件筛选+分页）
 *
 * 功能说明：
 * 支持多维度查询审计日志，用于管理后台的审计日志列表页面。
 * 提供丰富的筛选条件和灵活的分页排序功能。
 *
 * @param {Object} query - 查询参数
 * @param {number} query.page - 页码（默认1）
 * @param {number} query.pageSize - 每页数量（默认20，最大100）
 * @param {string} query.adminId - 操作人ID筛选
 * @param {string} query.action - 操作类型筛选
 * @param {string} query.targetType - 目标类型筛选
 * @param {string} query.targetId - 目标ID精确匹配
 * @param {string} query.result - 操作结果筛选（SUCCESS/FAILURE/PARTIAL）
 * @param {string} query.startDate - 开始日期（YYYY-MM-DD或ISO格式）
 * @param {string} query.endDate - 结束日期
 * @param {string} query.ipAddress - IP地址模糊搜索
 *
 * @returns {Promise<Object>} { logs: Array, pagination: Object, summary: Object }
 *
 * 使用示例：
 * const result = await getAuditLogs({
 *   page: 1,
 *   pageSize: 20,
 *   action: 'DELETE',
 *   startDate: '2026-05-01',
 *   endDate: '2026-05-13'
 * });
 */
export async function getAuditLogs(query = {}) {
  try {
    // ========== 第一步：参数解析和默认值 ==========
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

    // 参数校验和规范化
    const validPage = Math.max(1, parseInt(page) || 1);
    const validPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));

    console.log(
      `[AuditService] 查询审计日志 | 页码: ${validPage} | 每页: ${validPageSize} | ` +
      `操作类型: ${action || '全部'} | 目标类型: ${targetType || '全部'}`
    );

    // ========== 第二步：数据筛选 ==========
    let filteredLogs = [...mockAuditLogs];

    // 2.1 按操作人ID筛选
    if (adminId && adminId.trim()) {
      filteredLogs = filteredLogs.filter(log => log.adminId === adminId.trim());
    }

    // 2.2 按操作类型筛选
    if (action && action.trim()) {
      filteredLogs = filteredLogs.filter(log => log.action === action.trim());
    }

    // 2.3 按目标类型筛选
    if (targetType && targetType.trim()) {
      filteredLogs = filteredLogs.filter(log => log.targetType === targetType.trim());
    }

    // 2.4 按目标ID精确匹配
    if (targetId && targetId.trim()) {
      filteredLogs = filteredLogs.filter(log => log.targetId === targetId.trim());
    }

    // 2.5 按操作结果筛选
    if (result && result.trim()) {
      filteredLogs = filteredLogs.filter(log => log.result === result.trim());
    }

    // 2.6 按IP地址模糊搜索
    if (ipAddress && ipAddress.trim()) {
      const ipKeyword = ipAddress.trim();
      filteredLogs = filteredLogs.filter(log =>
        log.ipAddress && log.ipAddress.includes(ipKeyword)
      );
    }

    // 2.7 按时间范围筛选
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date();

      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.createdAt);
        return logDate >= start && logDate <= end;
      });
    }

    // ========== 第三步：排序（按时间倒序，最新的在前）==========
    filteredLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ========== 第四步：计算分页信息 ==========
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / validPageSize);
    const offset = (validPage - 1) * validPageSize;
    const paginatedLogs = filteredLogs.slice(offset, offset + validPageSize);

    // ========== 第五步：生成统计摘要 ==========
    const summary = generateSummaryStats(filteredLogs);

    // ========== 第六步：返回结果 ==========
    console.log(
      `[AuditService] 查询完成 | 总数: ${total} | ` +
      `当前页: ${paginatedLogs.length}条 | 总页数: ${totalPages}`
    );

    return {
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          total,
          page: validPage,
          pageSize: validPageSize,
          totalPages
        },
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

// ============================================
// 核心功能函数：获取单条日志详情（A003）
// ============================================

/**
 * 获取单条审计日志的完整详情
 *
 * 功能说明：
 * 返回某条日志的完整信息，包括完整的oldData/newData JSON对比，
 * 用于审计详情页面展示。
 *
 * @param {string} logId - 日志ID
 * @returns {Promise<Object>} 完整的日志详情对象
 *
 * @throws {Object} 日志不存在时抛出404错误
 */
export async function getAuditLogById(logId) {
  try {
    console.log(`[AuditService] 获取日志详情 | ID: ${logId}`);

    // ========== 第一步：查找日志 ==========
    const log = mockAuditLogs.find(l => l.id === logId);

    if (!log) {
      console.warn(`[AuditService] 日志不存在 | ID: ${logId}`);
      throw {
        code: 404,
        errorType: 'AUDIT_LOG_NOT_FOUND',
        message: '指定的审计日志不存在',
        details: { logId }
      };
    }

    // ========== 第二步：查找关联的操作链（同一目标的前后操作）==========
    let relatedLogs = [];

    if (log.targetId) {
      relatedLogs = mockAuditLogs
        .filter(l =>
          l.targetId === log.targetId &&
          l.targetType === log.targetType &&
          l.id !== log.id
        )
        .slice(0, 10)  // 最多显示10条关联日志
        .map(l => ({
          id: l.id,
          action: l.action,
          result: l.result,
          adminName: l.adminName,
          createdAt: l.createdAt
        }));
    }

    // ========== 第三步：组装详情响应 ==========
    const detail = {
      ...log,

      // 增强信息
      _meta: {
        retrievedAt: new Date().toISOString(),
        hasRelatedLogs: relatedLogs.length > 0,
        relatedLogsCount: relatedLogs.length
      },

      // 关联的操作链
      relatedOperations: relatedLogs
    };

    console.log(`[AuditService] 日志详情获取成功 | ID: ${logId}`);

    return {
      success: true,
      data: detail
    };

  } catch (error) {
    console.error('[AuditService] 获取日志详情异常:', error.message);

    if (error.code) {
      throw error;
    }

    throw {
      code: 500,
      errorType: 'AUDIT_LOG_DETAIL_ERROR',
      message: '获取日志详情失败',
      details: error.message
    };
  }
}

// ============================================
// 核心功能函数：审计统计分析（A002）
// ============================================

/**
 * 获取审计统计数据
 *
 * 功能说明：
 * 提供多维度的审计统计分析，用于仪表盘图表展示。
 * 包括：
 * - 时间维度的操作数量统计（今日/本周/本月）
 * - 操作类型分布（各action占比饼图）
 * - 管理员活跃度排名（Top 10）
 * - 失败率趋势
 * - 敏感操作告警
 *
 * @param {Object} params - 统计参数（预留扩展）
 * @returns {Promise<Object>} 统计数据对象
 */
export async function getAuditStatistics(params = {}) {
  try {
    console.log('[AuditService] 生成审计统计数据');

    const now = new Date();

    // ========== 第一步：时间范围计算 ==========
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());  // 今天零点
    const weekStart = new Date(todayStart);  // 本周一
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);  // 本月1号

    // ========== 第二步：基础统计 ==========
    const allLogs = [...mockAuditLogs];
    const todayLogs = allLogs.filter(l => new Date(l.createdAt) >= todayStart);
    const weekLogs = allLogs.filter(l => new Date(l.createdAt) >= weekStart);
    const monthLogs = allLogs.filter(l => new Date(l.createdAt) >= monthStart);

    // ========== 第三步：按操作类型分布 ==========
    const actionDistribution = {};
    allLogs.forEach(log => {
      actionDistribution[log.action] = (actionDistribution[log.action] || 0) + 1;
    });

    // 转换为百分比格式（用于饼图）
    const actionDistributionPercent = {};
    Object.entries(actionDistribution).forEach(([action, count]) => {
      actionDistributionPercent[action] = {
        count,
        percentage: parseFloat(((count / allLogs.length) * 100).toFixed(1))
      };
    });

    // ========== 第四步：管理员活跃度排名（Top 10）==========
    const adminActivity = {};
    allLogs.forEach(log => {
      if (!adminActivity[log.adminId]) {
        adminActivity[log.adminId] = {
          adminId: log.adminId,
          adminName: log.adminName,
          totalCount: 0,
          successCount: 0,
          failureCount: 0,
          lastActiveAt: log.createdAt
        };
      }

      adminActivity[log.adminId].totalCount++;
      if (log.result === LogResult.SUCCESS) adminActivity[log.adminId].successCount++;
      if (log.result === LogResult.FAILURE) adminActivity[log.adminId].failureCount++;

      // 更新最后活跃时间
      if (new Date(log.createdAt) > new Date(adminActivity[log.adminId].lastActiveAt)) {
        adminActivity[log.adminId].lastActiveAt = log.createdAt;
      }
    });

    // 排序并取Top 10
    const topAdmins = Object.values(adminActivity)
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 10)
      .map((admin, index) => ({
        rank: index + 1,
        ...admin,
        successRate: parseFloat(((admin.successCount / admin.totalCount) * 100).toFixed(1))
      }));

    // ========== 第五步：失败率统计 ==========
    const failureCount = allLogs.filter(l => l.result === LogResult.FAILURE).length;
    const partialCount = allLogs.filter(l => l.result === LogResult.PARTIAL).length;
    const overallFailureRate = allLogs.length > 0
      ? parseFloat(((failureCount / allLogs.length) * 100).toFixed(2))
      : 0;

    // 最近7天的失败率趋势（用于折线图）
    const failureTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayStart);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLogs = allLogs.filter(l => {
        const logDate = new Date(l.createdAt);
        return logDate >= date && logDate < nextDate;
      });

      const dayFailures = dayLogs.filter(l => l.result === LogResult.FAILURE).length;
      const dayTotal = dayLogs.length;

      failureTrend.push({
        date: date.toISOString().split('T')[0],
        total: dayTotal,
        failures: dayFailures,
        failureRate: dayTotal > 0 ? parseFloat(((dayFailures / dayTotal) * 100).toFixed(1)) : 0
      });
    }

    // ========== 第六步：敏感操作告警 ==========
    const sensitiveActions = [ActionType.DELETE, ActionType.BATCH_OP, ActionType.CONFIG_CHANGE];
    const sensitiveLogs = allLogs.filter(l =>
      sensitiveActions.includes(l.action) &&
      new Date(l.createdAt) >= weekStart  // 仅统计近一周
    );

    const alerts = sensitiveLogs.map(log => ({
      id: log.id,
      level: log.result === LogResult.FAILURE ? 'high' : 'medium',
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      adminName: log.adminName,
      result: log.result,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
      message: generateAlertMessage(log)
    }));

    // ========== 第七步：组装统计数据 ==========
    const statistics = {
      timeSummary: {
        today: {
          count: todayLogs.length,
          date: todayStart.toISOString().split('T')[0]
        },
        thisWeek: {
          count: weekLogs.length,
          startDate: weekStart.toISOString().split('T')[0],
          endDate: todayStart.toISOString().split('T')[0]
        },
        thisMonth: {
          count: monthLogs.length,
          startDate: monthStart.toISOString().split('T')[0]
        },
        total: allLogs.length
      },

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
        recentAlerts: alerts.slice(0, 20),  // 最近20条告警
        alertLevels: {
          high: alerts.filter(a => a.level === 'high').length,
          medium: alerts.filter(a => a.level === 'medium').length
        }
      },

      _meta: {
        generatedAt: new Date().toISOString(),
        dataSource: 'audit_logs表',
        dataFreshness: allLogs.length > 0
          ? `最新日志: ${new Date(allLogs[0].createdAt).toLocaleString('zh-CN')}`
          : '暂无数据'
      }
    };

    console.log(
      `[AuditService] 统计完成 | 总日志: ${allLogs.length} | ` +
      `今日: ${todayLogs.length} | 本周: ${weekLogs.length} | 告警: ${alerts.length}`
    );

    return {
      success: true,
      data: statistics
    };

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
 * 从HTTP方法推断操作类型
 *
 * 映射规则：
 * POST   → CREATE（新建资源）
 * PUT    → UPDATE（完整更新资源）
 * PATCH  → STATUS_CHANGE（部分更新，通常用于状态变更）
 * DELETE → DELETE（删除资源）
 *
 * 特殊URL路径会覆盖默认映射（如 /auth/login → LOGIN）
 *
 * @param {string} method - HTTP方法（GET/POST/PUT/PATCH/DELETE）
 * @param {string} url - 请求URL路径（可选，用于特殊判断）
 * @returns {string} 操作类型（ActionType枚举值）
 *
 * 使用示例：
 * inferActionFromMethod('POST');       // → 'CREATE'
 * inferActionFromMethod('PATCH');      // → 'STATUS_CHANGE'
 * inferActionFromMethod('POST', '/auth/login');  // → 'LOGIN'
 */
export function inferActionFromMethod(method, url = '') {
  // 标准HTTP方法到操作类型的映射
  const methodActionMap = {
    'POST': ActionType.CREATE,
    'PUT': ActionType.UPDATE,
    'PATCH': ActionType.STATUS_CHANGE,
    'DELETE': ActionType.DELETE
  };

  // 特殊URL路径覆盖规则
  const specialUrlPatterns = [
    { pattern: '/auth/login', action: ActionType.LOGIN },
    { pattern: '/auth/logout', action: ActionType.LOGOUT },
    { pattern: '/export', action: ActionType.EXPORT },
    { pattern: '/import', action: ActionType.IMPORT },
    { pattern: '/configs', action: ActionType.CONFIG_CHANGE },
    { pattern: '/batch', action: ActionType.BATCH_OP }
  ];

  // 检查是否匹配特殊URL模式
  for (const { pattern, action } of specialUrlPatterns) {
    if (url.toLowerCase().includes(pattern)) {
      return action;
    }
  }

  // 返回标准映射
  return methodActionMap[method.toUpperCase()] || 'UNKNOWN';
}

/**
 * 从URL路径推断目标类型
 *
 * 解析规则：
 * URL中包含 /users     → USER
 * URL中包含 /topics    → TOPIC
 * URL中包含 /souls     → SOUL
 * URL中包含 /debates   → DEBATE
 * URL中包含 /groups    → GROUP
 * URL中包含 /messages  → MESSAGE
 * URL中包含 /configs   → CONFIG
 * URL中包含 /admins    → ADMIN
 * URL中包含 /audit     → AUDIT_LOG
 * 其他                 → SYSTEM
 *
 * @param {string} url - 请求URL路径
 * @returns {string} 目标类型（TargetType枚举值）
 *
 * 使用示例：
 * inferTargetTypeFromUrl('/api/admin/v1/users/123');  // → 'USER'
 * inferTargetTypeFromUrl('/api/admin/v1/topics');      // → 'TOPIC'
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
 *
 * 安全措施：
 * 递归遍历对象，将敏感字段值替换为 '[REDACTED]'。
 * 支持嵌套对象和数组的深度过滤。
 *
 * 敏感字段包括：
 * password, token, secret, apiKey, creditCard, ssn 等
 *
 * @param {*} data - 要过滤的数据（对象或数组）
 * @returns {*} 过滤后的数据副本（不修改原对象）
 *
 * 使用示例：
 * filterSensitiveData({ name: 'test', password: '123456' });
 * // → { name: 'test', password: '[REDACTED]' }
 */
export function filterSensitiveData(data) {
  // 非对象类型直接返回
  if (!data || typeof data !== 'object') {
    return data;
  }

  // 数组递归处理
  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item));
  }

  // 对象递归处理
  const filtered = {};

  for (const key of Object.keys(data)) {
    const lowerKey = key.toLowerCase();

    // 检查是否为敏感字段
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      // 递归过滤嵌套对象
      filtered[key] = filterSensitiveData(data[key]);
    } else {
      filtered[key] = data[key];
    }
  }

  return filtered;
}

/**
 * 生成唯一请求ID
 *
 * 用于追踪一次完整的API请求生命周期，
 * 将请求和对应的审计日志关联起来。
 *
 * 格式：req_时间戳_随机字符串
 * 示例：req_1715612345678_a3f9k2m1
 *
 * @returns {string} 唯一的请求ID字符串
 */
function generateRequestId() {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `req_${timestamp}_${randomStr}`;
}

/**
 * 生成列表查询的统计摘要
 *
 * @param {Array} filteredLogs - 筛选后的日志数组
 * @returns {Object} 统计摘要对象
 */
function generateSummaryStats(filteredLogs) {
  const total = filteredLogs.length;

  if (total === 0) {
    return {
      total,
      successCount: 0,
      failureCount: 0,
      partialCount: 0,
      successRate: 0,
      uniqueAdmins: 0,
      uniqueTargets: 0
    };
  }

  const successCount = filteredLogs.filter(l => l.result === LogResult.SUCCESS).length;
  const failureCount = filteredLogs.filter(l => l.result === LogResult.FAILURE).length;
  const partialCount = filteredLogs.filter(l => l.result === LogResult.PARTIAL).length;

  const uniqueAdmins = new Set(filteredLogs.map(l => l.adminId)).size;
  const uniqueTargets = new Set(filteredLogs.filter(l => l.targetId).map(l => l.targetId)).size;

  return {
    total,
    successCount,
    failureCount,
    partialCount,
    successRate: parseFloat(((successCount / total) * 100).toFixed(1)),
    uniqueAdmins,
    uniqueTargets
  };
}

/**
 * 生成告警消息文本
 *
 * 根据日志内容生成人类可读的告警描述
 *
 * @param {Object} log - 审计日志对象
 * @returns {string} 告警消息
 */
function generateAlertMessage(log) {
  const messages = {
    [ActionType.DELETE]: `执行了${log.targetType}删除操作 (${log.targetId})`,
    [ActionType.BATCH_OP]: `执行了批量操作`,
    [ActionType.CONFIG_CHANGE]: `修改了系统配置`
  };

  const baseMsg = messages[log.action] || `执行了敏感操作: ${log.action}`;

  return log.result === LogResult.FAILURE
    ? `[失败] ${baseMsg} - ${log.errorMessage}`
    : baseMsg;
}

// ============================================
// 默认导出所有服务函数
// ============================================

/**
 * 服务导出汇总
 *
 * 本文件导出的所有服务函数：
 * - createAuditLog: 创建审计日志（被中间件和其他模块调用）
 * - getAuditLogs: 查询日志列表（A001接口）
 * - getAuditLogById: 获取日志详情（A003接口）
 * - getAuditStatistics: 审计统计（A002接口）
 * - inferActionFromMethod: HTTP方法→操作类型推断
 * - inferTargetTypeFromUrl: URL→目标类型推断
 * - filterSensitiveData: 敏感数据过滤
 *
 * 导出的常量：
 * - ActionType: 操作类型枚举
 * - TargetType: 目标类型枚举
 * - LogResult: 操作结果枚举
 */
export default {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  getAuditStatistics,
  inferActionFromMethod,
  inferTargetTypeFromUrl,
  filterSensitiveData
};
