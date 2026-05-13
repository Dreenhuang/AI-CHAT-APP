/**
 * 全局审计日志中间件 (Audit Logger Middleware)
 *
 * 功能说明：
 * 自动拦截所有API请求的写操作（POST/PUT/PATCH/DELETE），
 * 并记录详细的审计日志到数据库。这是安全合规的核心组件。
 *
 * 工作原理：
 * 1. 注册为Fastify的全局钩子（onRequest + onResponse）
 * 2. 在请求开始时记录时间戳
 * 3. 在请求完成后判断是否需要记录日志
 * 4. 异步写入审计日志（不阻塞响应）
 *
 * 核心特性：
 * - ✅ 全自动记录（无需业务代码手动调用）
 * - ✅ 智能推断操作类型和目标类型
 * - ✅ 敏感数据自动过滤
 * - ✅ 异步非阻塞（不影响API性能）
 * - ✅ 异常容错（日志记录失败不影响主流程）
 * - ✅ 支持手动触发（业务层可补充信息）
 *
 * 记录范围：
 * - 所有写操作：POST / PUT / PATCH / DELETE
 * - 特殊读操作：登录/登出（通过URL识别）
 * - 排除项：健康检查、静态资源、Swagger文档等
 *
 * 使用方式：
 * 在主入口文件 (src/index.js) 中注册：
 * ```javascript
 * import { auditLoggerPlugin } from './middleware/auditLogger.js';
 * await fastify.register(auditLoggerPlugin);
 * ```
 *
 * 或者作为路由级别的preHandler：
 * ```javascript
 * fastify.post('/users', { preHandler: [auditMiddleware] }, handler);
 * ```
 *
 * @module auditLogger
 */

import {
  createAuditLog,
  inferActionFromMethod,
  inferTargetTypeFromUrl,
  filterSensitiveData,
  ActionType,
  LogResult
} from '../services/auditService.js';

// ============================================
// 配置常量
// ============================================

/**
 * 不需要记录审计日志的路径前缀列表
 *
 * 这些路径通常是公开接口或系统内部接口，
 * 记录它们的访问日志没有业务价值且浪费存储空间。
 */
const EXCLUDED_PATH_PREFIXES = [
  '/health',                    // 健康检查
  '/docs',                      // Swagger文档
  '/swagger',                   // Swagger资源
  '/static',                    // 静态资源
  '/favicon.ico',               // 网站图标
  '/public'                     // 公开接口
];

/**
 * 只读HTTP方法（这些方法默认不记录）
 */
const READ_ONLY_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * 需要特殊处理的路径模式（即使GET也要记录）
 */
const SPECIAL_LOG_PATHS = [
  '/auth/login',
  '/auth/logout'
];

// ============================================
// 中间件核心函数
// ============================================

/**
 * 审计日志中间件（请求级别）
 *
 * 此函数会在每个API请求时被调用，
 * 负责判断是否需要记录审计日志。
 *
 * 工作流程：
 * 1. 检查是否需要排除该路径
 * 2. 判断是否是写操作或特殊路径
 * 3. 如果需要记录，在response中挂载待写数据
 * 4. 在onResponse钩子中异步写入数据库
 *
 * @param {Object} request - Fastify请求对象
 * @param {Object} reply - Fastify响应对象
 * @returns {void|Promise<void>}
 */
export async function auditLogger(request, reply) {
  try {
    // ========== 第一步：快速排除检查 ==========

    // 1.1 检查路径是否在排除列表中
    const shouldExclude = EXCLUDED_PATH_PREFIXES.some(prefix =>
      request.url.toLowerCase().startsWith(prefix.toLowerCase())
    );

    if (shouldExclude) {
      return;  // 直接放行，不记录日志
    }

    // 1.2 检查是否是只读方法且不是特殊路径
    const isReadOnlyMethod = READ_ONLY_METHODS.includes(request.method.toUpperCase());
    const isSpecialPath = SPECIAL_LOG_PATHS.some(path =>
      request.url.toLowerCase().includes(path.toLowerCase())
    );

    if (isReadOnlyMethod && !isSpecialPath) {
      return;  // GET/HEAD/OPTIONS请求不记录（除非是登录/登出）
    }

    // ========== 第二步：准备审计日志数据 ==========
    // 将起始时间戳挂载到request上，供后续计算耗时
    request._auditStartTime = Date.now();

    // 生成唯一请求ID（用于关联请求和日志）
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    request._auditRequestId = requestId;

    // 提取客户端信息
    const ipAddress = extractClientIp(request);
    const userAgent = request.headers['user-agent'] || '';

    // 推断操作类型和目标类型
    const action = inferActionFromMethod(request.method, request.url);
    const targetType = inferTargetTypeFromUrl(request.url);

    // 提取目标ID（从URL参数或请求体）
    const targetId = extractTargetId(request);

    // 提取操作人信息（如果已认证）
    const adminId = request.user?.admin_id || 'anonymous';
    const adminName = request.user?.username || '匿名用户';

    // ========== 第三步：将审计数据挂载到request ==========
    // 这些数据将在onResponse钩子中使用
    request._auditData = {
      requestId,
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      ipAddress,
      userAgent,

      // 请求体快照（敏感数据会被过滤）
      requestBody: request.body ? filterSensitiveData({ ...request.body }) : null
    };

    // ========== 第四步：注册响应完成钩子 ==========
    // 使用reply.hook确保在响应发送后执行
    reply.hook('onSend', async (payload, request) => {
      await writeAuditLogOnComplete(request, payload);
      return payload;  // 必须返回payload，不能修改响应内容
    });

  } catch (error) {
    // 中间件本身的异常绝不能阻断请求
    console.error('[AuditMiddleware] 中间件执行异常:', error.message);
    // 继续执行后续处理器
  }
}

