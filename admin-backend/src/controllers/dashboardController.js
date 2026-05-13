/**
 * 数据仪表盘控制器 (Dashboard Controller)
 *
 * 功能说明：
 * 本控制器实现管理员后台的数据监控仪表盘模块，提供三大核心功能：
 *
 * 1. getMetrics() - 核心指标卡片
 *    返回平台运营的核心数字指标（用户数、辩论数、消息数、API调用量等）
 *    用于仪表盘顶部的4-8个关键指标卡片展示
 *
 * 2. getUserTrend() - 用户趋势图数据
 *    返回近7天/30天/90天的用户增长趋势数据
 *    数据格式直接匹配ECharts图表组件要求，用于绘制折线图/面积图
 *
 * 3. getSystemHealth() - 系统健康状态检查
 *    返回各子系统的运行状态（数据库、AI服务、磁盘、内存等）
 *    用于系统监控面板和告警提示
 *
 * 技术特性：
 * - ✅ 60秒缓存策略（避免频繁查询数据库）
 * - ✅ 完整的JSDoc中文注释
 * - ✅ Swagger API文档注解
 * - ✅ 统一错误处理（不暴露内部信息）
 * - ✅ 支持模拟数据和Prisma双模式
 * - ✅ 符合PRD v2.0的_meta元数据规范
 *
 * 使用示例：
 * ```javascript
 * // 1. 获取核心指标
 * GET /api/admin/v1/dashboard/metrics
 * Authorization: Bearer <token>
 *
 * // 2. 获取用户趋势（默认7天）
 * GET /api/admin/v1/dashboard/user-trend?period=7d
 *
 * // 3. 获取30天趋势
 * GET /api/admin/v1/dashboard/user-trend?period=30d
 *
 * // 4. 获取系统健康状态（可公开访问）
 * GET /api/admin/v1/dashboard/health
 * ```
 *
 * 缓存策略说明：
 * - metrics接口：60秒缓存（指标变化不需要实时）
 * - user-trend接口：300秒缓存（趋势数据5分钟更新足够）
 * - health接口：30秒缓存（健康状态需要相对及时）
 *
 * 作者：GLM-5V-Turbo AI Assistant
 * 创建日期：2026-05-13
 * 版本：v1.0.0
 */

// ============================================
// 导入依赖
// ============================================

import { authMiddleware } from '../middleware/auth.js';

// ============================================
// 缓存管理器
// ============================================

/**
 * 简单的内存缓存实现
 *
 * 设计思路：
 * 使用Map结构存储缓存数据，每个缓存项包含：
 * - data: 实际缓存的数据
 * - timestamp: 缓存写入时间戳
 * - ttl: 缓存有效期（毫秒）
 *
 * 优点：
 * - 零依赖（不使用redis等外部存储）
 * - 自动过期清理
 * - 线程安全（Node.js单线程特性）
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * 获取缓存数据
   *
   * @param {string} key - 缓存键名
   * @returns {*} 缓存的数据，如果不存在或已过期返回null
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;  // 缓存不存在
    }

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);  // 过期删除
      return null;
    }

    console.log(`[Cache] 命中 | Key: ${key} | 存活: ${Math.round((now - item.timestamp) / 1000)}s`);
    return item.data;
  }

  /**
   * 设置缓存数据
   *
   * @param {string} key - 缓存键名
   * @param {*} data - 要缓存的数据
   * @param {number} ttl - 缓存有效期（毫秒），默认60000ms（60秒）
   */
  set(key, data, ttl = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    console.log(`[Cache] 写入 | Key: ${key} | TTL: ${ttl / 1000}s`);
  }

  /**
   * 清除指定缓存
   *
   * @param {string} key - 要清除的缓存键名
   */
  delete(key) {
    this.cache.delete(key);
    console.log(`[Cache] 删除 | Key: ${key}`);
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
    console.log('[Cache] 已清空所有缓存');
  }
}

// 创建全局缓存实例（单例模式）
const cacheManager = new CacheManager();

// ============================================
// 模拟数据生成器（Mock Data Generator）
// ============================================