/**
 * 在请求完成后写入审计日志
 *
 * 此函数在响应发送给客户端后被调用，
 * 因此不会影响API的响应速度。
 *
 * @param {Object} request - Fastify请求对象
 * @param {*} payload - 响应负载（可能被修改）
 */
async function writeAuditLogOnComplete(request, payload) {
  try {
    // 检查是否有待写的审计数据
    if (!request._auditData) {
      return;
    }

    const auditData = request._auditData;
    const startTime = request._auditStartTime || Date.now();
    const durationMs = Date.now() - startTime;

    // 判断操作结果（基于HTTP状态码）
    let result = LogResult.SUCCESS;
    let errorMessage = null;

    if (reply && reply.statusCode >= 400) {
      if (reply.statusCode >= 500) {
        result = LogResult.FAILURE;
        errorMessage = `服务器错误: HTTP ${reply.statusCode}`;
      } else if (reply.statusCode >= 400) {
        result = LogResult.FAILURE;
        errorMessage = `客户端错误: HTTP ${reply.statusCode}`;
      }
    }

    // 如果payload包含错误信息，提取它
    if (payload && typeof payload === 'object') {
      if (payload.success === false && payload.message) {
        result = LogResult.FAILURE;
        errorMessage = payload.message;
      }
    }

    // 构建完整的日志条目
    const logEntry = {
      ...auditData,

      // 操作结果
      result,
      errorMessage,

      // 性能数据
      durationMs,

      // 数据快照
      oldData: request.body?._oldData || null,  // 业务层可选提供
      newData: auditData.requestBody,

      // 额外详情
      details: {
        method: request.method,
        url: request.url,
        statusCode: reply?.statusCode,
        queryParameters: { ...request.query }
      }
    };

    // 异步写入数据库（不等待结果）
    // 使用fire-and-forget模式
    setImmediate(async () => {
      try {
        await createAuditLog(logEntry);
      } catch (error) {
        console.error('[AuditMiddleware] 写入审计日志失败:', error.message);
      }
    });

  } catch (error) {
    // 确保此函数的异常不会泄漏
    console.error('[AuditMiddleware] onResponse钩子执行异常:', error.message);
  }
}

// ============================================
// 辅助工具函数
// ============================================

/**
 * 提取客户端真实IP地址
 *
 * 支持代理场景下的IP提取优先级：
 * 1. X-Forwarded-For 头（反向代理设置）
 * 2. X-Real-IP 头（Nginx设置）
 * 3. Fastify的request.ip属性
 * 4. 回退到unknown
 *
 * @param {Object} request - Fastify请求对象
 * @returns {string} IP地址字符串
 */
function extractClientIp(request) {
  // 优先从代理头获取（适用于Nginx/CDN场景）
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For可能是逗号分隔的IP链，取第一个
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }

  // 使用Fastify内置的ip属性
  if (request.ip && request.ip !== '::1' && request.ip !== '127.0.0.1') {
    return request.ip;
  }

  return '127.0.0.1';  // 本地开发环境
}

/**
 * 从请求中提取目标ID
 *
 * 优先级：
 * 1. URL路径参数中的 :id（如 /users/:id）
 * 2. 请求体中的 id 字段
 * 3. 返回null表示无特定目标
 *
 * @param {Object} request - Fastify请求对象
 * @returns {string|null} 目标ID或null
 */
function extractTargetId(request) {
  // 1. 从URL参数获取（RESTful风格: /resource/:id）
  if (request.params && request.params.id) {
    return request.params.id;
  }

  // 2. 从查询参数获取（特殊情况）
  if (request.query && request.query.targetId) {
    return request.query.targetId;
  }

  // 3. POST创建操作通常没有targetId（目标尚未存在）
  // DELETE/PUT/PATCH操作应该有targetId
  return null;
}

// ============================================
// Fastify插件注册函数
// ============================================

/**
 * 审计日志插件注册函数
 *
 * 将审计中间件注册为全局 onRequest 钩子，
 * 这样所有的API请求都会经过审计处理。
 *
 * @param {FastifyInstance} fastify - Fastify应用实例
 * @param {Object} options - 配置选项（预留扩展）
 * @param {Function} done - 插件加载完成回调
 *
 * 配置选项示例：
 * ```javascript
 * {
 *   excludePaths: ['/health', '/docs'],  // 自定义排除路径
 *   logReadOnly: false,                  // 是否记录GET请求
 *   sampleRate: 1.0                      // 抽样率（1.0=全部记录）
 * }
 * ```
 */
export async function auditLoggerPlugin(fastify, options = {}) {
  // 合并配置选项
  const config = {
    excludePaths: options.excludePaths || [],
    logReadOnly: options.logReadOnly || false,
    sampleRate: options.sampleRate || 1.0,
    ...options
  };

  // 将自定义排除路径添加到全局列表
  if (config.excludePaths.length > 0) {
    EXCLUDED_PATH_PREFIXES.push(...config.excludePaths);
  }

  // 注册全局onRequest钩子
  fastify.addHook('onRequest', async (request, reply) => {
    // 抽样检查（如果配置了抽样率）
    if (config.sampleRate < 1.0 && Math.random() > config.sampleRate) {
      return;  // 跳过本次记录
    }

    // 调用核心审计逻辑
    await auditLogger(request, reply);
  });

  console.log('[AuditPlugin] 全局审计日志中间件已注册');
  console.log(`[AuditPlugin] 配置 | 抽样率: ${config.sampleRate * 100}% | 记录只读: ${config.logReadOnly}`);

  // 将辅助函数装饰到fastify实例上（方便其他地方使用）
  fastify.decorate('auditHelper', {
    createAuditLog,
    inferActionFromMethod,
    inferTargetTypeFromUrl,
    filterSensitiveData,
    ActionType,
    LogResult
  });
}

// ============================================
// 手动记录装饰器（用于业务层主动调用）
// ============================================

/**
 * 手动记录审计日志的装饰器
 *
 * 业务代码可以通过此方法主动记录额外的审计信息，
 * 或者在中间件自动记录的基础上补充更详细的数据。
 *
 * 使用方式（在路由处理器中）：
 * ```javascript
 * export async function updateUser(request, reply) {
 *   // ... 执行业务逻辑 ...
 *
 *   // 手动补充审计信息
 *   await request.logAudit({
 *     oldData: previousUserData,
 *     newData: updatedUserData,
 *     details: { reason: '用户申请修改昵称' }
 *   });
 *
 *   return reply.send(result);
 * }
 * ```
 *
 * @param {Object} additionalData - 额外的审计数据
 * @returns {Promise<Object>} 创建的日志对象
 */
async function manualAuditLog(additionalData = {}) {
  try {
    // 合并当前请求数据和额外数据
    const mergedData = {
      ...(this.request._auditData || {}),
      ...additionalData
    };

    return await createAuditLog(mergedData);

  } catch (error) {
    console.error('[AuditManual] 手动记录失败:', error.message);
    return null;
  }
}

// ============================================
// 导出
// ============================================

/**
 * 中间件导出汇总
 *
 * 导出的内容：
 * - auditLogger: 核心中间件函数（用于preHandler或onRequest钩子）
 * - auditLoggerPlugin: Fastify插件注册函数（用于全局注册）
 * - manualAuditLog: 手动记录装饰器（用于业务层主动调用）
 *
 * 使用方式一：全局注册（推荐）
 * ```javascript
 * import { auditLoggerPlugin } from './middleware/auditLogger.js';
 * await fastify.register(auditLoggerPlugin);
 * ```
 *
 * 使用方式二：路由级别
 * ```javascript
 * import { auditLogger } from './middleware/auditLogger.js';
 * fastify.post('/users', { preHandler: [auditLogger] }, handler);
 * ```
 */
export default {
  auditLogger,
  auditLoggerPlugin,
  manualAuditLog
};