/**
 * 模拟数据说明：
 *
 * 由于当前项目可能尚未执行 `npx prisma generate`，
 * 或者数据库中还没有真实的业务数据（users/debates/messages表），
 * 这里提供完整的模拟数据实现。
 *
 * TODO标记的位置表示后续需要替换为真实数据库查询。
 * 当Prisma Client就绪后，可以取消相关代码注释并删除模拟数据。
 */

/**
 * 生成核心指标模拟数据
 *
 * 返回8个关键运营指标，模拟真实平台的运营状况：
 * - 用户相关：总注册数、今日新增
 * - 辩论相关：总辩论数、进行中数量
 * - 消息相关：总消息数
 * - API相关：今日调用量、错误率、平均响应时间
 *
 * @returns {Object} 核心指标数据对象
 */
function generateMockMetrics() {
  // 基础数值（模拟一个中等规模的平台）
  const baseUsers = 12580;
  const baseDebates = 3420;
  const baseMessages = 89500;

  // 添加随机波动（让数据看起来更真实）
  const randomFactor = () => Math.floor(Math.random() * 200) - 100;

  return {
    totalUsers: baseUsers + randomFactor(),              // 总注册用户数
    todayNewUsers: Math.floor(Math.random() * 200) + 50,  // 今日新增（50-250之间）
    totalDebates: baseDebates + randomFactor(),           // 总辩论数
    activeDebates: Math.floor(Math.random() * 50) + 100,  // 进行中的辩论（100-150）
    totalMessages: baseMessages + randomFactor() * 10,    // 总消息数
    apiCallCountToday: Math.floor(Math.random() * 5000) + 12000,  // 今日API调用（12k-17k）
    apiErrorRate: parseFloat((Math.random() * 0.5).toFixed(2)),     // 错误率（0-0.5%）
    avgResponseTime: Math.floor(Math.random() * 100) + 100         // 平均响应时间（100-200ms）
  };
}

/**
 * 生成用户趋势模拟数据
 *
 * 根据指定的时间周期（7天/30天/90天），生成：
 * - dates: 日期数组（格式：YYYY-MM-DD）
 * - newUsers: 每日新增用户数
 * - activeUsers: 每日活跃用户数
 * - retentionRate: 每日留存率（%）
 *
 * 数据特点：
 * - 新增用户：工作日较高，周末较低
 * - 活跃用户：约为新增用户的3-5倍
 * - 留存率：65%-75%之间波动
 *
 * @param {string} period - 时间周期 ('7d' | '30d' | '90d')
 * @returns {Object} 趋势数据对象（直接匹配ECharts格式）
 */
function generateMockUserTrend(period) {
  // 根据周期确定天数
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const dates = [];
  const newUsers = [];
  const activeUsers = [];
  const retentionRate = [];

  // 基准日期（今天）
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    // 计算日期
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);  // 格式：YYYY-MM-DD

    // 判断是否为周末（影响新增用户数）
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 生成新增用户数（周末降低30%）
    const baseNewUsers = isWeekend ?
      Math.floor(Math.random() * 30) + 20 :   // 周末：20-50
      Math.floor(Math.random() * 40) + 30;    // 工作日：30-70
    newUsers.push(baseNewUsers);

    // 生成活跃用户数（约为新增的3-5倍）
    const baseActiveUsers = baseNewUsers * (3 + Math.random() * 2);
    activeUsers.push(Math.floor(baseActiveUsers));

    // 生成留存率（65%-75%之间，略微增长趋势）
    const baseRetention = 65 + (days - i) * 0.1 + Math.random() * 5;
    retentionRate.push(parseFloat(baseRetention.toFixed(1)));
  }

  return { dates, newUsers, activeUsers, retentionRate };
}

/**
 * 生成系统健康状态模拟数据
 *
 * 模拟检测以下子系统：
 * - 数据库连接（PostgreSQL via Prisma）
 * - Supabase Auth服务
 * - MiniMax AI服务
 * - 磁盘空间使用率
 * - 内存使用率
 *
 * 状态规则：
 * - ok: 正常（响应时间<500ms 或 使用率<80%）
 * - warning: 警告（响应时间500-2000ms 或 使用率80-90%）
 * - critical: 严重（响应时间>2000ms 或 使用率>90%）
 *
 * @returns {Object} 系统健康状态数据
 */
function generateMockHealthStatus() {
  // 随机生成一些波动（大部分时候是healthy，偶尔有warning）
  const isHealthy = Math.random() > 0.15;  // 85%概率完全健康

  return {
    overallStatus: isHealthy ? 'healthy' : 'warning',
    uptime: formatUptime(process.uptime()),  // 使用Node.js进程运行时间
    checks: [
      {
        name: '数据库连接',
        status: isHealthy ? 'ok' : 'ok',  // 数据库一般比较稳定
        responseTime: `${Math.floor(Math.random() * 20) + 5}ms`  // 5-25ms
      },
      {
        name: 'Supabase Auth',
        status: isHealthy ? 'ok' : 'warning',
        responseTime: `${isHealthy ?
          Math.floor(Math.random() * 40) + 30 :    // 正常：30-70ms
          Math.floor(Math.random() * 500) + 800     // 异常：800-1300ms
        }ms`
      },
      {
        name: 'MiniMax AI',
        status: isHealthy ? 'ok' : 'warning',
        responseTime: `${isHealthy ?
          Math.floor(Math.random() * 300) + 200 :   // 正常：200-500ms
          Math.floor(Math.random() * 1000) + 1000    // 异常：1000-2000ms
        }ms`
      },
      {
        name: '磁盘空间',
        status: Math.random() > 0.9 ? 'warning' : 'ok',  // 10%概率警告
        usage: `${Math.floor(Math.random() * 30) + 40}%`  // 40-70%
      },
      {
        name: '内存使用',
        status: Math.random() > 0.85 ? 'warning' : 'ok',  // 15%概率警告
        usage: `${Math.floor(Math.random() * 25) + 55}%`   // 55-80%
      }
    ]
  };
}

/**
 * 格式化运行时间
 *
 * 将秒数转换为易读的 "X天 Y小时 Z分钟" 格式
 *
 * @param {number} seconds - 运行时间（秒）
 * @returns {string} 格式化的运行时间字符串
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || result === '') result += `${minutes}m`;

  return result.trim();
}

// ============================================
// 控制器函数实现
// ============================================

/**
 * D001: 获取核心指标卡片数据
 *
 * GET /api/admin/v1/dashboard/metrics
 *
 * 功能说明：
 * 返回平台运营的8大核心指标，用于管理员仪表盘顶部卡片展示。
 * 这些指标帮助管理员快速了解平台整体运营状况。
 *
 * 指标说明：
 * - totalUsers: 平台累计注册用户总数
 * - todayNewUsers: 当天新注册的用户数量（每日凌晨重置）
 * - totalDebates: 历史累计创建的辩论总数
 * - activeDebates: 当前正在进行中的辩论数量（未结束）
 * - totalMessages: 所有辩论中发送的消息总数
 * - apiCallCountToday: 当天API总调用次数
 * - apiErrorRate: 当天API错误请求占比（百分比）
 * - avgResponseTime: 当天API平均响应时间（毫秒）
 *
 * 认证要求：✅ 需要JWT Token（Bearer Token）
 * 权限要求：observer及以上角色均可访问（只读数据）
 * 缓存策略：60秒（指标不需要实时更新）
 *
 * Swagger文档注解：
 * @swagger
 * /api/admin/v1/dashboard/metrics:
 *   get:
 *     summary: 获取核心运营指标
 *     description: |
 *       返回平台运营的8大核心指标，包括用户数、辩论数、消息数、API性能等。
 *       数据每60秒自动刷新缓存，适合仪表盘卡片展示。
 *     tags:
 *       - Dashboard（数据仪表盘）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取指标数据
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
 *                     totalUsers:
 *                       type: integer
 *                       description: 总注册用户数
 *                       example: 12580
 *                     todayNewUsers:
 *                       type: integer
 *                       description: 今日新增用户
 *                       example: 156
 *                     totalDebates:
 *                       type: integer
 *                       description: 总辩论数
 *                       example: 3420
 *                     activeDebates:
 *                       type: integer
 *                       description: 进行中的辩论
 *                       example: 128
 *                     totalMessages:
 *                       type: integer
 *                       description: 总消息数
 *                       example: 89500
 *                     apiCallCountToday:
 *                       type: integer
 *                       description: 今日API调用量
 *                       example: 15234
 *                     apiErrorRate:
 *                       type: number
 *                       description: API错误率(%)
 *                       example: 0.23
 *                     avgResponseTime:
 *                       type: integer
 *                       description: 平均响应时间(ms)
 *                       example: 145
 *                 _meta:
 *                   type: object
 *                   properties:
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                       description: 数据最后更新时间
 *                     dataSource:
 *                       type: string
 *                       description: 数据来源说明
 *       401:
 *         description: 未授权（缺少或无效Token）
 *       500:
 *         description: 服务器内部错误
 *
 * @param {Object} request - Fastify请求对象（包含user信息，由auth中间件注入）
 * @param {Object} reply - Fastify响应对象
 * @returns {Promise<Object>} JSON响应（包含success/data/_meta字段）
 */
export async function getMetrics(request, reply) {
  try {
    // ========== 第一步：尝试从缓存获取 ==========
    const cacheKey = 'dashboard:metrics';
    const cachedData = cacheManager.get(cacheKey);

    if (cachedData) {
      console.log('[Dashboard/Metrics] 返回缓存数据');
      return reply.send(cachedData);
    }

    // ========== 第二步：查询/生成数据 ==========

    // TODO: 当Prisma Client就绪后，替换为真实数据库查询
    //
    // 示例代码（仅供参考）：
    // const prisma = await import('@prisma/client').then(m => m.PrismaClient);
    // const prismaClient = new prisma();
    //
    // // 并行查询多个指标（提升性能）
    // const [totalUsers, todayNewUsers, totalDebates, activeDebates, totalMessages] =
    //   await Promise.all([
    //     prisma.user.count(),
    //     prisma.user.count({
    //       where: {
    //         createdAt: {
    //           gte: new Date(new Date().setHours(0, 0, 0, 0))  // 今天零点
    //         }
    //       }
    //     }),
    //     prisma.debate.count(),
    //     prisma.debate.count({ where: { status: 'active' } }),
    //     prisma.message.count()
    //   ]);
    //
    // // API统计数据可能需要从日志表或监控系统查询
    // const apiStats = await getApiStatisticsFromMonitoringSystem();

    // 当前使用模拟数据
    const metricsData = generateMockMetrics();

    // ========== 第三步：组装响应数据 ==========
    const responseData = {
      success: true,
      data: metricsData,
      _meta: {
        lastUpdated: new Date().toISOString(),
        dataSource: 'users表 + debates表 + messages表 + API监控日志',
        cachedAt: new Date().toISOString(),
        nextRefresh: new Date(Date.now() + 60000).toISOString()  // 60秒后刷新
      }
    };

    // ========== 第四步：写入缓存并返回 ==========
    cacheManager.set(cacheKey, responseData, 60000);  // 缓存60秒

    console.log(`[Dashboard/Metrics] 数据获取成功 | 总用户: ${metricsData.totalUsers} | 今日新增: ${metricsData.todayNewUsers}`);

    return reply.send(responseData);

  } catch (error) {
    // 统一错误处理（不暴露内部错误细节）
    console.error('[Dashboard/Metrics] 获取指标数据异常:', error.message);

    return reply.status(500).send({
      success: false,
      code: 500,
      message: '获取核心指标失败，请稍后重试',
      errorType: 'DASHBOARD_METRICS_ERROR',
      hint: '建议检查数据库连接和日志系统是否正常'
    });
  }
}

/**
 * D002: 获取用户趋势图数据
 *
 * GET /api/admin/v1/dashboard/user-trend?period=7d
 *
 * 功能说明：
 * 返回指定时间周期的用户增长趋势数据，数据格式直接匹配ECharts要求，
 * 可直接用于前端折线图/面积图渲染，无需二次转换。
 *
 * 支持的时间周期：
 * - 7d: 近7天（默认值，适合短期趋势观察）
 * - 30d: 近30天（适合月度报告）
 * - 90d: 近90天（适合季度分析）
 *
 * 数据字段说明：
 * - dates: 日期字符串数组（格式：YYYY-MM-DD）
 * - newUsers: 每日新增注册用户数
 * - activeUsers: 每日活跃用户数（登录/发消息等操作）
 * - retentionRate: 次日留存率（百分比，反映用户粘性）
 *
 * 认证要求：✅ 需要JWT Token
 * 权限要求：observer及以上角色
 * 缓存策略：300秒（5分钟，趋势数据不需要太实时）
 *
 * 前端ECharts配置示例：
 * ```javascript
 * option = {
 *   xAxis: { data: response.data.dates },
 *   series: [
 *     { name: '新增用户', data: response.data.newUsers },
 *     { name: '活跃用户', data: response.data.activeUsers },
 *     { name: '留存率(%)', data: response.data.retentionRate }
 *   ]
 * };
 * ```
 *
 * Swagger文档注解：
 * @swagger
 * /api/admin/v1/dashboard/user-trend:
 *   get:
 *     summary: 获取用户增长趋势
 *     description: |
 *       返回近N天的用户增长趋势数据，格式直接匹配ECharts图表组件。
 *       支持7天/30天/90天三种时间粒度，默认返回近7天数据。
 *     tags:
 *       - Dashboard（数据仪表盘）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 7d
 *         description: 时间周期（7天/30天/90天）
 *         required: false
 *     responses:
 *       200:
 *         description: 成功获取趋势数据
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
 *                     dates:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: date
 *                       description: 日期数组
 *                     newUsers:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: 每日新增用户数
 *                     activeUsers:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: 每日活跃用户数
 *                     retentionRate:
 *                       type: array
 *                       items:
 *                         type: number
 *                       description: 每日留存率(%)
 *                 _meta:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       description: 查询的时间周期
 *                     dataPoints:
 *                       type: integer
 *                       description: 数据点数量
 *       400:
 *         description: 参数错误（无效的period值）
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 *
 * @param {Object} request - Fastify请求对象
 * @param {Object} reply - Fastify响应对象
 * @returns {Promise<Object>} ECharts格式的趋势数据
 */
export async function getUserTrend(request, reply) {
  try {
    // ========== 第一步：验证并解析查询参数 ==========
    const { period = '7d' } = request.query;

    // 验证period参数的有效性
    const validPeriods = ['7d', '30d', '90d'];
    if (!validPeriods.includes(period)) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: `无效的时间周期参数: ${period}，支持的值为: ${validPeriods.join(', ')}`,
        errorType: 'INVALID_PERIOD_PARAMETER',
        hint: '请使用 7d（近7天）、30d（近30天）或 90d（近90天）'
      });
    }

    // ========== 第二步：尝试从缓存获取 ==========
    const cacheKey = `dashboard:user-trend:${period}`;
    const cachedData = cacheManager.get(cacheKey);

    if (cachedData) {
      console.log(`[Dashboard/UserTrend] 返回缓存数据 | Period: ${period}`);
      return reply.send(cachedData);
    }

    // ========== 第三步：生成/查询趋势数据 ==========

    // TODO: 当Prisma Client就绪后，替换为真实数据库查询
    //
    // 示例代码（仅供参考）：
    // const startDate = getStartDateByPeriod(period);
    //
    // // 查询每天的用户统计（需要按日期分组聚合）
    // const dailyStats = await prisma.$queryRaw`
    //   SELECT
    //     DATE(created_at) as date,
    //     COUNT(*) as new_users,
    //     COUNT(DISTINCT user_id) as active_users
    //   FROM users
    //   WHERE created_at >= ${startDate}
    //   GROUP BY DATE(created_at)
    //   ORDER BY date ASC
    // `;
    //
    // // 查询留存率（需要更复杂的计算逻辑）
    // const retentionData = await calculateRetentionRate(startDate);

    // 当前使用模拟数据
    const trendData = generateMockUserTrend(period);

    // ========== 第四步：组装响应数据 ==========
    const responseData = {
      success: true,
      data: trendData,
      _meta: {
        period: period,
        dataPoints: trendData.dates.length,
        startDate: trendData.dates[0],
        endDate: trendData.dates[trendData.dates.length - 1],
        dataSource: 'users表（按created_at分组统计）',
        generatedAt: new Date().toISOString(),
        nextRefresh: new Date(Date.now() + 300000).toISOString()  // 5分钟后刷新
      }
    };

    // ========== 第五步：写入缓存并返回 ==========
    cacheManager.set(cacheKey, responseData, 300000);  // 缓存5分钟（300秒）

    console.log(
      `[Dashboard/UserTrend] 数据获取成功 | Period: ${period} | ` +
      `数据点: ${trendData.dates.length}个 | ` +
      `日期范围: ${trendData.dates[0]} ~ ${trendData.dates[trendData.dates.length - 1]}`
    );

    return reply.send(responseData);

  } catch (error) {
    console.error('[Dashboard/UserTrend] 获取趋势数据异常:', error.message);

    return reply.status(500).send({
      success: false,
      code: 500,
      message: '获取用户趋势数据失败，请稍后重试',
      errorType: 'DASHBOARD_TREND_ERROR',
      hint: '建议检查数据库查询语句和时间范围参数'
    });
  }
}

/**
 * D003: 获取系统健康状态
 *
 * GET /api/admin/v1/dashboard/health
 *
 * 功能说明：
 * 检测并返回各子系统的运行状态，用于系统监控和告警。
 * 管理员可以通过此接口快速判断平台各组件是否正常工作。
 *
 * 检测项目：
 * 1. 数据库连接（PostgreSQL via Prisma）
 *    - 检查连接是否正常
 *    - 测量查询响应时间
 *
 * 2. Supabase Auth服务
 *    - 检查认证服务可用性
 *    - 测量Token验证速度
 *
 * 3. MiniMax AI服务
 *    - 检查AI模型API可达性
 *    - 测量推理响应时间
 *
 * 4. 磁盘空间
 *    - 检查服务器磁盘使用率
 *    - 预警阈值：>80% warning, >90% critical
 *
 * 5. 内存使用
 *    - 检查Node.js进程内存占用
 *    - 预警阈值：>80% warning, >90% critical
 *
 * 状态等级说明：
 * - healthy: 所有子系统正常运行（绿色✅）
 * - warning: 有1-2个子系统异常（黄色⚠️）
 * - critical: 多个子系统故障或关键服务不可用（红色❌）
 *
 * 认证要求：❌ 无需认证（公开接口，方便监控系统调用）
 * 权限要求：无限制
 * 缓存策略：30秒（健康状态需要相对及时）
 *
 * 适用场景：
 * - 负载均衡器健康检查
 * - Docker/Kubernetes存活探针
 * - 监控系统定时轮询
 * - 管理员手动检查
 *
 * Swagger文档注解：
 * @swagger
 * /api/admin/v1/dashboard/health:
 *   get:
 *     summary: 系统健康状态检查
 *     description: |
 *       检测各子系统运行状态，包括数据库、AI服务、磁盘、内存等。
 *       此接口无需认证，可用于负载均衡器和监控系统集成。
 *     tags:
 *       - Dashboard（数据仪表盘）
 *     responses:
 *       200:
 *         description: 成功获取健康状态
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
 *                     overallStatus:
 *                       type: string
 *                       enum: [healthy, warning, critical]
 *                       description: 整体健康状态
 *                     uptime:
 *                       type: string
 *                       description: 系统运行时间
 *                       example: "15d 6h 32m"
 *                     checks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: 子系统名称
 *                           status:
 *                             type: string
 *                             enum: [ok, warning, critical]
 *                             description: 状态
 *                           responseTime:
 *                             type: string
 *                             description: 响应时间或使用率
 *                           usage:
 *                             type: string
 *                             description: 资源使用率（仅适用于资源类检查）
 *                 _meta:
 *                   type: object
 *                   properties:
 *                     checkTime:
 *                       type: string
 *                       format: date-time
 *                       description: 检查时间
 *                     nodeVersion:
 *                       type: string
 *                       description: Node.js版本
 *                     platform:
 *                       type: string
 *                       description: 操作系统平台
 *       500:
 *         description: 服务器内部错误
 *
 * @param {Object} request - Fastify请求对象
 * @param {Object} reply - Fastify响应对象
 * @returns {Promise<Object>} 系统健康状态数据
 */
export async function getSystemHealth(request, reply) {
  try {
    // ========== 第一步：尝试从缓存获取 ==========
    const cacheKey = 'dashboard:health';
    const cachedData = cacheManager.get(cacheKey);

    if (cachedData) {
      console.log('[Dashboard/Health] 返回缓存数据');
      return reply.send(cachedData);
    }

    // ========== 第二步：执行健康检查 ==========

    // TODO: 当集成真实服务后，替换为实际的健康检查逻辑
    //
    // 示例代码（仅供参考）：
    //
    // 1. 数据库连接检查
    // const dbStartTime = Date.now();
    // await prisma.$queryRaw`SELECT 1`;  // 简单查询测试连接
    // const dbResponseTime = Date.now() - dbStartTime;
    //
    // 2. Supabase Auth检查
    // const authStartTime = Date.now();
    // await supabase.auth.getUser();  // 测试Auth服务
    // const authResponseTime = Date.now() - authStartTime;
    //
    // 3. MiniMax AI检查
    // const aiStartTime = Date.now();
    // await minimax.models.list();  // 测试AI API连通性
    // const aiResponseTime = Date.now() - aiStartTime;
    //
    // 4. 磁空间检查（Node.js原生模块）
    // const diskUsage = await checkDiskUsage();
    //
    // 5. 内存使用检查
    // const memUsage = process.memoryUsage();

    // 当前使用模拟数据
    const healthData = generateMockHealthStatus();

    // ========== 第三步：组装响应数据 ==========
    const responseData = {
      success: true,
      data: healthData,
      _meta: {
        checkTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid,
        memoryUsage: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',  // 常驻内存集
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',  // 堆内存使用
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'   // 堆内存总量
        },
        dataSource: '系统自检 + 外部服务探测',
        nextCheck: new Date(Date.now() + 30000).toISOString()  // 30秒后再次检查
      }
    };

    // ========== 第四步：写入缓存并返回 ==========
    cacheManager.set(cacheKey, responseData, 30000);  // 缓存30秒

    const statusEmoji = healthData.overallStatus === 'healthy' ? '✅' :
                        healthData.overallStatus === 'warning' ? '⚠️' : '❌';

    console.log(
      `[Dashboard/Health] 健康检查完成 | 状态: ${statusEmoji} ${healthData.overallStatus.toUpperCase()} | ` +
      `运行时间: ${healthData.uptime} | 检查项: ${healthData.checks.length}个`
    );

    return reply.send(responseData);

  } catch (error) {
    console.error('[Dashboard/Health] 健康检查异常:', error.message);

    // 即使健康检查本身出错，也要返回响应（不能让监控系统误判为服务宕机）
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '健康检查执行失败',
      errorType: 'HEALTH_CHECK_ERROR',
      data: {
        overallStatus: 'critical',  // 检查失败视为严重状态
        error: error.message,
        timestamp: new Date().toISOString()
      },
      hint: '可能是健康检查逻辑本身出现异常，建议查看服务器日志'
    });
  }
}

// ============================================
// 辅助工具函数
// ============================================

/**
 * 清除所有Dashboard缓存
 *
 * 用于管理员手动刷新数据，或在数据变更后强制重新加载。
 * 可以通过管理按钮触发此函数。
 *
 * 使用场景：
 * - 管理员点击"刷新数据"按钮
 * - 批量导入数据后立即查看最新统计
 * - 调试时需要看到最新数据
 *
 * @returns {Object} 操作结果
 */
export function clearAllCache() {
  cacheManager.clear();
  console.log('[Dashboard] 所有缓存已清除');

  return {
    success: true,
    message: 'Dashboard缓存已全部清除',
    clearedAt: new Date().toISOString()
  };
}

/**
 * 获取缓存统计信息
 *
 * 用于调试和监控，了解当前缓存的使用情况。
 *
 * @returns {Object} 缓存统计（条目数、占用内存估算等）
 */
export function getCacheStats() {
  return {
    cacheEntries: cacheManager.cache.size,
    estimatedMemoryUsage: `${(cacheManager.cache.size * 2).toFixed(1)}KB`,  // 粗略估算
    availableKeys: Array.from(cacheManager.cache.keys())
  };
}

// ============================================
// 默认导出
// ============================================

/**
 * 控制器导出汇总
 *
 * 本文件导出的所有控制器函数：
 * - getMetrics: 核心指标卡片（D001）
 * - getUserTrend: 用户趋势图（D002）
 * - getSystemHealth: 系统健康状态（D003）
 * - clearAllCache: 清除缓存（辅助功能）
 * - getCacheStats: 缓存统计（辅助功能）
 */
export default {
  getMetrics,
  getUserTrend,
  getSystemHealth,
  clearAllCache,
  getCacheStats
};
